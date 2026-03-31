import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const weightClass = searchParams.get("weight_class")
  const country = searchParams.get("country")
  const openToFights = searchParams.get("open_to_fights")
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 50)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = supabase
    .from("trainer_profiles")
    .select(`
      id,
      display_name,
      title,
      bio,
      photo_url,
      specialties,
      fight_record_wins,
      fight_record_losses,
      fight_record_draws,
      years_experience,
      weight_class,
      weight_kg,
      height_cm,
      reach_cm,
      fighter_country,
      is_available,
      open_to_fights,
      open_to_events,
      organizations (
        name,
        slug,
        city,
        province
      )
    `)
    .eq("is_available", true)
    .order("is_featured", { ascending: false })
    .order("fight_record_wins", { ascending: false })
    .limit(limit)

  if (weightClass) {
    query = query.eq("weight_class", weightClass)
  }
  if (country) {
    query = query.ilike("fighter_country", `%${country}%`)
  }
  if (openToFights === "true") {
    query = query.eq("open_to_fights", true)
  }

  const { data: fighters, error } = await query

  if (error) {
    console.error("Error fetching fighters:", error)
    return NextResponse.json({ fighters: [] })
  }

  const formatted = (fighters || []).map((f) => ({
    id: f.id,
    name: f.display_name,
    nickname: f.title || "",
    bio: f.bio || "",
    image: f.photo_url,
    record: `${f.fight_record_wins || 0}-${f.fight_record_losses || 0}-${f.fight_record_draws || 0}`,
    wins: f.fight_record_wins || 0,
    losses: f.fight_record_losses || 0,
    draws: f.fight_record_draws || 0,
    weight_class: f.weight_class,
    weight_kg: f.weight_kg,
    height_cm: f.height_cm,
    reach_cm: f.reach_cm,
    country: f.fighter_country,
    years_experience: f.years_experience,
    specialties: f.specialties || [],
    open_to_fights: f.open_to_fights,
    open_to_events: f.open_to_events,
    gym: f.organizations,
  }))

  return NextResponse.json({ fighters: formatted })
}
