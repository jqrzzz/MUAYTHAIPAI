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
    // Fighter-network stats added in migration 060. Optional — null/0
    // means the fighter hasn't filled them in yet and they just won't
    // appear on the directory / detail page.
    weight_class,
    weight_kg,
    height_cm,
    reach_cm,
    fighter_country,
  } = body

  // Build the update payload. Pass through only the fighter columns
  // that were actually present in the request body so we don't
  // clobber existing values when callers send a partial payload.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
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
  }
  if ("weight_class" in body) updates.weight_class = weight_class
  if ("weight_kg" in body) updates.weight_kg = weight_kg
  if ("height_cm" in body) updates.height_cm = height_cm
  if ("reach_cm" in body) updates.reach_cm = reach_cm
  if ("fighter_country" in body) updates.fighter_country = fighter_country

  const { data, error } = await supabase
    .from("trainer_profiles")
    .update(updates)
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
