import { tool } from "ai"
import { z } from "zod"
import type { createClient } from "@/lib/supabase/server"
import { CERTIFICATION_LEVELS, LEVEL_IDS } from "@/lib/certification-levels"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

const CERT_LEVELS = LEVEL_IDS
type CertLevel = (typeof CERT_LEVELS)[number]

const SKILLS_BY_LEVEL: Record<string, number> = Object.fromEntries(
  CERTIFICATION_LEVELS.map((l) => [l.id, l.skills.length]),
)

/**
 * Read-only tool surface exposed to the platform-admin AI command bar.
 * Every tool returns plain JSON. None of these mutate state — write
 * actions live behind the action-token deeplink flow.
 */
export function buildPlatformTools(supabase: SupabaseClient) {
  return {
    network_overview: tool({
      description:
        "High-level network stats: total gyms, students, active subscriptions, certs issued this month. Use for any 'how is the network doing' question.",
      inputSchema: z.object({}),
      execute: async () => {
        const [gyms, students, subs, certsThisMonth, signoffsThisMonth] = await Promise.all([
          supabase.from("organizations").select("*", { count: "exact", head: true }),
          supabase.from("users").select("*", { count: "exact", head: true }).eq("is_platform_admin", false),
          supabase.from("gym_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase
            .from("certificates")
            .select("*", { count: "exact", head: true })
            .gte("issued_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
          supabase
            .from("skill_signoffs")
            .select("*", { count: "exact", head: true })
            .gte("signed_off_at", new Date(Date.now() - 30 * 86400_000).toISOString()),
        ])
        return {
          total_gyms: gyms.count ?? 0,
          total_students: students.count ?? 0,
          active_subscriptions: subs.count ?? 0,
          certs_issued_30d: certsThisMonth.count ?? 0,
          signoffs_30d: signoffsThisMonth.count ?? 0,
        }
      },
    }),

    list_gyms: tool({
      description:
        "List participating gyms with city, subscription status, and member count. Filter by status if needed. Returns up to 50 rows.",
      inputSchema: z.object({
        subscription_status: z.enum(["active", "trialing", "past_due", "canceled"]).optional(),
      }),
      execute: async ({ subscription_status }) => {
        const { data } = await supabase
          .from("organizations")
          .select("id, name, slug, city, province, gym_subscriptions(status, current_period_end)")
          .order("created_at", { ascending: false })
          .limit(50)
        const rows = (data || []).map((row) => {
          const sub = (row.gym_subscriptions as unknown as { status: string }[] | null)?.[0]
          return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            city: row.city,
            province: row.province,
            subscription: sub?.status ?? "none",
          }
        })
        const filtered = subscription_status
          ? rows.filter((r) => r.subscription === subscription_status)
          : rows
        return { count: filtered.length, gyms: filtered }
      },
    }),

    inactive_gyms: tool({
      description:
        "Gyms that have signed off zero student skills in the last N days. Useful for finding gyms that need outreach.",
      inputSchema: z.object({
        days: z.number().int().min(1).max(180).default(30),
      }),
      execute: async ({ days }) => {
        const cutoff = new Date(Date.now() - days * 86400_000).toISOString()
        const { data: gyms } = await supabase
          .from("organizations")
          .select("id, name, slug, city")
        const { data: recent } = await supabase
          .from("skill_signoffs")
          .select("org_id")
          .gte("signed_off_at", cutoff)
        const activeOrgs = new Set((recent || []).map((r) => r.org_id))
        const inactive = (gyms || []).filter((g) => !activeOrgs.has(g.id))
        return {
          window_days: days,
          inactive_count: inactive.length,
          gyms: inactive.slice(0, 50),
        }
      },
    }),

    students_near_level: tool({
      description:
        "Students who have signed off some-but-not-all skills for a given certification level (i.e. one or two skills away from cert eligibility). Useful for re-engagement campaigns.",
      inputSchema: z.object({
        level: z.enum(CERT_LEVELS as unknown as [CertLevel, ...CertLevel[]]),
        max_remaining: z.number().int().min(1).max(10).default(2),
      }),
      execute: async ({ level, max_remaining }) => {
        const { data } = await supabase
          .from("skill_signoffs")
          .select("student_id, skill_index, org_id")
          .eq("level", level)
        const byStudent = new Map<string, { count: number; orgs: Set<string> }>()
        for (const row of data || []) {
          const cur = byStudent.get(row.student_id) || { count: 0, orgs: new Set<string>() }
          cur.count += 1
          cur.orgs.add(row.org_id)
          byStudent.set(row.student_id, cur)
        }
        const totalSkills = SKILLS_BY_LEVEL[level] ?? 7
        const candidates: { student_id: string; signed_off: number; remaining: number; gyms_count: number }[] = []
        for (const [student_id, v] of byStudent.entries()) {
          const remaining = totalSkills - v.count
          if (remaining > 0 && remaining <= max_remaining) {
            candidates.push({
              student_id,
              signed_off: v.count,
              remaining,
              gyms_count: v.orgs.size,
            })
          }
        }
        return {
          level,
          total_skills: totalSkills,
          max_remaining,
          count: candidates.length,
          students: candidates.slice(0, 50),
        }
      },
    }),

    cert_issuance_by_level: tool({
      description:
        "Counts of certificates issued, broken down by certification level. Optionally restrict to a recent window.",
      inputSchema: z.object({
        days: z.number().int().min(1).max(365).optional(),
      }),
      execute: async ({ days }) => {
        let query = supabase.from("certificates").select("level")
        if (days) {
          query = query.gte("issued_at", new Date(Date.now() - days * 86400_000).toISOString())
        }
        const { data } = await query
        const counts: Record<string, number> = {}
        for (const row of data || []) {
          const lvl = (row as { level: string }).level
          counts[lvl] = (counts[lvl] ?? 0) + 1
        }
        return { window_days: days ?? null, counts }
      },
    }),

    discovery_pipeline: tool({
      description:
        "Counts of gyms in the discovery pipeline by status (pending, reviewed, verified, invited, onboarded, ignored, duplicate). Use to see how the network outreach is going.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data } = await supabase
          .from("discovered_gyms")
          .select("status")
        const counts: Record<string, number> = {}
        for (const row of data || []) {
          const s = (row as { status: string }).status
          counts[s] = (counts[s] ?? 0) + 1
        }
        return { total: (data || []).length, by_status: counts }
      },
    }),

    list_discovered_gyms: tool({
      description:
        "List discovered gyms (the candidate pool). Filter by status, source, city, or province. Returns up to 50 rows.",
      inputSchema: z.object({
        status: z
          .enum(["pending", "reviewed", "verified", "invited", "onboarded", "ignored", "duplicate"])
          .optional(),
        source: z.enum(["google", "firecrawl", "claude_research", "manual"]).optional(),
        city: z.string().optional(),
        province: z.string().optional(),
      }),
      execute: async ({ status, source, city, province }) => {
        let query = supabase
          .from("discovered_gyms")
          .select(
            "id, name, name_th, city, province, source, status, google_rating, " +
              "google_review_count, website, ai_summary, invited_at, claimed_at"
          )
          .order("created_at", { ascending: false })
          .limit(50)
        if (status) query = query.eq("status", status)
        if (source) query = query.eq("source", source)
        if (city) query = query.ilike("city", `%${city}%`)
        if (province) query = query.ilike("province", `%${province}%`)
        const { data } = await query
        return { count: (data || []).length, gyms: data || [] }
      },
    }),

    course_progress: tool({
      description:
        "Enrollment and progress stats for the platform-wide certification courses. Returns enrollments, completion rates per course.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data: courses } = await supabase
          .from("courses")
          .select("id, slug, title, certificate_level")
          .is("org_id", null)
        const result: Array<{
          slug: string
          title: string
          level: string | null
          enrolled: number
          completed: number
        }> = []
        for (const c of courses || []) {
          const [{ count: enrolled }, { count: completed }] = await Promise.all([
            supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("course_id", c.id),
            supabase
              .from("enrollments")
              .select("id", { count: "exact", head: true })
              .eq("course_id", c.id)
              .eq("status", "completed"),
          ])
          result.push({
            slug: c.slug,
            title: c.title,
            level: c.certificate_level,
            enrolled: enrolled ?? 0,
            completed: completed ?? 0,
          })
        }
        return { courses: result }
      },
    }),
  }
}
