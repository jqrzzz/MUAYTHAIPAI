/**
 * GET /api/admin/inbox/counts
 *
 * Small, focused endpoint for the admin sidebar badge. Returns:
 *   - awaiting     : conversations currently in status 'awaiting_human'
 *   - pendingDrafts: AI replies waiting for owner review
 *   - total        : sum of the two (what the badge actually shows)
 *
 * Kept separate from /conversations so the nav-bar poll stays cheap —
 * this uses `count: 'exact', head: true` so Postgres doesn't hand back
 * any rows, just the counts.
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: "No organization" }, { status: 403 })
  }

  const [awaitingRes, draftsRes] = await Promise.all([
    supabase
      .from("mtp_conversations")
      .select("id", { count: "exact", head: true })
      .eq("org_id", membership.org_id)
      .eq("status", "awaiting_human"),
    supabase
      .from("mtp_communication_log")
      .select("id", { count: "exact", head: true })
      .eq("org_id", membership.org_id)
      .eq("draft_status", "pending"),
  ])

  const awaiting = awaitingRes.count ?? 0
  const pendingDrafts = draftsRes.count ?? 0

  return NextResponse.json({
    awaiting,
    pendingDrafts,
    total: awaiting + pendingDrafts,
  })
}
