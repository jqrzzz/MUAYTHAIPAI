import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get the event
  const { data: event, error: eventError } = await supabase
    .from("fight_events")
    .select(`
      *,
      organizations (
        name,
        slug,
        logo_url
      )
    `)
    .eq("id", id)
    .eq("status", "published")
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Get bouts with fighter details
  const { data: bouts } = await supabase
    .from("event_bouts")
    .select(`
      id,
      bout_order,
      weight_class,
      scheduled_rounds,
      is_main_event,
      status,
      result,
      winner_id,
      result_round,
      result_notes,
      fighter_red:trainer_profiles!event_bouts_fighter_red_id_fkey (
        id,
        display_name,
        photo_url,
        fight_record_wins,
        fight_record_losses,
        fight_record_draws,
        weight_class,
        fighter_country,
        organizations (name, slug)
      ),
      fighter_blue:trainer_profiles!event_bouts_fighter_blue_id_fkey (
        id,
        display_name,
        photo_url,
        fight_record_wins,
        fight_record_losses,
        fight_record_draws,
        weight_class,
        fighter_country,
        organizations (name, slug)
      )
    `)
    .eq("event_id", id)
    .neq("status", "cancelled")
    .order("bout_order", { ascending: true })

  // Get ticket tiers
  const { data: tickets } = await supabase
    .from("event_tickets")
    .select(`
      id,
      tier_name,
      description,
      price_thb,
      price_usd,
      quantity_total,
      quantity_sold,
      is_active,
      sale_starts_at,
      sale_ends_at
    `)
    .eq("event_id", id)
    .eq("is_active", true)
    .order("price_thb", { ascending: true })

  return NextResponse.json({
    event,
    bouts: bouts || [],
    tickets: (tickets || []).map((t) => ({
      ...t,
      quantity_remaining: t.quantity_total - t.quantity_sold,
    })),
  })
}
