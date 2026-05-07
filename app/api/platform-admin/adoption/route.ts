/**
 * Network adoption stats — which gyms are using which features.
 *
 * GET /api/platform-admin/adoption
 *
 * The single-operator's view into "is anyone actually using this stuff?"
 * Returns aggregate counts + a per-gym matrix so we can see who's
 * activated and who's still cold.
 */
import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()

  // Pull everything in parallel — none of these queries are big
  const [
    gymsRes,
    websitesRes,
    socialPostsRes,
    socialAi7dRes,
    socialAi30dRes,
    commissionRulesRes,
    payoutsRes,
    waiversRes,
    packagesRes,
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, status, created_at")
      .eq("status", "active"),
    supabase
      .from("gym_websites")
      .select("org_id, status, published_at, updated_at"),
    supabase
      .from("social_posts")
      .select("org_id, status, source, created_at"),
    supabase
      .from("social_posts")
      .select("org_id")
      .in("source", ["ai_compose", "ai_batch"])
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("social_posts")
      .select("org_id")
      .in("source", ["ai_compose", "ai_batch"])
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("trainer_commission_rules")
      .select("org_id, is_active"),
    supabase
      .from("trainer_payouts")
      .select("org_id, total_amount_thb, paid_at, status")
      .gte("paid_at", thirtyDaysAgo),
    supabase
      .from("org_waivers")
      .select("org_id, is_active"),
    supabase
      .from("gym_packages")
      .select("org_id, is_active"),
  ])

  const gyms = gymsRes.data ?? []
  const websites = websitesRes.data ?? []
  const socialPosts = socialPostsRes.data ?? []
  const ai7d = socialAi7dRes.data ?? []
  const ai30d = socialAi30dRes.data ?? []
  const commissionRules = commissionRulesRes.data ?? []
  const payouts = payoutsRes.data ?? []
  const waivers = waiversRes.data ?? []
  const packages = packagesRes.data ?? []

  // Network-wide rollups
  const totals = {
    gyms: gyms.length,
    websites: {
      published: websites.filter((w) => w.status === "published").length,
      draft: websites.filter((w) => w.status === "draft").length,
    },
    social: {
      drafts: socialPosts.filter((p) => p.status === "draft").length,
      scheduled: socialPosts.filter((p) => p.status === "scheduled").length,
      published: socialPosts.filter((p) => p.status === "published").length,
      ai_7d: ai7d.length,
      ai_30d: ai30d.length,
    },
    payouts: {
      gyms_with_rules: new Set(commissionRules.filter((r) => r.is_active).map((r) => r.org_id)).size,
      paid_30d_thb: payouts
        .filter((p) => p.status === "paid")
        .reduce((s, p) => s + (p.total_amount_thb ?? 0), 0),
      payouts_30d_count: payouts.filter((p) => p.status === "paid").length,
    },
    waivers: {
      gyms_with_active: new Set(waivers.filter((w) => w.is_active).map((w) => w.org_id)).size,
    },
    packages: {
      gyms_with_active: new Set(packages.filter((p) => p.is_active).map((p) => p.org_id)).size,
    },
  }

  // Per-gym matrix — what's each gym using?
  const websiteByOrg = new Map(websites.map((w) => [w.org_id, w]))
  const socialByOrg = new Map<string, { total: number; ai: number }>()
  for (const p of socialPosts) {
    const slot = socialByOrg.get(p.org_id) ?? { total: 0, ai: 0 }
    slot.total++
    if (p.source !== "manual") slot.ai++
    socialByOrg.set(p.org_id, slot)
  }
  const rulesByOrg = new Map<string, number>()
  for (const r of commissionRules) {
    if (!r.is_active) continue
    rulesByOrg.set(r.org_id, (rulesByOrg.get(r.org_id) ?? 0) + 1)
  }
  const waiversByOrg = new Set(waivers.filter((w) => w.is_active).map((w) => w.org_id))
  const packagesByOrg = new Set(packages.filter((p) => p.is_active).map((p) => p.org_id))

  const perGym = gyms
    .map((g) => {
      const w = websiteByOrg.get(g.id)
      const s = socialByOrg.get(g.id) ?? { total: 0, ai: 0 }
      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        joined_at: g.created_at,
        website_status: w?.status ?? null,
        social_total: s.total,
        social_ai: s.ai,
        commission_rules: rulesByOrg.get(g.id) ?? 0,
        has_waiver: waiversByOrg.has(g.id),
        has_packages: packagesByOrg.has(g.id),
        // adoption score: 0-5, count of features they've activated
        adoption_score:
          (w?.status === "published" ? 1 : 0) +
          (s.total > 0 ? 1 : 0) +
          ((rulesByOrg.get(g.id) ?? 0) > 0 ? 1 : 0) +
          (waiversByOrg.has(g.id) ? 1 : 0) +
          (packagesByOrg.has(g.id) ? 1 : 0),
      }
    })
    .sort((a, b) => b.adoption_score - a.adoption_score)

  return NextResponse.json({
    totals,
    gyms: perGym,
  })
}
