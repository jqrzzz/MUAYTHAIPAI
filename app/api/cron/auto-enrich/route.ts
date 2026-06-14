/**
 * Daily auto-enrichment cron.
 *
 * Runs the same Firecrawl-then-extract pipeline as
 * /api/platform-admin/discovery/enrich-batch but on a schedule, with
 * cron auth instead of platform-admin auth. Fires after the rotating-
 * cities discovery cron so net-new gyms found overnight are
 * automatically scraped + AI-extracted before the operator's morning
 * briefing.
 *
 * Why automatic: a discovered gym row with just a Google Places result
 * isn't enough to send an outreach invite — we need contact email,
 * services list, vibe summary. The enrich pipeline fills that in. Doing
 * it manually for every new discovery doesn't fit the backpack-operator
 * workflow.
 *
 * Limits: 8 gyms per run. Each gym takes ~10-30 seconds (Firecrawl +
 * Claude). Vercel serverless functions have a 60-second timeout on the
 * free plan, so 8 keeps us comfortably under. Each rotating-cities
 * night surfaces ~10-30 new gyms, so this cron catches up over a few
 * nights — a reliable, conservative cadence.
 *
 * Auth: Bearer ${CRON_SECRET}, same pattern as the other crons.
 *
 * Idempotent: only operates on gyms with `website` and `last_extracted_at
 * IS NULL`. Once a gym is enriched, it's skipped on future runs.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { scrapeUrl, FirecrawlNotConfiguredError } from "@/lib/discovery/firecrawl"
import { extractFromMarkdown } from "@/lib/discovery/extract"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BATCH_SIZE = 8

function getServiceClient() {
  return createServiceClient()
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  const expected = process.env.CRON_SECRET
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.FIRECRAWL_API_KEY) {
    return NextResponse.json(
      { error: "FIRECRAWL_API_KEY not configured" },
      { status: 500 },
    )
  }

  const supabase = getServiceClient()

  // Candidates: have a website, never been AI-extracted. Oldest-first
  // so we don't starve the long tail of provincial discoveries.
  const { data: candidates, error: fetchErr } = await supabase
    .from("discovered_gyms")
    .select("id, name, website, last_extracted_at")
    .not("website", "is", null)
    .is("last_extracted_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  // Total remaining for visibility (so the digest email can show progress)
  const { count: totalRemaining } = await supabase
    .from("discovered_gyms")
    .select("id", { count: "exact", head: true })
    .not("website", "is", null)
    .is("last_extracted_at", null)

  let succeeded = 0
  const failed: Array<{ id: string; name: string; reason: string }> = []
  const enrichedIds: string[] = []

  for (const c of candidates ?? []) {
    if (!c.website) continue
    try {
      const scrape = await scrapeUrl(c.website)
      await supabase
        .from("discovered_gyms")
        .update({
          raw_scrape_md: scrape.markdown,
          last_crawled_at: new Date().toISOString(),
        })
        .eq("id", c.id)

      const extraction = await extractFromMarkdown({
        markdown: scrape.markdown,
        gymName: c.name,
      })

      const contact = extraction.extraction.contact || {}
      const updates: Record<string, unknown> = {
        raw_extraction: extraction.extraction,
        ai_summary: extraction.ai_summary,
        ai_tags: extraction.ai_tags,
        last_extracted_at: new Date().toISOString(),
      }
      if (contact.email) updates.email = contact.email
      if (contact.phone) updates.phone = contact.phone
      if (contact.line_id) updates.line_id = contact.line_id
      if (contact.instagram) updates.instagram = contact.instagram
      if (contact.facebook) updates.facebook = contact.facebook

      await supabase.from("discovered_gyms").update(updates).eq("id", c.id)
      succeeded++
      enrichedIds.push(c.id)
    } catch (err) {
      const reason =
        err instanceof FirecrawlNotConfiguredError
          ? "FIRECRAWL_API_KEY not set"
          : err instanceof Error
            ? err.message
            : String(err)
      failed.push({ id: c.id, name: c.name, reason })

      // No point continuing the batch if Firecrawl is dead.
      if (err instanceof FirecrawlNotConfiguredError) break
    }
  }

  return NextResponse.json({
    ok: true,
    processed: (candidates ?? []).length,
    succeeded,
    failed,
    remaining: Math.max(0, (totalRemaining ?? 0) - succeeded),
    enriched_ids: enrichedIds,
  })
}
