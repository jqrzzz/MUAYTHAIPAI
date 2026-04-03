import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") // active, retired, all
  const gym = searchParams.get("gym") // gym slug filter
  const search = searchParams.get("q") // search by name
  const weightClass = searchParams.get("weight_class")
  const openToFights = searchParams.get("open_to_fights")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 50)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = supabase
    .from("fighters")
    .select(`
      *,
      organizations:gym_id (name, slug, city)
    `)
    .order("status", { ascending: true })
    .order("wins", { ascending: false })
    .limit(limit)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  if (gym) {
    query = query.eq("organizations.slug", gym)
  }

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,ring_name.ilike.%${search}%`)
  }

  if (weightClass) {
    query = query.eq("weight_class", weightClass)
  }

  if (openToFights === "true") {
    query = query.eq("open_to_fights", true)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching fighters:", error)
    return NextResponse.json({ fighters: [] })
  }

  // Flatten gym data for easier consumption
  const fighters = (data || []).map((f: Record<string, unknown>) => {
    const org = f.organizations as Record<string, unknown> | null
    return {
      ...f,
      organizations: undefined,
      gym_name: org?.name || null,
      gym_slug: org?.slug || null,
      gym_city: org?.city || null,
    }
  })

  return NextResponse.json({ fighters })
}
