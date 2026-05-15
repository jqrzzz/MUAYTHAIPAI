/**
 * GET /api/fighter/invitations
 *
 * Returns pending + recent invitations for the current user (matched via
 * their trainer_profiles row). The fighter dashboard uses this to surface
 * the "you've been invited to fight" inbox.
 *
 * Optional ?status= filter (defaults to 'pending'). Use ?status=all to
 * include accepted / declined / cancelled for history.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Find every trainer_profile this user owns (a person could trainer at
  // multiple gyms — invitations target a specific profile so we keep them
  // separate per-gym).
  const { data: profiles } = await supabase
    .from("trainer_profiles")
    .select("id, display_name, org_id")
    .eq("user_id", user.id)
  const profileIds = (profiles ?? []).map((p) => p.id)
  if (profileIds.length === 0) {
    return NextResponse.json({ invitations: [] })
  }

  const url = new URL(request.url)
  const statusFilter = url.searchParams.get("status") ?? "pending"

  let query = supabase
    .from("bout_invitations")
    .select(`
      id, bout_id, corner, fighter_id, status, message,
      responded_at, decline_reason, created_at,
      invited_by_org_id,
      bout:event_bouts!bout_invitations_bout_id_fkey (
        id, weight_class, scheduled_rounds, is_main_event, bout_order,
        event:fight_events!event_bouts_event_id_fkey (
          id, name, event_date, event_time, venue_name, venue_city, status
        )
      ),
      inviting_org:organizations!bout_invitations_invited_by_org_id_fkey (
        id, name, city
      )
    `)
    .in("fighter_id", profileIds)
    .order("created_at", { ascending: false })

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter)
  }

  const { data, error } = await query
  if (error) {
    // Defensive — graceful degrade if migration 059 hasn't been applied.
    console.warn("[fighter.invitations.GET]", error.message)
    return NextResponse.json({ invitations: [] })
  }

  return NextResponse.json({ invitations: data ?? [] })
}
