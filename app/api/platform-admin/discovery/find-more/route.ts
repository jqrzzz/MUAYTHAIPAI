import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { researchRegion } from "@/lib/discovery/research"
import { searchText, GooglePlacesNotConfiguredError } from "@/lib/discovery/google-places"
import { upsertGooglePlace, insertResearchCandidate } from "@/lib/discovery/upsert"

/**
 * Two-stage discovery:
 *   1. Claude proposes candidate gyms by name in the requested region.
 *   2. Each candidate is verified against Google Places. Verified
 *      candidates upsert via google_place_id; unverified land as
 *      'claude_research' rows for the operator to triage manually.
 *
 * Verify=false skips stage 2 (useful when Google Places key isn't set
 * or the operator just wants the raw research list).
 */
export async function POST(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const region = (body.region as string)?.trim()
  if (!region) {
    return NextResponse.json({ error: "region is required" }, { status: 400 })
  }
  const verify = body.verify !== false
  const hint = body.hint as string | undefined
  const limit = typeof body.limit === "number" ? body.limit : 15

  let researchResult
  try {
    researchResult = await researchRegion({ region, hint, limit })
  } catch (err) {
    console.error("[discovery/find-more] research failed:", err)
    return NextResponse.json(
      {
        error: "AI research failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 }
    )
  }

  let verified = 0
  let unverified = 0
  const newRows: string[] = []

  for (const c of researchResult.candidates) {
    if (verify) {
      try {
        const places = await searchText({
          query: `${c.name} ${c.city} muay thai`,
          maxResultCount: 3,
        })
        const match =
          places.find((p) =>
            p.displayName?.text
              ?.toLowerCase()
              .includes(c.name.toLowerCase().split(" ")[0])
          ) || places[0]

        if (match) {
          const result = await upsertGooglePlace({
            supabase,
            place: match,
            sourceQuery: `find-more:${region}`,
          })
          if (result.id) newRows.push(result.id)
          verified++
          continue
        }
      } catch (err) {
        if (err instanceof GooglePlacesNotConfiguredError) {
          // Fall through: store as unverified candidate
        } else {
          console.warn("[discovery/find-more] Places verify failed for", c.name, err)
        }
      }
    }

    const id = await insertResearchCandidate({
      supabase,
      name: c.name,
      name_th: c.name_th,
      city: c.city,
      province: c.province,
      notes: [c.notable_for, `confidence:${c.confidence}`].filter(Boolean).join(" — "),
      source_query: `find-more:${region}`,
    })
    if (id) newRows.push(id)
    unverified++
  }

  return NextResponse.json({
    region,
    candidates: researchResult.candidates.length,
    verified,
    unverified,
    new_row_ids: newRows,
    notes: researchResult.notes,
  })
}
