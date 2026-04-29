import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

export async function GET(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const source = searchParams.get("source")
  const city = searchParams.get("city")
  const province = searchParams.get("province")
  const search = searchParams.get("q")
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500)

  let query = supabase
    .from("discovered_gyms")
    .select(
      "id, source, source_query, name, name_th, city, province, country, lat, lng, " +
        "phone, email, website, instagram, facebook, line_id, " +
        "google_place_id, google_rating, google_review_count, google_photos, " +
        "ai_summary, ai_tags, status, linked_org_id, invited_at, claimed_at, " +
        "last_crawled_at, last_extracted_at, notes, created_at, updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (status) query = query.eq("status", status)
  if (source) query = query.eq("source", source)
  if (city) query = query.ilike("city", `%${city}%`)
  if (province) query = query.ilike("province", `%${province}%`)
  if (search) query = query.or(`name.ilike.%${search}%,name_th.ilike.%${search}%,address.ilike.%${search}%`)

  const { data, count, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ gyms: data || [], total: count ?? 0 })
}

export async function POST(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const insert: Record<string, unknown> = {
    source: "manual",
    name: body.name,
  }
  const allowed = [
    "name_th", "address", "city", "province", "country", "lat", "lng",
    "phone", "email", "website", "instagram", "facebook", "line_id", "notes",
  ]
  for (const key of allowed) {
    if (key in body) insert[key] = body[key]
  }

  const { data, error } = await supabase
    .from("discovered_gyms")
    .insert(insert)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ gym: data })
}
