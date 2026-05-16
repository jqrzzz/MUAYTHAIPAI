/**
 * GET /api/fighter/upcoming-bouts
 *
 * Surfaces a fighter's confirmed upcoming bouts for the trainer
 * dashboard widget. A fighter is one or more trainer_profile rows
 * owned by the current user. Returns event_bouts where:
 *   - This user's profile is in either corner
 *   - The event is published (not draft or cancelled)
 *   - The event date is today or later
 *
 * Ordered by event_date ascending so the closest fight is first.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

  const { data: profiles } = await supabase
    .from("trainer_profiles")
    .select("id, display_name")
    .eq("user_id", user.id)
  const profileIds = (profiles ?? []).map((p) => p.id)
  if (profileIds.length === 0) {
    return NextResponse.json({ bouts: [] })
  }

  const todayISO = new Date().toISOString().split("T")[0]

  // Two-step query — Supabase doesn't support OR across joined tables
  // cleanly via the builder, so we filter the bouts client-side after
  // pulling both corners. The data is tiny (a fighter's slate of
  // confirmed upcoming bouts is rarely double digits) so the round
  // trip is fine.
  const { data: bouts, error } = await supabase
    .from("event_bouts")
    .select(`
      id, weight_class, scheduled_rounds, is_main_event, bout_order,
      fighter_red_id, fighter_blue_id,
      fighter_red:trainer_profiles!event_bouts_fighter_red_id_fkey ( id, display_name ),
      fighter_blue:trainer_profiles!event_bouts_fighter_blue_id_fkey ( id, display_name ),
      event:fight_events!event_bouts_event_id_fkey (
        id, name, event_date, event_time, venue_name, venue_city, status
      )
    `)
    .or(`fighter_red_id.in.(${profileIds.join(",")}),fighter_blue_id.in.(${profileIds.join(",")})`)
    .neq("status", "cancelled")

  if (error) {
    console.warn("[upcoming-bouts] query failed:", error.message)
    return NextResponse.json({ bouts: [] })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = (bouts ?? []).filter((b: any) => {
    const event = Array.isArray(b.event) ? b.event[0] : b.event
    if (!event) return false
    if (event.status !== "published") return false
    if (!event.event_date) return false
    return event.event_date >= todayISO
  })

  // Shape for the client — pick the opposing corner's name so the UI
  // can display "vs Khun Pong" directly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaped = filtered.map((b: any) => {
    const event = Array.isArray(b.event) ? b.event[0] : b.event
    const red = Array.isArray(b.fighter_red) ? b.fighter_red[0] : b.fighter_red
    const blue = Array.isArray(b.fighter_blue) ? b.fighter_blue[0] : b.fighter_blue
    const youAreRed = profileIds.includes(b.fighter_red_id)
    const opponent = youAreRed ? blue : red
    return {
      id: b.id,
      corner: (youAreRed ? "red" : "blue") as "red" | "blue",
      weight_class: b.weight_class,
      scheduled_rounds: b.scheduled_rounds,
      is_main_event: !!b.is_main_event,
      bout_order: b.bout_order,
      opponent_name: opponent?.display_name ?? null,
      opponent_id: opponent?.id ?? null,
      event: {
        id: event.id,
        name: event.name,
        event_date: event.event_date,
        event_time: event.event_time ?? null,
        venue_name: event.venue_name ?? null,
        venue_city: event.venue_city ?? null,
      },
    }
  })

  shaped.sort((a, b) => {
    const da = a.event.event_date ?? ""
    const db = b.event.event_date ?? ""
    return da.localeCompare(db)
  })

  return NextResponse.json({ bouts: shaped })
}
