export type DiscoverySource = "google" | "firecrawl" | "claude_research" | "manual"

export type DiscoveryStatus =
  | "pending"
  | "reviewed"
  | "verified"
  | "invited"
  | "onboarded"
  | "ignored"
  | "duplicate"

export interface DiscoveredGym {
  id: string
  source: DiscoverySource
  source_query: string | null
  name: string
  name_th: string | null
  slug: string | null
  address: string | null
  city: string | null
  province: string | null
  country: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  line_id: string | null
  google_place_id: string | null
  google_rating: number | null
  google_review_count: number | null
  google_photos: GooglePhoto[] | null
  google_types: string[] | null
  raw_scrape_md: string | null
  raw_extraction: GymExtraction | null
  ai_summary: string | null
  ai_tags: string[] | null
  status: DiscoveryStatus
  duplicate_of: string | null
  linked_org_id: string | null
  invite_token: string | null
  invited_at: string | null
  invite_email: string | null
  claimed_at: string | null
  last_crawled_at: string | null
  crawl_count: number
  last_extracted_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface GooglePhoto {
  name?: string
  width?: number
  height?: number
  photoReference?: string
}

/**
 * Structured extraction shape that Claude fills from a scraped gym
 * website. Every field is optional — Claude omits ones it can't ground.
 */
export interface GymExtraction {
  about?: string
  schedule?: Array<{ day: string; time: string; type: string }>
  prices?: Array<{ label: string; price: string; period?: string }>
  trainers?: Array<{ name: string; role?: string; bio?: string }>
  services?: string[]
  has_accommodation?: boolean
  accommodation_details?: string
  cert_levels_offered?: string[]
  language_support?: string[]
  contact?: {
    phone?: string
    email?: string
    line_id?: string
    whatsapp?: string
    instagram?: string
    facebook?: string
  }
  classification?: {
    audience: "tourist" | "serious" | "mixed" | "unknown"
    skill_focus: ("beginner" | "intermediate" | "advanced" | "fighter")[]
    notes?: string
  }
}
