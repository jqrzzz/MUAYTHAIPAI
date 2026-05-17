/**
 * GET /api/promoter/events/[id]/interest
 *
 * Returns the size of the "Notify me when tickets go on sale" waitlist
 * for an event, plus a paginated list of the registered emails so the
 * promoter can manually email them when they open sales.
 *
 * Counts are exact (cheap — single COUNT query). The list is capped
 * at 1000 rows; for larger waitlists, we could add CSV export later
 * (the current MVP isn't expected to need it).
 *
 * Returns `count: 0` and `entries: []` if migration 065 isn't applied
 * yet (the underlying table doesn't exist) — so the editor UI can
 * still render without the section instead of throwing.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const LIST_CAP = 1000

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

  const { data, error, count } = await supabase
    .from("ticket_interest")
    .select("email, created_at, notified_at", { count: "exact" })
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(LIST_CAP)

  if (error) {
    // Pre-migration the table doesn't exist (42P01). Don't 500 — the
    // editor uses a count of 0 to hide the section entirely.
    if (error.code === "42P01") {
      return NextResponse.json({
        count: 0,
        entries: [],
        notified_count: 0,
        installed: false,
      })
    }
    console.error("[interest] read failed:", error)
    return NextResponse.json(
      { error: "Couldn't load interest list" },
      { status: 500 },
    )
  }

  const entries = data ?? []
  const notifiedCount = entries.filter((e) => !!e.notified_at).length

  return NextResponse.json({
    count: count ?? entries.length,
    entries: entries.slice(0, LIST_CAP),
    notified_count: notifiedCount,
    installed: true,
  })
}
