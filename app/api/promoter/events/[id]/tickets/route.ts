import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"
import { NextResponse } from "next/server"

// GET - List ticket tiers for an event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

  const { data: tickets, error } = await supabase
    .from("event_tickets")
    .select("*")
    .eq("event_id", eventId)
    .order("price_thb", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tickets: tickets || [] })
}

// POST - Add a ticket tier
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

  const body = await request.json()

  if (!body.tier_name || !body.price_thb || !body.quantity_total) {
    return NextResponse.json(
      { error: "tier_name, price_thb, and quantity_total are required" },
      { status: 400 }
    )
  }

  const { data: ticket, error } = await supabase
    .from("event_tickets")
    .insert({
      event_id: eventId,
      tier_name: body.tier_name,
      description: body.description || null,
      price_thb: body.price_thb,
      price_usd: body.price_usd || null,
      quantity_total: body.quantity_total,
      is_active: body.is_active ?? true,
      sale_starts_at: body.sale_starts_at || null,
      sale_ends_at: body.sale_ends_at || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ticket })
}

// PATCH - Update a ticket tier (via query param ?ticketId=xxx)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const { searchParams } = new URL(request.url)
  const ticketId = searchParams.get("ticketId")

  if (!ticketId) {
    return NextResponse.json({ error: "ticketId required" }, { status: 400 })
  }

  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const body = await request.json()

  const allowedFields = [
    "tier_name", "description", "price_thb", "price_usd",
    "quantity_total", "is_active", "sale_starts_at", "sale_ends_at",
  ]

  const updates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  const { data: ticket, error } = await supabase
    .from("event_tickets")
    .update(updates)
    .eq("id", ticketId)
    .eq("event_id", eventId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ticket })
}

// DELETE - Remove a ticket tier (only if no orders exist)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const { searchParams } = new URL(request.url)
  const ticketId = searchParams.get("ticketId")

  if (!ticketId) {
    return NextResponse.json({ error: "ticketId required" }, { status: 400 })
  }

  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Check for existing orders before deleting
  const { data: orders } = await supabase
    .from("ticket_orders")
    .select("id")
    .eq("ticket_id", ticketId)
    .limit(1)

  if (orders && orders.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete ticket tier with existing orders. Deactivate it instead." },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from("event_tickets")
    .delete()
    .eq("id", ticketId)
    .eq("event_id", eventId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
