import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PATCH - Update trainer
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is owner or admin
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can update trainers" }, { status: 403 })
  }

  const body = await request.json()

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {}
  const allowedFields = [
    "display_name",
    "title",
    "bio",
    "photo_url",
    "specialties",
    "is_available",
    "is_featured",
    "availability_note",
    "years_experience",
    "fight_record_wins",
    "fight_record_losses",
    "fight_record_draws",
    "display_order",
  ]

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  updates.updated_at = new Date().toISOString()

  const { data: trainer, error } = await supabase
    .from("trainer_profiles")
    .update(updates)
    .eq("id", id)
    .eq("org_id", membership.org_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ trainer })
}

// DELETE - Remove trainer
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is owner
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only owners can delete trainers" }, { status: 403 })
  }

  const { error } = await supabase.from("trainer_profiles").delete().eq("id", id).eq("org_id", membership.org_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
