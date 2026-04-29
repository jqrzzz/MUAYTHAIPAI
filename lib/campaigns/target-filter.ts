import type { createClient } from "@/lib/supabase/server"
import type { TargetFilter } from "./types"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Apply a TargetFilter against discovered_gyms. Returns the matching
 * rows (capped) plus the total count BEFORE the limit was applied.
 *
 * Filters that need post-query filtering (e.g. ai_tags_any) run in JS.
 */
export async function applyTargetFilter(
  supabase: SupabaseClient,
  filter: TargetFilter,
  options?: { campaignId?: string; selectColumns?: string }
): Promise<{
  rows: Array<Record<string, unknown>>
  total: number
}> {
  const cols =
    options?.selectColumns ||
    "id, name, name_th, city, province, country, website, email, phone, " +
      "google_rating, ai_summary, ai_tags, status, source, last_extracted_at"

  let query = supabase.from("discovered_gyms").select(cols, { count: "exact" })

  if (filter.status && filter.status.length > 0) {
    query = query.in("status", filter.status)
  }
  if (filter.exclude_onboarded !== false) {
    // Default: skip already-onboarded gyms unless explicitly allowed
    query = query.neq("status", "onboarded")
  }
  if (filter.source && filter.source.length > 0) {
    query = query.in("source", filter.source)
  }
  if (filter.province) {
    query = query.ilike("province", `%${filter.province}%`)
  }
  if (filter.city) {
    query = query.ilike("city", `%${filter.city}%`)
  }
  if (filter.has_website === true) {
    query = query.not("website", "is", null)
  } else if (filter.has_website === false) {
    query = query.is("website", null)
  }
  if (filter.has_extraction === true) {
    query = query.not("last_extracted_at", "is", null)
  } else if (filter.has_extraction === false) {
    query = query.is("last_extracted_at", null)
  }
  if (filter.has_email === true) {
    query = query.not("email", "is", null)
  } else if (filter.has_email === false) {
    query = query.is("email", null)
  }
  if (filter.has_phone === true) {
    query = query.not("phone", "is", null)
  }
  if (typeof filter.min_rating === "number") {
    query = query.gte("google_rating", filter.min_rating)
  }
  // Order: most-extracted first (richer for AI personalization)
  query = query
    .order("last_extracted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  const cap = Math.max(1, Math.min(filter.limit ?? 200, 1000))
  query = query.limit(cap)

  const { data, count, error } = await query
  if (error) throw error

  let rows = (data || []) as Array<Record<string, unknown>>

  // Post-filter: ai_tags overlap (PostgREST's `cs`/`ov` works but JS is fine here)
  if (filter.ai_tags_any && filter.ai_tags_any.length > 0) {
    const wanted = new Set(filter.ai_tags_any.map((t) => t.toLowerCase()))
    rows = rows.filter((r) => {
      const tags = (r.ai_tags as string[] | null) || []
      return tags.some((t) => wanted.has(String(t).toLowerCase()))
    })
  }

  // Optional: skip gyms already in this campaign
  if (options?.campaignId && filter.exclude_already_in_campaign !== false) {
    const { data: existing } = await supabase
      .from("campaign_sends")
      .select("gym_id")
      .eq("campaign_id", options.campaignId)
    const taken = new Set((existing || []).map((s) => s.gym_id))
    rows = rows.filter((r) => !taken.has(r.id as string))
  }

  return { rows, total: count ?? rows.length }
}

/**
 * Resolve the channel-specific destination for a discovered gym.
 * Returns null if the gym has no usable address for the channel.
 */
export function resolveAddress(
  channel: "email" | "line" | "whatsapp" | "test",
  gym: { email?: string | null; line_id?: string | null; phone?: string | null }
): string | null {
  switch (channel) {
    case "email":
      return gym.email?.trim() || null
    case "line":
      return gym.line_id?.trim() || null
    case "whatsapp":
      return gym.phone?.trim() || null
    case "test":
      // Test channel — log only. Use the email if present for realism.
      return gym.email?.trim() || "test@local"
  }
}
