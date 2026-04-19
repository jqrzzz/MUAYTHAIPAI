import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function getMembership() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, membership: null }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  return { supabase, membership }
}

export async function GET() {
  const { supabase, membership } = await getMembership()
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: timeSlots, error } = await supabase
    .from("time_slots")
    .select("*, services:service_id (name)")
    .eq("org_id", membership.org_id)
    .order("start_time", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ timeSlots: timeSlots || [] })
}

export async function POST(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()
  const { start_time, end_time, max_bookings, service_id, day_of_week } = body

  if (!start_time) {
    return NextResponse.json({ error: "start_time is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("time_slots")
    .insert({
      org_id: membership.org_id,
      start_time,
      end_time: end_time || null,
      max_bookings: max_bookings ?? 1,
      service_id: service_id || null,
      day_of_week: day_of_week ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ timeSlot: data })
}

export async function PATCH(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const allowed = ["start_time", "end_time", "max_bookings", "service_id", "day_of_week", "is_active"]
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in updates) filtered[key] = updates[key]
  }

  const { data, error } = await supabase
    .from("time_slots")
    .update(filtered)
    .eq("id", id)
    .eq("org_id", membership.org_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ timeSlot: data })
}

export async function DELETE(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("time_slots")
    .delete()
    .eq("id", id)
    .eq("org_id", membership.org_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
