import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get trainer profile for this user
  const { data: profile, error } = await supabase.from("trainer_profiles").select("*").eq("user_id", user.id).single()

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    display_name,
    title,
    bio,
    specialties,
    photo_url,
    photos,
    is_available,
    availability_note,
    years_experience,
    fight_record_wins,
    fight_record_losses,
    fight_record_draws,
    open_to_fights,
    open_to_events,
  } = body

  // Update trainer profile
  const { data, error } = await supabase
    .from("trainer_profiles")
    .update({
      display_name,
      title,
      bio,
      specialties,
      photo_url,
      photos,
      is_available,
      availability_note,
      years_experience,
      fight_record_wins,
      fight_record_losses,
      fight_record_draws,
      open_to_fights,
      open_to_events,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}

// Also support PUT method
export async function PUT(request: Request) {
  return PATCH(request)
}
