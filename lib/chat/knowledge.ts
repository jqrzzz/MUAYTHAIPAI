/**
 * Per-gym knowledge base loader.
 *
 * Compiles the slow-moving facts about one org (name, services, schedule,
 * FAQs, trainers) into a structured object that the AI system prompt can
 * serialize. Kept pure — callers pass in a Supabase client so the engine
 * owns connection lifecycle.
 *
 * This is Wave 8b scaffolding. Future iterations will:
 *   - Cache compiled KB per org for ~5min to avoid hitting DB on every message
 *   - Use Anthropic prompt caching on the rendered block (when we move
 *     concierge onto Claude in Wave 9)
 *   - Embed & retrieve KB chunks when the block outgrows the context budget
 */
import type { SupabaseClient } from "@supabase/supabase-js"

export type GymKnowledgeService = {
  name: string
  description: string | null
  category: string
  price_thb: number | null
  price_usd: number | null
  duration_minutes: number | null
  duration_days: number | null
}

export type GymKnowledgeTimeSlot = {
  day_of_week: number | null
  start_time: string
  end_time: string | null
  service_name: string | null
}

export type GymKnowledgeFAQ = {
  category: string
  question: string
  answer: string
}

export type GymKnowledgeTrainer = {
  display_name: string
  title: string | null
  specialties: string[] | null
  bio: string | null
}

export type GymKnowledge = {
  orgId: string
  orgName: string
  slug: string
  description: string | null
  city: string | null
  province: string | null
  country: string | null
  timezone: string | null
  contactEmail: string | null
  contactPhone: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  website: string | null
  services: GymKnowledgeService[]
  schedule: GymKnowledgeTimeSlot[]
  faqs: GymKnowledgeFAQ[]
  trainers: GymKnowledgeTrainer[]
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

export async function loadGymKnowledge(
  supabase: SupabaseClient,
  orgId: string,
): Promise<GymKnowledge | null> {
  const { data: org } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, description, city, province, country, timezone, email, phone, whatsapp, instagram, facebook, website",
    )
    .eq("id", orgId)
    .maybeSingle()

  if (!org) return null

  // Parallel fetches — KB compile should be one round-trip worth of latency.
  const [servicesRes, slotsRes, faqsRes, trainersRes] = await Promise.all([
    supabase
      .from("services")
      .select(
        "name, description, category, price_thb, price_usd, duration_minutes, duration_days",
      )
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("time_slots")
      .select("day_of_week, start_time, end_time, services(name)")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("gym_faqs")
      .select("category, question, answer")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("usage_count", { ascending: false })
      .limit(40),
    supabase
      .from("trainer_profiles")
      .select("display_name, title, specialties, bio")
      .eq("org_id", orgId)
      .eq("is_available", true)
      .limit(20),
  ])

  const schedule: GymKnowledgeTimeSlot[] = (slotsRes.data ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row: any) => ({
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      service_name: Array.isArray(row.services)
        ? row.services[0]?.name ?? null
        : row.services?.name ?? null,
    }),
  )

  return {
    orgId: org.id,
    orgName: org.name,
    slug: org.slug,
    description: org.description,
    city: org.city,
    province: org.province,
    country: org.country,
    timezone: org.timezone,
    contactEmail: org.email,
    contactPhone: org.phone,
    whatsapp: org.whatsapp,
    instagram: org.instagram,
    facebook: org.facebook,
    website: org.website,
    services: (servicesRes.data ?? []) as GymKnowledgeService[],
    schedule,
    faqs: (faqsRes.data ?? []) as GymKnowledgeFAQ[],
    trainers: (trainersRes.data ?? []) as GymKnowledgeTrainer[],
  }
}

/**
 * Render a KB object as a compact prompt block. Kept deterministic
 * (stable ordering, no timestamps) so that when we switch to Anthropic
 * prompt caching this block is cacheable.
 */
