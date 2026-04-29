import { tool } from "ai"
import { z } from "zod"
import type { createClient } from "@/lib/supabase/server"
import { CERTIFICATION_LEVELS, LEVEL_IDS } from "@/lib/certification-levels"
import {
  searchText,
  GooglePlacesNotConfiguredError,
} from "@/lib/discovery/google-places"
import { researchRegion } from "@/lib/discovery/research"
import {
  upsertGooglePlace,
  insertResearchCandidate,
} from "@/lib/discovery/upsert"
import { signActionToken } from "@/lib/platform-admin/action-tokens"

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

    campaigns_overview: tool({
      description:
        "Summary of all outreach campaigns: counts by status, total drafted/sent/claimed across the network. Use when the operator asks how outreach is going.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("id, name, status, total_targets, total_drafted, total_sent, total_claimed, created_at")
          .order("created_at", { ascending: false })
          .limit(50)
        const list = campaigns || []
        const byStatus: Record<string, number> = {}
        let totDrafted = 0,
          totSent = 0,
          totClaimed = 0
        for (const c of list) {
          byStatus[c.status] = (byStatus[c.status] ?? 0) + 1
          totDrafted += c.total_drafted ?? 0
          totSent += c.total_sent ?? 0
          totClaimed += c.total_claimed ?? 0
        }
        return {
          total_campaigns: list.length,
          by_status: byStatus,
          totals: {
            drafted: totDrafted,
            sent: totSent,
            claimed: totClaimed,
            claim_rate:
              totSent > 0 ? Math.round((totClaimed / totSent) * 100) / 100 : 0,
          },
          recent: list.slice(0, 10).map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            sent: c.total_sent,
            claimed: c.total_claimed,
          })),
        }
      },
    }),

    trainer_passport: tool({
      description:
        "Look up a trainer by email and return their network footprint — total signoffs, students touched, gyms taught at, levels covered, recent activity.",
      inputSchema: z.object({
        email: z.string().describe("Trainer's email address"),
      }),
      execute: async ({ email }) => {
        const { data: user } = await supabase
          .from("users")
          .select("id, email, full_name")
          .ilike("email", email.trim())
          .maybeSingle()
        if (!user) return { found: false, email }

        const { data: signoffs } = await supabase
          .from("skill_signoffs")
          .select("student_id, org_id, level, signed_off_at")
          .eq("signed_off_by", user.id)
        if (!signoffs || signoffs.length === 0) {
          return { found: true, no_signoffs: true, trainer: user }
        }
        const students = new Set(signoffs.map((s) => s.student_id))
        const orgs = new Set(signoffs.map((s) => s.org_id))
        const byLevel: Record<string, number> = {}
        let lastAt: string | null = null
        for (const s of signoffs) {
          byLevel[s.level] = (byLevel[s.level] ?? 0) + 1
          if (!lastAt || s.signed_off_at > lastAt) lastAt = s.signed_off_at
        }
        return {
          found: true,
          trainer: { id: user.id, email: user.email, name: user.full_name },
          total_signoffs: signoffs.length,
          students_touched: students.size,
          gyms_taught_at: orgs.size,
          by_level: byLevel,
          last_signoff_at: lastAt,
        }
      },
    }),

    student_passport: tool({
      description:
        "Look up a student by email and return their cert ladder progress, certs earned, gyms visited, and recent signoffs. Use whenever the operator asks about a specific student's journey.",
      inputSchema: z.object({
        email: z.string().describe("Student's email address"),
      }),
      execute: async ({ email }) => {
        const { data: user } = await supabase
          .from("users")
          .select("id, email, full_name")
          .ilike("email", email.trim())
          .maybeSingle()
        if (!user) return { found: false, email }

        const [signoffs, certs] = await Promise.all([
          supabase
            .from("skill_signoffs")
            .select("level, skill_index, org_id, signed_off_at")
            .eq("student_id", user.id),
          supabase
            .from("certificates")
            .select("level, issued_at, certificate_number")
            .eq("user_id", user.id)
            .eq("status", "active"),
        ])

        const TOTAL_BY_LEVEL: Record<string, number> = Object.fromEntries(
          CERTIFICATION_LEVELS.map((l) => [l.id, l.skills.length])
        )
        const byLevel: Record<string, { signed_off: Set<string>; orgs: Set<string> }> = {}
        for (const s of signoffs.data || []) {
          const cur = byLevel[s.level] || {
            signed_off: new Set<string>(),
            orgs: new Set<string>(),
          }
          cur.signed_off.add(`${s.org_id}:${s.skill_index}`)
          cur.orgs.add(s.org_id)
          byLevel[s.level] = cur
        }
        return {
          found: true,
          student: { id: user.id, email: user.email, name: user.full_name },
          ladder: CERTIFICATION_LEVELS.map((l) => ({
            level: l.id,
            name: l.name,
            signed_off: byLevel[l.id]?.signed_off.size ?? 0,
            total_skills: TOTAL_BY_LEVEL[l.id] ?? 0,
            gyms: byLevel[l.id]?.orgs.size ?? 0,
            earned: (certs.data || []).some((c) => c.level === l.id),
          })),
          certs: (certs.data || []).map((c) => ({
            level: c.level,
            issued_at: c.issued_at,
            certificate_number: c.certificate_number,
          })),
        }
      },
    }),

    /* ---------------- ACTION TOOLS (mutate state) ---------------- */

    run_google_discovery: tool({
      description:
        "Run a Google Places text search and upsert results into the discovery pipeline. Use when the operator asks to 'find more gyms in <region>', 'discover gyms near X', or to add a specific search query. Returns counts of new vs updated rows.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Free-text query, e.g. 'muay thai gym chiang mai' or 'pattaya muay thai'"),
        max_results: z.number().int().min(1).max(20).optional(),
      }),
      execute: async ({ query, max_results }) => {
        try {
          const places = await searchText({ query, maxResultCount: max_results })
          let inserted = 0
          let updated = 0
          for (const p of places) {
            const r = await upsertGooglePlace({ supabase, place: p, sourceQuery: query })
            if (r.id) {
              if (r.inserted) inserted++
              else updated++
            }
          }
          return {
            ok: true,
            query,
            total_found: places.length,
            inserted,
            updated,
          }
        } catch (err) {
          if (err instanceof GooglePlacesNotConfiguredError) {
            return { ok: false, error: "GOOGLE_PLACES_API_KEY not configured" }
          }
          return { ok: false, error: err instanceof Error ? err.message : String(err) }
        }
      },
    }),

    run_claude_research: tool({
      description:
        "Use Claude's training-data knowledge to suggest candidate gyms in a region, then verify each via Google Places before storing. Useful when Google search misses well-known camps. Returns counts.",
      inputSchema: z.object({
        region: z.string().describe("e.g. 'Phuket', 'Pai, Mae Hong Son', 'Buriram'"),
        hint: z
          .string()
          .optional()
          .describe("Optional flavour, e.g. 'fight team only' or 'tourist-friendly'"),
        limit: z.number().int().min(1).max(20).optional(),
      }),
      execute: async ({ region, hint, limit }) => {
        try {
          const research = await researchRegion({ region, hint, limit })
          let verified = 0
          let unverified = 0
          for (const c of research.candidates) {
            try {
              const places = await searchText({
                query: `${c.name} ${c.city} muay thai`,
                maxResultCount: 3,
              })
              const match = places[0]
              if (match) {
                await upsertGooglePlace({
                  supabase,
                  place: match,
                  sourceQuery: `find-more:${region}`,
                })
                verified++
                continue
              }
            } catch {
              /* fall through */
            }
            await insertResearchCandidate({
              supabase,
              name: c.name,
              name_th: c.name_th,
              city: c.city,
              province: c.province,
              notes: [c.notable_for, `confidence:${c.confidence}`].filter(Boolean).join(" — "),
              source_query: `find-more:${region}`,
            })
            unverified++
          }
          return {
            ok: true,
            region,
            candidates: research.candidates.length,
            verified,
            unverified,
            notes: research.notes,
          }
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : String(err) }
        }
      },
    }),

    update_gym_status: tool({
      description:
        "Propose a status change for a discovered gym (verified, ignored, reviewed, duplicate). The operator must tap Confirm before this executes — DO NOT also ask for confirmation in your reply text.",
      inputSchema: z.object({
        gym_id: z.string().describe("UUID of the discovered_gym row"),
        status: z.enum(["pending", "reviewed", "verified", "ignored", "duplicate"]),
        notes: z.string().optional(),
      }),
      execute: async ({ gym_id, status, notes }) => {
        const { data: gym } = await supabase
          .from("discovered_gyms")
          .select("id, name, status")
          .eq("id", gym_id)
          .maybeSingle()
        if (!gym) return { proposed: false, error: "Gym not found" }

        const { token } = signActionToken("update_gym_status", { gym_id, status, notes })
        return {
          proposed: true,
          action: "update_gym_status",
          action_token: token,
          preview: {
            gym_name: gym.name,
            from_status: gym.status,
            to_status: status,
            notes: notes || null,
          },
        }
      },
    }),

    invite_gym: tool({
      description:
        "Propose a magic-link invite to a discovered gym. The operator must tap Confirm before this executes (which will email the invite if Resend is configured) — DO NOT also ask for confirmation in your reply text.",
      inputSchema: z.object({
        gym_id: z.string(),
        email: z.string().email().optional(),
        send_email: z.boolean().optional().default(true),
      }),
      execute: async ({ gym_id, email, send_email }) => {
        const { data: gym } = await supabase
          .from("discovered_gyms")
          .select("id, name, email, city, province, status, invited_at")
          .eq("id", gym_id)
          .maybeSingle()
        if (!gym) return { proposed: false, error: "Gym not found" }

        const inviteEmail = email || gym.email || null
        const { token } = signActionToken("invite_gym", { gym_id, email, send_email })
        return {
          proposed: true,
          action: "invite_gym",
          action_token: token,
          preview: {
            gym_name: gym.name,
            email: inviteEmail,
            will_email: send_email !== false && !!inviteEmail,
            re_invite: !!gym.invited_at,
            current_status: gym.status,
          },
        }
      },
    }),
  }
}
