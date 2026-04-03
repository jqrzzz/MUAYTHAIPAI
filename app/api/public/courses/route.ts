import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/public/courses — list published courses
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const difficulty = searchParams.get("difficulty")

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