export function renderKnowledgeBlock(kb: GymKnowledge): string {
  const lines: string[] = []

  lines.push(`# Gym: ${kb.orgName}`)
  const location = [kb.city, kb.province, kb.country].filter(Boolean).join(", ")
  if (location) lines.push(`Location: ${location}`)
  if (kb.timezone) lines.push(`Timezone: ${kb.timezone}`)
  if (kb.description) lines.push(`About: ${kb.description}`)

  const contactBits: string[] = []
  if (kb.contactEmail) contactBits.push(`email: ${kb.contactEmail}`)
  if (kb.contactPhone) contactBits.push(`phone: ${kb.contactPhone}`)
  if (kb.whatsapp) contactBits.push(`WhatsApp: ${kb.whatsapp}`)
  if (kb.instagram) contactBits.push(`Instagram: ${kb.instagram}`)
  if (kb.facebook) contactBits.push(`Facebook: ${kb.facebook}`)
  if (kb.website) contactBits.push(`Website: ${kb.website}`)
  if (contactBits.length) lines.push(`Contact: ${contactBits.join(" · ")}`)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"
  lines.push(`Booking page: ${siteUrl}/book?gym=${kb.slug}`)
  lines.push(`Gym profile: ${siteUrl}/gyms/${kb.slug}`)

  if (kb.services.length > 0) {
    lines.push("", "## Services & Pricing")
    for (const s of kb.services) {
      const price = formatPrice(s.price_thb, s.price_usd)
      const duration = formatDuration(s.duration_minutes, s.duration_days)
      const meta = [s.category, price, duration].filter(Boolean).join(" · ")
      lines.push(`- ${s.name} (${meta})`)
      if (s.description) lines.push(`  ${s.description}`)
    }
  }

  if (kb.schedule.length > 0) {
    lines.push("", "## Weekly Schedule")
    const byDay = new Map<number, GymKnowledgeTimeSlot[]>()
    for (const slot of kb.schedule) {
      const day = slot.day_of_week ?? -1
      const bucket = byDay.get(day) ?? []
      bucket.push(slot)
      byDay.set(day, bucket)
    }
    for (const [day, slots] of Array.from(byDay.entries()).sort(
      (a, b) => a[0] - b[0],
    )) {
      const dayLabel =
        day >= 0 && day <= 6 ? DAY_NAMES[day] : "Unscheduled / by arrangement"
      const entries = slots
        .map((s) => {
          const range = s.end_time
            ? `${s.start_time}–${s.end_time}`
            : s.start_time
          return s.service_name ? `${range} ${s.service_name}` : range
        })
        .join(", ")
      lines.push(`- ${dayLabel}: ${entries}`)
    }
  }

  if (kb.trainers.length > 0) {
    lines.push("", "## Trainers")
    for (const t of kb.trainers) {
      const header = [t.display_name, t.title].filter(Boolean).join(" — ")
      lines.push(`- ${header}`)
      if (t.specialties?.length) {
        lines.push(`  Specialties: ${t.specialties.join(", ")}`)
      }
      if (t.bio) lines.push(`  ${truncate(t.bio, 240)}`)
    }
  }

  if (kb.faqs.length > 0) {
    lines.push("", "## FAQs")
    for (const f of kb.faqs) {
      lines.push(`- [${f.category}] Q: ${f.question}`)
      lines.push(`  A: ${f.answer}`)
    }
  }

  return lines.join("\n")
}

function formatPrice(thb: number | null, usd: number | null): string {
  const parts: string[] = []
  if (thb !== null && thb !== undefined) parts.push(`฿${thb.toLocaleString()}`)
  if (usd !== null && usd !== undefined) parts.push(`$${usd}`)
  return parts.join(" / ")
}

function formatDuration(
  minutes: number | null,
  days: number | null,
): string {
  if (days) return `${days} day${days === 1 ? "" : "s"}`
  if (minutes) return `${minutes} min`
  return ""
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s
}
