import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { searchText, GooglePlacesNotConfiguredError } from "@/lib/discovery/google-places"
import { upsertGooglePlace } from "@/lib/discovery/upsert"

export async function POST(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const query = (body.query as string)?.trim()
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 })
  }

  try {
    const places = await searchText({
      query,
      lat: typeof body.lat === "number" ? body.lat : undefined,
      lng: typeof body.lng === "number" ? body.lng : undefined,
      radiusMeters: typeof body.radius_meters === "number" ? body.radius_meters : undefined,
      maxResultCount: typeof body.max_results === "number" ? body.max_results : undefined,
      languageCode: body.language_code,
    })

    let inserted = 0
    let updated = 0
    const ids: string[] = []
    for (const place of places) {
      const result = await upsertGooglePlace({ supabase, place, sourceQuery: query })
      if (result.id) ids.push(result.id)
      if (result.inserted) inserted++
      else if (result.id) updated++
    }

    return NextResponse.json({
      query,
      total_places: places.length,
      inserted,
      updated,
      gym_ids: ids,
    })
  } catch (err) {
    if (err instanceof GooglePlacesNotConfiguredError) {
      return NextResponse.json(
        { error: "Google Places not configured", detail: "Set GOOGLE_PLACES_API_KEY in env." },
        { status: 503 }
      )
    }
    console.error("[discovery/google-places] failed:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    )
  }
}
