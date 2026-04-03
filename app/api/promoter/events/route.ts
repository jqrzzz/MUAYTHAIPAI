import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth } from "@/lib/auth-helpers"
import { NextResponse } from "next/server"

// GET - List events for the promoter's org
export async function GET() {
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: events, error } = await supabase
    .from("fight_events")
    .select(`
      id,
      name,
      event_date,
      event_time,
      venue_name,
      venue_city,
      status,
      ticket_sales_open,
      max_capacity,
      created_at
    `)
    .eq("org_id", auth.orgId)
    .order("event_date", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get bout counts and ticket sales per event
  const eventIds = (events || []).map((e) => e.id)
  let boutCounts: Record<string, number> = {}
  let ticketSales: Record<string, { sold: number; revenue: number }> = {}

  if (eventIds.length > 0) {
    const { data: bouts } = await supabase
      .from("event_bouts")
      .select("event_id")
      .in("event_id", eventIds)
      .neq("status", "cancelled")

    if (bouts) {
      for (const b of bouts) {
        boutCounts[b.event_id] = (boutCounts[b.event_id] || 0) + 1
      }
    }

    const { data: orders } = await supabase
      .from("ticket_orders")
      .select("event_id, quantity, total_price_thb")
      .in("event_id", eventIds)
      .eq("payment_status", "paid")
      .eq("status", "confirmed")

    if (orders) {
      for (const o of orders) {
        const existing = ticketSales[o.event_id] || { sold: 0, revenue: 0 }
        existing.sold += o.quantity
        existing.revenue += o.total_price_thb
        ticketSales[o.event_id] = existing
      }
    }
  }

  const formatted = (events || []).map((e) => ({
    ...e,
    bout_count: boutCounts[e.id] || 0,
    tickets_sold: ticketSales[e.id]?.sold || 0,
    revenue_thb: ticketSales[e.id]?.revenue || 0,
  }))

  return NextResponse.json({ events: formatted })
}

// POST - Create a new event
export async function POST(request: Request) {
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  const { data: event, error } = await supabase
    .from("fight_events")
    .insert({
      org_id: auth.orgId,
      created_by: auth.userId,
      name: body.name,
      description: body.description || null,
      event_date: body.event_date,
      event_time: body.event_time || null,
      venue_name: body.venue_name || null,
      venue_address: body.venue_address || null,
      venue_city: body.venue_city || null,
      venue_province: body.venue_province || null,
      venue_country: body.venue_country || "Thailand",
      max_capacity: body.max_capacity || null,
      status: "draft",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event })
}
