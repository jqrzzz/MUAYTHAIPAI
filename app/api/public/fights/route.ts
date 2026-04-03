import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || "published"
  const city = searchParams.get("city")
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = supabase
    .from("fight_events")
    .select(`
      id,
      name,
      description,
      event_date,
      event_time,
      cover_image_url,
      venue_name,
      venue_city,
      venue_province,
      venue_country,
      max_capacity,
      status,
      ticket_sales_open,
      created_at,
      organizations!inner (
        name,
        slug,
        logo_url
      )
    `)
    .eq("status", status)
    .order("event_date", { ascending: true })
    .limit(limit)

  if (city) {
    query = query.ilike("venue_city", `%${city}%`)
  }

  // Only show future events (or today)
  const today = new Date().toISOString().split("T")[0]
  query = query.gte("event_date", today)

  const { data: events, error } = await query

  if (error) {
    console.error("Error fetching fight events:", error)
    return NextResponse.json({ events: [] })
  }

  // Get bout counts for each event
  const eventIds = (events || []).map((e) => e.id)
  let boutCounts: Record<string, number> = {}
  let ticketData: Record<string, { min_price: number; tickets_available: boolean }> = {}

  if (eventIds.length > 0) {
    const { data: bouts } = await supabase
      .from("event_bouts")
      .select("event_id")
      .in("event_id", eventIds)
      .neq("status", "cancelled")

    if (bouts) {
      for (const bout of bouts) {
        boutCounts[bout.event_id] = (boutCounts[bout.event_id] || 0) + 1
      }
    }

    const { data: tickets } = await supabase
      .from("event_tickets")
      .select("event_id, price_thb, quantity_total, quantity_sold")
      .in("event_id", eventIds)
      .eq("is_active", true)

    if (tickets) {
      for (const ticket of tickets) {
        const available = ticket.quantity_total - ticket.quantity_sold > 0
        const existing = ticketData[ticket.event_id]
        if (!existing || ticket.price_thb < existing.min_price) {
          ticketData[ticket.event_id] = {
            min_price: ticket.price_thb,
            tickets_available: existing?.tickets_available || available,
          }
        } else if (available) {
          existing.tickets_available = true
        }
      }
    }
  }

  const formatted = (events || []).map((event) => ({
    ...event,
    bout_count: boutCounts[event.id] || 0,
    min_ticket_price_thb: ticketData[event.id]?.min_price || null,
    tickets_available: ticketData[event.id]?.tickets_available || false,
  }))

  return NextResponse.json({ events: formatted })
}
