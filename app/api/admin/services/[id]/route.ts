import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// PATCH - Update a service
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's organization and verify they're owner/admin
  const { data: membership } = await supabase.from("org_members").select("org_id, role").eq("user_id", user.id).single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  // Verify service belongs to this org
  const { data: existingService } = await supabase.from("services").select("org_id").eq("id", id).single()

  if (!existingService || existingService.org_id !== membership.org_id) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 })
  }

  const body = await request.json()

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.description !== undefined) updateData.description = body.description
  if (body.category !== undefined) updateData.category = body.category
  if (body.price_thb !== undefined) updateData.price_thb = body.price_thb
  if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes
  if (body.requires_time_slot !== undefined) updateData.requires_time_slot = body.requires_time_slot
  if (body.is_active !== undefined) updateData.is_active = body.is_active
  if (body.is_featured !== undefined) updateData.is_featured = body.is_featured
  if (body.display_order !== undefined) updateData.display_order = body.display_order

  updateData.updated_at = new Date().toISOString()

  const { data: service, error } = await supabase.from("services").update(updateData).eq("id", id).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ service })
}

// DELETE - Delete a service
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's organization and verify they're owner
  const { data: membership } = await supabase.from("org_members").select("org_id, role").eq("user_id", user.id).single()

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only owners can delete services" }, { status: 403 })
  }

  // Verify service belongs to this org
  const { data: existingService } = await supabase.from("services").select("org_id").eq("id", id).single()

  if (!existingService || existingService.org_id !== membership.org_id) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 })
  }

  const { error } = await supabase.from("services").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
