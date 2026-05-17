/**
 * GET /api/promoter/events/[id]/marketing
 *
 * Returns the most recent draft per (platform, language) for the
 * event, plus any older history if requested. Used by the Marketing
 * tab to render the existing state on tab-open without forcing a
 * regenerate.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("marketing_drafts")
    .select("id, platform, language, caption, hashtags, status, created_at, used_at")
    .eq("event_id", eventId)
    .neq("status", "dismissed")
    .order("created_at", { ascending: false })
    .limit(64)

  if (error) {
    // Pre-migration → empty list, not an error. Tab still renders with
    // the "Generate" CTA.
    if (error.code === "42P01") {
      return NextResponse.json({ drafts: [], installed: false })
    }
    console.error("[marketing/list] failed:", error)
    return NextResponse.json(
      { error: "Couldn't load drafts" },
      { status: 500 },
    )
  }

  // Keep only the newest draft per (platform, language). Older
  // regenerations are kept in the DB for the learning loop but the
  // UI only shows the current iteration.
  const newestByPair = new Map<string, (typeof data)[number]>()
  for (const d of data ?? []) {
    const key = `${d.platform}|${d.language}`
    if (!newestByPair.has(key)) newestByPair.set(key, d)
  }

  return NextResponse.json({
    drafts: Array.from(newestByPair.values()),
    installed: true,
  })
}
