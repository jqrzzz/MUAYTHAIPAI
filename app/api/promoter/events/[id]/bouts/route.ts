import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"
import { NextResponse } from "next/server"

// GET - List bouts for an event
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

  const { data: bouts, error } = await supabase
    .from("event_bouts")
    .select(`
      *,
      fighter_red:trainer_profiles!event_bouts_fighter_red_id_fkey (
        id, display_name, photo_url, fight_record_wins, fight_record_losses,
        fight_record_draws, weight_class, fighter_country,
        organizations (name)
      ),
      fighter_blue:trainer_profiles!event_bouts_fighter_blue_id_fkey (
        id, display_name, photo_url, fight_record_wins, fight_record_losses,
        fight_record_draws, weight_class, fighter_country,
        organizations (name)
      )
    `)
    .eq("event_id", eventId)
    .order("bout_order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bouts: bouts || [] })
}

// POST - Add a bout to an event
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

  // Get next bout_order
  const { data: existing } = await supabase
    .from("event_bouts")
    .select("bout_order")
    .eq("event_id", eventId)
    .order("bout_order", { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].bout_order + 1 : 1

  const { data: bout, error } = await supabase
    .from("event_bouts")
    .insert({
      event_id: eventId,
      fighter_red_id: body.fighter_red_id || null,
      fighter_blue_id: body.fighter_blue_id || null,
      bout_order: body.bout_order ?? nextOrder,
      weight_class: body.weight_class || null,
      scheduled_rounds: body.scheduled_rounds || 5,
      is_main_event: body.is_main_event || false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bout })
}

// PATCH - Update a bout (via query param ?boutId=xxx)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const { searchParams } = new URL(request.url)
  const boutId = searchParams.get("boutId")

  if (!boutId) {
    return NextResponse.json({ error: "boutId required" }, { status: 400 })
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
    "fighter_red_id", "fighter_blue_id", "bout_order",
    "weight_class", "scheduled_rounds", "is_main_event",
    "status", "result", "winner_id", "result_round", "result_notes",
  ]

  const updates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  const { data: bout, error } = await supabase
    .from("event_bouts")
    .update(updates)
    .eq("id", boutId)
    .eq("event_id", eventId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bout })
}

// DELETE - Remove a bout (via query param ?boutId=xxx)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const { searchParams } = new URL(request.url)
  const boutId = searchParams.get("boutId")

  if (!boutId) {
    return NextResponse.json({ error: "boutId required" }, { status: 400 })
  }

  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const { error } = await supabase
    .from("event_bouts")
    .delete()
    .eq("id", boutId)
    .eq("event_id", eventId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
