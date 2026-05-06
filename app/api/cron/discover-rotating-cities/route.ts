/**
 * Daily rotating-cities discovery cron.
 *
 * Scheduled by vercel.json. Runs once a day. Picks 3 Thai cities from
 * a rotating list and runs a Google Places "muay thai gym" search for
 * each. New gyms land in `discovered_gyms` with status='discovered'
 * and surface in /platform-admin → Network for the operator to review.
 *
 * Why rotating: hitting every city every night is wasteful (most cities
 * don't add new gyms daily) and burns Google Places quota. Rotating
 * means each major city gets refreshed every ~5 days, which catches
 * net-new gyms without quota burn.
 *
 * Why automatic: the user's vision is a backpack-operator running a
 * Thailand-wide network. Manually clicking "Run discovery" in the
 * Network tab every day doesn't scale; the system should be filling the
 * pipeline while the operator sleeps.
 *
 * Auth: Vercel cron sends Authorization: Bearer ${CRON_SECRET}. Same
 * auth pattern as /api/cron/trial-nudge.
 *
 * Idempotent by construction: upsertGooglePlace dedups on
 * (source='google', source_id=place_id), so re-running the same city
 * is safe — only net-new places insert.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { searchText, GooglePlacesNotConfiguredError } from "@/lib/discovery/google-places"
import { upsertGooglePlace } from "@/lib/discovery/upsert"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Major Thai cities + provinces with active Muay Thai scenes. The list
 * stays under ~15 so the rotation cycles every ~5 days at 3 cities/night.
 * Order is roughly by Muay Thai presence (Bangkok + Pai + Chiang Mai +
 * Phuket lead, then provincial + tourist hubs).
 */
const CITIES: ReadonlyArray<{ name: string; query: string }> = [
  { name: "Bangkok", query: "muay thai gym in Bangkok, Thailand" },
  { name: "Pai", query: "muay thai gym in Pai, Mae Hong Son, Thailand" },
  { name: "Chiang Mai", query: "muay thai gym in Chiang Mai, Thailand" },
  { name: "Phuket", query: "muay thai gym in Phuket, Thailand" },
  { name: "Pattaya", query: "muay thai gym in Pattaya, Thailand" },
  { name: "Krabi", query: "muay thai gym in Krabi, Thailand" },
  { name: "Koh Samui", query: "muay thai gym in Koh Samui, Thailand" },
  { name: "Hua Hin", query: "muay thai gym in Hua Hin, Thailand" },
  { name: "Chiang Rai", query: "muay thai gym in Chiang Rai, Thailand" },
  { name: "Ayutthaya", query: "muay thai gym in Ayutthaya, Thailand" },
  { name: "Khon Kaen", query: "muay thai gym in Khon Kaen, Thailand" },
  { name: "Udon Thani", query: "muay thai gym in Udon Thani, Thailand" },
]

const CITIES_PER_NIGHT = 3

/**
 * Pick today's cities by hashing the day-of-year against the city list
 * size. Deterministic per UTC day so retries within a day don't reshuffle.
 */
function pickTodaysCities(date: Date): Array<{ name: string; query: string }> {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const dayOfYear = Math.floor((date.getTime() - start) / 86400_000)
  const offset = (dayOfYear * CITIES_PER_NIGHT) % CITIES.length
  const picks: Array<{ name: string; query: string }> = []
  for (let i = 0; i < CITIES_PER_NIGHT; i++) {
    picks.push(CITIES[(offset + i) % CITIES.length])
  }
  return picks
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase credentials")
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  const expected = process.env.CRON_SECRET
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY not configured" },
      { status: 500 },
    )
  }

  const supabase = getServiceClient()
  const cities = pickTodaysCities(new Date())

  const summary: Array<{
    city: string
    found: number
    inserted: number
    updated: number
    error?: string
  }> = []

  for (const city of cities) {
    try {
      const places = await searchText({ query: city.query })
      let inserted = 0
      let updated = 0
      for (const place of places) {
        const result = await upsertGooglePlace({
          supabase,
          place,
          sourceQuery: city.query,
        })
        if (result.inserted) inserted++
        else if (result.id) updated++
      }
      summary.push({
        city: city.name,
        found: places.length,
        inserted,
        updated,
      })
    } catch (err) {
      if (err instanceof GooglePlacesNotConfiguredError) {
        summary.push({
          city: city.name,
          found: 0,
          inserted: 0,
          updated: 0,
          error: "google_places_not_configured",
        })
        break
      }
      summary.push({
        city: city.name,
        found: 0,
        inserted: 0,
        updated: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const totals = summary.reduce(
    (acc, s) => ({
      found: acc.found + s.found,
      inserted: acc.inserted + s.inserted,
      updated: acc.updated + s.updated,
    }),
    { found: 0, inserted: 0, updated: 0 },
  )

  return NextResponse.json({
    ok: true,
    date: new Date().toISOString().slice(0, 10),
    cities: cities.map((c) => c.name),
    totals,
    summary,
  })
}
