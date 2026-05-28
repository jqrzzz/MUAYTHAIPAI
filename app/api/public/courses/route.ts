import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/public/courses — list a gym's published courses.
// `gym` slug is required so this endpoint never silently returns
// cross-gym data (every published course from every gym).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gymSlug = searchParams.get("gym")
  const category = searchParams.get("category")
  const difficulty = searchParams.get("difficulty")

  if (!gymSlug) {
    return NextResponse.json({ error: "Missing required `gym` param" }, { status: 400 })
  }

  // Resolve org by slug
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", gymSlug)
    .single()

  if (!org) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  let query = supabase
    .from("courses")
    .select(`
      id, title, slug, short_description, cover_image_url,
      difficulty, category, certificate_level,
      is_free, price_thb,
      total_modules, total_lessons, estimated_hours,
      is_featured, display_order,
      organizations:org_id (name, slug, logo_url)
    `)
    .eq("status", "published")
    .eq("org_id", org.id)
    .order("display_order")
    .order("created_at", { ascending: false })

  if (category) query = query.eq("category", category)
  if (difficulty) query = query.eq("difficulty", difficulty)

  const { data: courses, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ courses })
}
