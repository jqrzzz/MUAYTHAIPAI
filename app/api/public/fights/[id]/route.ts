/**
 * GET /api/public/fights/[id]
 *
 * Public event detail endpoint. Returns ONLY fields a visitor
 * should see — internal columns (created_by, org_id, updated_at,
 * etc.) stay server-side. Ticket tier details (price + remaining
 * count) are only included when the promoter has opened sales;
 * before that we hide everything except the existence of the
 * event so competitors can't scrape velocity.
 *
 * Cancelled events ARE served (with status='cancelled'), so the
 * public page can render a "this event was cancelled" banner
 * rather than 404'ing on bookmarked URLs.
 */
import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
// 60s public cache — promoters update events on a slow cadence and
// we don't want this hit on every visitor load.
export const revalidate = 60

// Whitelist of fields a public visitor can see. NEVER add internal
// audit columns (created_by, updated_at, org_id) — those expose
// platform mechanics or org-level data to scrapers.
const EVENT_PUBLIC_FIELDS = `
  id, name, description, event_date, event_time,
  venue_name, venue_address, venue_city, venue_province, venue_country,
  max_capacity, cover_image_url, status, ticket_sales_open, slug,
  organizations ( name, slug, logo_url )
` as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = createServiceClient()

  const { data: event, error: eventError } = await supabase
    .from("fight_events")
    .select(EVENT_PUBLIC_FIELDS)
    // Serve published + cancelled events (cancelled is rendered with
    // a banner client-side). Drafts stay private.
    .in("status", ["published", "cancelled"])
    .eq("id", id)
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

  // Ticket tiers: only surface when the promoter has opened sales.
  // Pre-open, we don't even tell the public what tiers exist (lets
  // promoters tease without leaking pricing structure to competitors).
  // Cancelled events also skip tickets — they're not buyable.
  let tickets: Array<{
    id: string
    tier_name: string | null
    description: string | null
    price_thb: number | null
    price_usd: number | null
    quantity_remaining: number
    sale_starts_at: string | null
    sale_ends_at: string | null
  }> = []

  if (event.ticket_sales_open && event.status === "published") {
    const { data: rawTickets } = await supabase
      .from("event_tickets")
      .select(`
        id, tier_name, description, price_thb, price_usd,
        quantity_total, quantity_sold,
        is_active, sale_starts_at, sale_ends_at
      `)
      .eq("event_id", id)
      .eq("is_active", true)
      .order("price_thb", { ascending: true })

    tickets = (rawTickets ?? []).map((t) => {
      // quantity_total + quantity_sold are intentionally NOT returned
      // — competitors could derive sales velocity from those. Only
      // `quantity_remaining` is surfaced, which the buy dialog needs
      // to enforce the per-order cap. A `sold_out` boolean covers the
      // UI "this tier is gone" state without leaking absolute numbers.
      const remaining = Math.max(
        0,
        (t.quantity_total ?? 0) - (t.quantity_sold ?? 0),
      )
      return {
        id: t.id,
        tier_name: t.tier_name,
        description: t.description,
        price_thb: t.price_thb,
        price_usd: t.price_usd,
        quantity_remaining: remaining,
        sale_starts_at: t.sale_starts_at,
        sale_ends_at: t.sale_ends_at,
      }
    })
  }

  return NextResponse.json({
    event,
    bouts: bouts || [],
    tickets,
  })
}
