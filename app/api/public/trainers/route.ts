import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gymSlug = searchParams.get("gym") || "wisarut-family-gym"

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Get organization by slug
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", gymSlug).single()

  if (!org) {
    return NextResponse.json({ trainers: [] })
  }

  // Get trainers for this gym
  const { data: trainers, error } = await supabase
    .from("trainer_profiles")
    .select(`
      id,
      display_name,
      title,
      bio,
      photo_url,
      specialties,
      is_available,
      is_featured,
      fight_record_wins,
      fight_record_losses,
      fight_record_draws,
      years_experience,
      display_order
    `)
    .eq("org_id", org.id)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching trainers:", error)
    return NextResponse.json({ trainers: [] })
  }

  // Transform to match the expected format
  const formattedTrainers = (trainers || []).map((trainer) => ({
    id: trainer.id,
    name: trainer.display_name,
    nickname: trainer.title || "",
    record: `${trainer.fight_record_wins || 0}-${trainer.fight_record_losses || 0}-${trainer.fight_record_draws || 0}`,
    status: trainer.is_available ? "active" : "retired",
    bio: trainer.bio || "",
    image: trainer.photo_url,
    specialties: trainer.specialties || [],
    yearsExperience: trainer.years_experience,
  }))

  return NextResponse.json({ trainers: formattedTrainers })
}
