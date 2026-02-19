import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List trainers for org
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's org membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership) {
    return NextResponse.json({ error: "No organization access" }, { status: 403 })
  }

  const { data: trainers, error } = await supabase
    .from("trainer_profiles")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("display_order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ trainers })
}

// POST - Create new trainer
export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: "Only owners and admins can add trainers" }, { status: 403 })
  }

  const body = await request.json()
  const {
    display_name,
    title,
    bio,
    photo_url,
    specialties,
    is_available,
    is_featured,
    years_experience,
    fight_record_wins,
    fight_record_losses,
    fight_record_draws,
  } = body

  if (!display_name?.trim()) {
    return NextResponse.json({ error: "Trainer name is required" }, { status: 400 })
  }

  // Get max display_order
  const { data: maxOrder } = await supabase
    .from("trainer_profiles")
    .select("display_order")
    .eq("org_id", membership.org_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .single()

  const newOrder = (maxOrder?.display_order || 0) + 1

  const { data: trainer, error } = await supabase
    .from("trainer_profiles")
    .insert({
      org_id: membership.org_id,
      user_id: user.id, // Link to creating user for now
      display_name: display_name.trim(),
      title: title?.trim() || null,
      bio: bio?.trim() || null,
      photo_url: photo_url || null,
      specialties: specialties || [],
      is_available: is_available ?? true,
      is_featured: is_featured ?? false,
      years_experience: years_experience || null,
      fight_record_wins: fight_record_wins || 0,
      fight_record_losses: fight_record_losses || 0,
      fight_record_draws: fight_record_draws || 0,
      display_order: newOrder,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ trainer }, { status: 201 })
}
