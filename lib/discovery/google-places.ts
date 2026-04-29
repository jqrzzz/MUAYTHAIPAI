/**
 * Google Places API (v1) wrapper.
 *
 * Exposes two operations we use in the discovery pipeline:
 *   - searchText: free-text query like "muay thai gym chiang mai"
 *   - getPlaceDetails: fill in phone / website / opening hours for a place
 *
 * Configured via GOOGLE_PLACES_API_KEY. Until the key is set, callers
 * receive a structured "not configured" error so the UI can show a hint
 * instead of crashing.
 */

const PLACES_BASE = "https://places.googleapis.com/v1"

const SEARCH_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.types",
  "places.primaryType",
  "places.websiteUri",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.googleMapsUri",
  "places.addressComponents",
  "places.photos",
].join(",")

const DETAIL_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "types",
  "primaryType",
  "websiteUri",
  "internationalPhoneNumber",
  "nationalPhoneNumber",
  "googleMapsUri",
  "addressComponents",
  "photos",
  "regularOpeningHours",
  "editorialSummary",
].join(",")

export interface PlacesSearchResult {
  id: string
  displayName?: { text?: string; languageCode?: string }
  formattedAddress?: string
  shortFormattedAddress?: string
  location?: { latitude: number; longitude: number }
  rating?: number
  userRatingCount?: number
  types?: string[]
  primaryType?: string
  websiteUri?: string
  internationalPhoneNumber?: string
  nationalPhoneNumber?: string
  googleMapsUri?: string
  addressComponents?: Array<{
    longText?: string
    shortText?: string
    types?: string[]
  }>
  photos?: Array<{
    name?: string
    widthPx?: number
    heightPx?: number
  }>
  regularOpeningHours?: { weekdayDescriptions?: string[] }
  editorialSummary?: { text?: string }
}

export class GooglePlacesNotConfiguredError extends Error {
  constructor() {
    super("GOOGLE_PLACES_API_KEY is not set")
    this.name = "GooglePlacesNotConfiguredError"
  }
}

function getKey() {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) throw new GooglePlacesNotConfiguredError()
  return key
}

/**
 * Search for places by free-text query. Optional location bias narrows the
 * search to a circle (lat/lng + radius in metres, max 50000).
 */
export async function searchText(params: {
  query: string
  lat?: number
  lng?: number
  radiusMeters?: number
  maxResultCount?: number
  languageCode?: string
}): Promise<PlacesSearchResult[]> {
  const key = getKey()
  const body: Record<string, unknown> = {
    textQuery: params.query,
    maxResultCount: Math.min(params.maxResultCount ?? 20, 20),
    languageCode: params.languageCode ?? "en",
  }
  if (params.lat != null && params.lng != null) {
    body.locationBias = {
      circle: {
        center: { latitude: params.lat, longitude: params.lng },
        radius: Math.min(params.radiusMeters ?? 25000, 50000),
      },
    }
  }

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": SEARCH_FIELDS,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Google Places search failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as { places?: PlacesSearchResult[] }
  return json.places || []
}

export async function getPlaceDetails(placeId: string): Promise<PlacesSearchResult | null> {
  const key = getKey()
  const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": DETAIL_FIELDS,
    },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Google Places details failed (${res.status}): ${text}`)
  }
  return (await res.json()) as PlacesSearchResult
}

/**
 * Pull city + province from Google's address components.
 */
export function extractAdministrative(place: PlacesSearchResult): {
  city: string | null
  province: string | null
  country: string | null
} {
  const comps = place.addressComponents || []
  const find = (...types: string[]) =>
    comps.find((c) => (c.types || []).some((t) => types.includes(t)))
  const city =
    find("locality", "administrative_area_level_2", "postal_town")?.longText ?? null
  const province =
    find("administrative_area_level_1")?.longText ?? null
  const country = find("country")?.longText ?? null
  return { city, province, country }
}
