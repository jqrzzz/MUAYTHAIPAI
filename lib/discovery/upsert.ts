import type { createClient } from "@/lib/supabase/server"
import type { PlacesSearchResult } from "./google-places"
import { extractAdministrative } from "./google-places"
import type { DiscoverySource } from "./types"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Upsert one Google Places result into discovered_gyms.
 * - Conflict key: google_place_id
 * - Existing rows are refreshed (rating, review count, photos) but
 *   never demoted in status.
 */
export async function upsertGooglePlace(params: {
  supabase: SupabaseClient
  place: PlacesSearchResult
  sourceQuery?: string
}): Promise<{ inserted: boolean; id: string | null }> {
  const { supabase, place } = params
  if (!place.id) return { inserted: false, id: null }

  const admin = extractAdministrative(place)
  const row = {
    source: "google" as DiscoverySource,
    source_query: params.sourceQuery || null,
    name: place.displayName?.text || "(unnamed)",
    address: place.formattedAddress || place.shortFormattedAddress || null,
    city: admin.city,
    province: admin.province,
    country: admin.country || "Thailand",
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    phone: place.internationalPhoneNumber || place.nationalPhoneNumber || null,
    website: place.websiteUri || null,
    google_place_id: place.id,
    google_rating: place.rating ?? null,
    google_review_count: place.userRatingCount ?? null,
    google_photos: place.photos
      ? place.photos.map((p) => ({
          name: p.name,
          width: p.widthPx,
          height: p.heightPx,
        }))
      : null,
    google_types: place.types || null,
    last_crawled_at: new Date().toISOString(),
  }

  // Check if it already exists
  const { data: existing } = await supabase
    .from("discovered_gyms")
    .select("id, crawl_count")
    .eq("google_place_id", place.id)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("discovered_gyms")
      .update({
        ...row,
        crawl_count: (existing.crawl_count ?? 0) + 1,
      })
      .eq("id", existing.id)
    return { inserted: false, id: existing.id }
  }

  const { data, error } = await supabase
    .from("discovered_gyms")
    .insert({ ...row, crawl_count: 1 })
    .select("id")
    .single()

  if (error || !data) {
    console.error("[discovery/upsert] insert failed:", error)
    return { inserted: false, id: null }
  }
  return { inserted: true, id: data.id }
}

/**
 * Insert a Claude-research candidate. We don't dedup on name (too fuzzy);
 * the operator marks duplicates manually after Google verification.
 */
export async function insertResearchCandidate(params: {
  supabase: SupabaseClient
  name: string
  name_th?: string
  city: string
  province?: string
  notes?: string
  source_query?: string
}): Promise<string | null> {
  const { supabase } = params
  const { data, error } = await supabase
    .from("discovered_gyms")
    .insert({
      source: "claude_research" as DiscoverySource,
      source_query: params.source_query || null,
      name: params.name,
      name_th: params.name_th || null,
      city: params.city,
      province: params.province || null,
      country: "Thailand",
      notes: params.notes || null,
      crawl_count: 0,
    })
    .select("id")
    .single()
  if (error || !data) {
    console.error("[discovery/upsert] research insert failed:", error)
    return null
  }
  return data.id
}
