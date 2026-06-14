/**
 * Daily auto-draft invites cron.
 *
 * After auto-enrich fills in contact info + ai_summary for newly
 * discovered gyms, this cron generates a personalized invite letter
 * (subject + body) for each one that's ready to send. The draft sits
 * on the discovered_gyms row waiting for the operator to approve in
 * the morning briefing.
 *
 * Eligibility: a gym is ready for auto-draft when it has all of:
 *   - email (so we have somewhere to send)
 *   - ai_summary (so we have something specific to personalize on)
 *   - status='discovered' (not already invited or onboarded)
 *   - auto_drafted_at IS NULL (haven't drafted before)
 *
 * Why we don't auto-send: outreach to a stranger's business email is
 * the highest-stakes thing OckOck does. The drafts queue up; the
 * operator approves in batches. Per the user's vision: "auto-pilot for
 * safe things, manual approve for outreach." This is the manual edge.
 *
 * Limit: 12 drafts per night. Each is ~1-2s of Claude. Stays well under
 * the 60-second serverless timeout. New discoveries trickle in over
 * many days so we'll catch up in 1-2 cron runs even after a big
 * discovery night.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { draftInviteLetter } from "@/lib/discovery/draft-invite"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BATCH_SIZE = 12

function getServiceClient() {
  return createServiceClient()
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  const expected = process.env.CRON_SECRET
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getServiceClient()

  // Candidates: enriched + has email + status discovered + no draft yet.
  // Oldest enrichment first so we don't favor newly-found cities.
  const { data: candidates, error: fetchErr } = await supabase
    .from("discovered_gyms")
    .select("id, name, city, province, email, ai_summary, ai_tags")
    .eq("status", "discovered")
    .not("email", "is", null)
    .not("ai_summary", "is", null)
    .is("auto_drafted_at", null)
    .order("last_extracted_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  // Total still-to-do count (so the digest email can show progress).
  const { count: totalRemaining } = await supabase
    .from("discovered_gyms")
    .select("id", { count: "exact", head: true })
    .eq("status", "discovered")
    .not("email", "is", null)
    .not("ai_summary", "is", null)
    .is("auto_drafted_at", null)

  let succeeded = 0
  const failed: Array<{ id: string; name: string; reason: string }> = []
  const drafted: Array<{ id: string; name: string; subject: string }> = []

  for (const c of candidates ?? []) {
    try {
      const location = [c.city, c.province].filter(Boolean).join(", ") || null
      const result = await draftInviteLetter({
        gymName: c.name,
        location,
        aiSummary: c.ai_summary,
        aiTags: (c.ai_tags as string[] | null) ?? null,
      })

      const { error: updErr } = await supabase
        .from("discovered_gyms")
        .update({
          auto_draft_subject: result.subject,
          auto_draft_body: result.body,
          auto_drafted_at: new Date().toISOString(),
        })
        .eq("id", c.id)

      if (updErr) {
        failed.push({ id: c.id, name: c.name, reason: updErr.message })
        continue
      }

      succeeded++
      drafted.push({ id: c.id, name: c.name, subject: result.subject })
    } catch (err) {
      failed.push({
        id: c.id,
        name: c.name,
        reason: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({
    ok: true,
    processed: (candidates ?? []).length,
    succeeded,
    failed,
    remaining: Math.max(0, (totalRemaining ?? 0) - succeeded),
    drafted,
  })
}
