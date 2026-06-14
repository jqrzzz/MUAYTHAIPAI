import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = createServiceClient()

  const { data: fighter, error } = await supabase
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
    .eq("id", id)
    .eq("is_available", true)
    .single()

  if (error || !fighter) {
    return NextResponse.json({ error: "Fighter not found" }, { status: 404 })
  }

  return NextResponse.json({
    fighter: {
      id: fighter.id,
      name: fighter.display_name,
      nickname: fighter.title || "",
      bio: fighter.bio || "",
      image: fighter.photo_url,
      record: `${fighter.fight_record_wins || 0}-${fighter.fight_record_losses || 0}-${fighter.fight_record_draws || 0}`,
      wins: fighter.fight_record_wins || 0,
      losses: fighter.fight_record_losses || 0,
      draws: fighter.fight_record_draws || 0,
      weight_class: fighter.weight_class,
      weight_kg: fighter.weight_kg,
      height_cm: fighter.height_cm,
      reach_cm: fighter.reach_cm,
      country: fighter.fighter_country,
      years_experience: fighter.years_experience,
      specialties: fighter.specialties || [],
      open_to_fights: fighter.open_to_fights,
      open_to_events: fighter.open_to_events,
      gym: fighter.organizations,
    },
  })
}
