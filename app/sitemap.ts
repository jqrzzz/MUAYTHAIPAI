import type { MetadataRoute } from "next"
import { createServiceClient } from "@/lib/supabase/service"
import { OCKOCK_HOST } from "@/lib/ockock/url"

const BASE_URL = "https://muaythaipai.com"

// Routes that live on ockock.app — set in one place so each entry below
// can pick the right host without sprinkling string concatenation around.
// Keep these mutually exclusive with the Pai routes; a path showing up
// on both domains confuses search engines about which one is canonical.
const OCKOCK_PATHS = new Set<string>([
  "/ockock",
  "/fights",
  "/fighters",
  "/for-gyms",
  "/pricing",
  "/vision",
  "/about",
  "/terms",
  "/privacy",
])
function urlFor(path: string): string {
  return `${OCKOCK_PATHS.has(path) ? OCKOCK_HOST : BASE_URL}${path}`
}

// Service-role client — sitemap is generated server-side and only reads
// columns we already expose on the public surfaces (certificate_number,
// public_*_handle, gym slug). It does NOT leak anything beyond what /verify,
// /i, /p, and /gyms already render.
const sb = createServiceClient()

type Route = {
  path: string
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority: number
}

// Public marketing routes. Admin, trainer, student, ockock, and api
// routes are intentionally excluded — they're either authenticated
// flows or not part of the gym's public site.
const staticRoutes: Route[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/classes", changeFrequency: "monthly", priority: 0.9 },
  { path: "/gym", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/fighters", changeFrequency: "monthly", priority: 0.8 },
  { path: "/certificate-programs", changeFrequency: "monthly", priority: 0.7 },
  { path: "/apprenticeship", changeFrequency: "monthly", priority: 0.7 },
  { path: "/train-and-stay", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/pai-thailand", changeFrequency: "monthly", priority: 0.6 },
  { path: "/education-visas", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.5 },
  { path: "/practitioners", changeFrequency: "weekly", priority: 0.7 },
  { path: "/instructors", changeFrequency: "weekly", priority: 0.7 },
  // OckOck product surfaces — public consumer routes that should be
  // crawlable so search engines and social can index fight nights +
  // fighter directory entries. These resolve to ockock.app via urlFor().
  { path: "/ockock", changeFrequency: "weekly", priority: 0.8 },
  { path: "/fights", changeFrequency: "daily", priority: 0.9 },
  { path: "/fighters", changeFrequency: "weekly", priority: 0.8 },
  { path: "/for-gyms", changeFrequency: "monthly", priority: 0.7 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-conditions", changeFrequency: "yearly", priority: 0.3 },
]

// Hard caps. Sitemaps can't exceed 50k URLs without splitting — we're
// nowhere near that today but we slice defensively so a bad query
// can't blow up the file.
const MAX_CERTS = 10000
const MAX_PROFILES = 5000
const MAX_GYMS = 5000
const MAX_FIGHTS = 5000
const MAX_FIGHTERS = 5000

async function dynamicEntries(): Promise<MetadataRoute.Sitemap> {
  const [certsRes, instructorsRes, passportsRes, gymsRes, fightsRes, fightersRes] = await Promise.all([
    sb
      .from("certificates")
      .select("certificate_number, issued_at")
      .eq("status", "active")
      .not("certificate_number", "is", null)
      .order("issued_at", { ascending: false })
      .limit(MAX_CERTS),
    sb
      .from("users")
      .select("public_instructor_handle, updated_at")
      .eq("public_instructor_enabled", true)
      .not("public_instructor_handle", "is", null)
      .limit(MAX_PROFILES),
    sb
      .from("users")
      .select("public_passport_handle, updated_at")
      .eq("public_passport_enabled", true)
      .not("public_passport_handle", "is", null)
      .limit(MAX_PROFILES),
    sb
      .from("organizations")
      .select("slug, updated_at")
      .eq("status", "active")
      .not("slug", "is", null)
      .limit(MAX_GYMS),
    // Published fight events — public detail page + buy ticket flow.
    sb
      .from("fight_events")
      .select("id, updated_at, event_date")
      .eq("status", "published")
      .order("event_date", { ascending: false })
      .limit(MAX_FIGHTS),
    // Opted-in fighters — public detail page on /ockock/fighters/[id].
    sb
      .from("trainer_profiles")
      .select("id, updated_at")
      .eq("is_available", true)
      .eq("open_to_fights", true)
      .limit(MAX_FIGHTERS),
  ])

  const entries: MetadataRoute.Sitemap = []

  for (const c of certsRes.data ?? []) {
    if (!c.certificate_number) continue
    entries.push({
      url: `${BASE_URL}/verify/${encodeURIComponent(c.certificate_number)}`,
      lastModified: c.issued_at ? new Date(c.issued_at) : new Date(),
      changeFrequency: "yearly",
      priority: 0.6,
    })
  }

  for (const u of instructorsRes.data ?? []) {
    if (!u.public_instructor_handle) continue
    entries.push({
      url: `${BASE_URL}/i/${encodeURIComponent(u.public_instructor_handle)}`,
      lastModified: u.updated_at ? new Date(u.updated_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    })
  }

  for (const u of passportsRes.data ?? []) {
    if (!u.public_passport_handle) continue
    entries.push({
      url: `${BASE_URL}/p/${encodeURIComponent(u.public_passport_handle)}`,
      lastModified: u.updated_at ? new Date(u.updated_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    })
  }

  for (const g of gymsRes.data ?? []) {
    if (!g.slug) continue
    entries.push({
      url: `${BASE_URL}/gyms/${encodeURIComponent(g.slug)}`,
      lastModified: g.updated_at ? new Date(g.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    })
  }

  for (const f of fightsRes.data ?? []) {
    if (!f.id) continue
    entries.push({
      url: `${OCKOCK_HOST}/fights/${encodeURIComponent(f.id)}`,
      lastModified: f.updated_at ? new Date(f.updated_at) : new Date(),
      // Daily until the event has passed — promoters often edit cards
      // up to and including the day of the show.
      changeFrequency: "daily",
      priority: 0.8,
    })
  }

  for (const fighter of fightersRes.data ?? []) {
    if (!fighter.id) continue
    entries.push({
      url: `${OCKOCK_HOST}/fighters/${encodeURIComponent(fighter.id)}`,
      lastModified: fighter.updated_at ? new Date(fighter.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    })
  }

  return entries
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(
    ({ path, changeFrequency, priority }) => ({
      url: urlFor(path),
      lastModified: now,
      changeFrequency,
      priority,
    }),
  )

  let dyn: MetadataRoute.Sitemap = []
  try {
    dyn = await dynamicEntries()
  } catch (err) {
    // A broken sitemap is worse than a partial one — log + continue
    // with the static base.
    console.error("[sitemap] dynamic fetch failed:", err)
  }

  return [...staticEntries, ...dyn]
}
