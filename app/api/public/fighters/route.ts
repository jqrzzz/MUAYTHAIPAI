import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") // active, retired, all
  const gym = searchParams.get("gym") // gym slug filter
  const search = searchParams.get("q") // search by name

  let query = supabase
    .from("fighters")
    .select(`
      *,
      organizations:gym_id (name, slug, city)
    `)
    .order("status", { ascending: true })
    .order("wins", { ascending: false })

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  if (gym) {
    query = query.eq("organizations.slug", gym)
  }

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,ring_name.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
