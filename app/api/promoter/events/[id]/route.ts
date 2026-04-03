import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth } from "@/lib/auth-helpers"
import { NextResponse } from "next/server"

// GET - Get single event with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: event, error } = await supabase
    .from("fight_events")
    .select("*")
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .single()

  if (error || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  return NextResponse.json({ event })
}

// PATCH - Update event
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  const allowedFields = [
    "name", "description", "event_date", "event_time",
    "cover_image_url", "venue_name", "venue_address",
    "venue_city", "venue_province", "venue_country",
    "max_capacity", "status", "ticket_sales_open",
  ]

  const updates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const { data: event, error } = await supabase
    .from("fight_events")
    .update(updates)
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event })
}

// DELETE - Delete event (only drafts)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase
    .from("fight_events")
    .delete()
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .eq("status", "draft")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
