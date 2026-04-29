import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { searchText, GooglePlacesNotConfiguredError } from "@/lib/discovery/google-places"
import { upsertGooglePlace } from "@/lib/discovery/upsert"

/**
 * Bulk-add discovered gyms from a list of items. Each item is auto-classified:
 *   - looks like a URL  →  stored as a manual row with the URL as website
 *   - anything else     →  Google Places text search, results upserted
 *
 * Designed to be the operator's "paste a list and walk away" entrypoint.
 * Heavy enrichment (Firecrawl + Claude extraction) happens later, per-row,
 * via the existing /firecrawl + /extract endpoints.
 */

interface BulkItemResult {
  input: string
  kind: "url" | "query"
  ok: boolean
  message: string
  added?: number
  updated?: number
}

function isLikelyUrl(s: string) {
  return /^https?:\/\//i.test(s.trim())
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export async function POST(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const rawItems = (body.items as unknown[]) || []
  const items: string[] = (Array.isArray(rawItems) ? rawItems : [])
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, 100) // cap per request

  if (items.length === 0) {
    return NextResponse.json({ error: "items array is required (1–100 entries)" }, { status: 400 })
  }

  const results: BulkItemResult[] = []
  let totalAdded = 0
  let totalUpdated = 0

  for (const raw of items) {
    if (isLikelyUrl(raw)) {
      // Manual row keyed off the website URL — dedup by website
      const host = hostFromUrl(raw)
      const { data: existing } = await supabase
        .from("discovered_gyms")
        .select("id")
        .eq("website", raw)
        .maybeSingle()
      if (existing) {
        results.push({
          input: raw,
          kind: "url",
          ok: true,
          message: "Already in pipeline",
        })
        continue
      }
      const { error } = await supabase
        .from("discovered_gyms")
        .insert({
          source: "manual",
          name: host,
          website: raw,
          source_query: "bulk-import",
        })
      if (error) {
        results.push({ input: raw, kind: "url", ok: false, message: error.message })
      } else {
        totalAdded++
        results.push({
          input: raw,
          kind: "url",
          ok: true,
          message: `Added as manual row — Enrich to fetch name + details`,
          added: 1,
        })
      }
      continue
    }

    // Query → Google Places
    try {
      const places = await searchText({ query: raw, maxResultCount: 20 })
      let inserted = 0
      let updated = 0
      for (const p of places) {
        const r = await upsertGooglePlace({ supabase, place: p, sourceQuery: raw })
        if (r.id) {
          if (r.inserted) inserted++
          else updated++
        }
      }
      totalAdded += inserted
      totalUpdated += updated
      results.push({
        input: raw,
        kind: "query",
        ok: true,
        message: `${places.length} found • ${inserted} new • ${updated} updated`,
        added: inserted,
        updated,
      })
    } catch (err) {
      if (err instanceof GooglePlacesNotConfiguredError) {
        results.push({
          input: raw,
          kind: "query",
          ok: false,
          message: "GOOGLE_PLACES_API_KEY not set — query skipped",
        })
        continue
      }
      results.push({
        input: raw,
        kind: "query",
        ok: false,
        message: err instanceof Error ? err.message : "Search failed",
      })
    }
  }

  return NextResponse.json({
    processed: items.length,
    added: totalAdded,
    updated: totalUpdated,
    results,
  })
}
