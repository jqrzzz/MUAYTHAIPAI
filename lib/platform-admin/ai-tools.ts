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

    /* ─── REVENUE: subscriptions ─────────────────────────────────── */

    subscriptions_summary: tool({
      description:
        "MRR + ARR + status counts (active/trial/past_due/cancelled). Use for any question about recurring revenue health.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data } = await supabase
          .from("gym_subscriptions")
          .select("status, monthly_price_usd_cents")
        const totals = {
          active: 0,
          trial: 0,
          past_due: 0,
          cancelled: 0,
          other: 0,
          mrr_usd: 0,
        }
        for (const s of data ?? []) {
          if (s.status === "active") {
            totals.active++
            totals.mrr_usd += (s.monthly_price_usd_cents ?? 2900) / 100
          } else if (s.status === "trial") totals.trial++
          else if (s.status === "past_due") totals.past_due++
          else if (s.status === "cancelled") totals.cancelled++
          else totals.other++
        }
        return {
          ...totals,
          mrr_usd: Number(totals.mrr_usd.toFixed(2)),
          arr_usd: Number((totals.mrr_usd * 12).toFixed(2)),
        }
      },
    }),

    list_subscriptions: tool({
      description:
        "List gym subscriptions with status, plan, monthly price, trial-end / period-end dates. Filter by status. Returns up to 50.",
      inputSchema: z.object({
        status: z.enum(["active", "trial", "past_due", "cancelled"]).optional(),
      }),
      execute: async ({ status }) => {
        let q = supabase
          .from("gym_subscriptions")
          .select(`
            org_id, status, monthly_price_usd_cents, trial_ends_at,
            current_period_end, activated_at, cancelled_at,
            organizations:org_id (name, slug)
          `)
          .order("activated_at", { ascending: false, nullsFirst: false })
          .limit(50)
        if (status) q = q.eq("status", status)
        const { data } = await q
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (data ?? []).map((s: any) => {
          const org = Array.isArray(s.organizations) ? s.organizations[0] : s.organizations
          return {
            gym_name: org?.name ?? "—",
            gym_slug: org?.slug ?? null,
            status: s.status,
            monthly_usd: (s.monthly_price_usd_cents ?? 0) / 100,
            trial_ends_at: s.trial_ends_at,
            renews_at: s.current_period_end,
            activated_at: s.activated_at,
            cancelled_at: s.cancelled_at,
          }
        })
        return { count: rows.length, subscriptions: rows }
      },
    }),

    /* ─── REVENUE: bookings ───────────────────────────────────────── */

    bookings_summary: tool({
      description:
        "Network-wide booking breakdown for a period: Stripe gross + fees + net + commission, cash paid/pending, transfer. Default range last 30 days.",
      inputSchema: z.object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }),
      execute: async ({ from, to }) => {
        const today = new Date()
        const defaultFrom = new Date(today.getTime() - 30 * 86400_000)
          .toISOString()
          .slice(0, 10)
        const defaultTo = today.toISOString().slice(0, 10)
        const f = from ?? defaultFrom
        const t = to ?? defaultTo
        const { data } = await supabase
          .from("bookings")
          .select(
            "org_id, payment_method, payment_status, payment_amount_thb, payment_amount_usd, commission_amount_usd, stripe_fee_cents, stripe_net_cents, refunded_amount_cents",
          )
          .gte("booking_date", f)
          .lte("booking_date", t)
          .limit(5000)
        const totals = {
          period: { from: f, to: t },
          bookings: 0,
          stripe_paid_count: 0,
          stripe_gross_usd_cents: 0,
          stripe_fee_usd_cents: 0,
          stripe_net_usd_cents: 0,
          commission_usd: 0,
          cash_paid_thb: 0,
          cash_paid_count: 0,
          cash_pending_thb: 0,
          cash_pending_count: 0,
          transfer_paid_thb: 0,
          refunded_count: 0,
          refunded_usd_cents: 0,
        }
        for (const b of data ?? []) {
          totals.bookings++
          if (b.payment_status === "refunded") {
            totals.refunded_count++
            totals.refunded_usd_cents += b.refunded_amount_cents ?? 0
            continue
          }
          if (b.payment_method === "stripe" && b.payment_status === "paid") {
            totals.stripe_paid_count++
            totals.stripe_gross_usd_cents += b.payment_amount_usd ?? 0
            totals.commission_usd += Number(b.commission_amount_usd ?? 0)
            if (b.stripe_fee_cents != null) {
              totals.stripe_fee_usd_cents += b.stripe_fee_cents
              totals.stripe_net_usd_cents +=
                b.stripe_net_cents ?? (b.payment_amount_usd ?? 0) - b.stripe_fee_cents
            }
          } else if (b.payment_method === "cash" && b.payment_status === "paid") {
            totals.cash_paid_thb += b.payment_amount_thb ?? 0
            totals.cash_paid_count++
          } else if (b.payment_method === "cash" && b.payment_status === "pending") {
            totals.cash_pending_thb += b.payment_amount_thb ?? 0
            totals.cash_pending_count++
          } else if (b.payment_method === "transfer" && b.payment_status === "paid") {
            totals.transfer_paid_thb += b.payment_amount_thb ?? 0
          }
        }
        return {
          ...totals,
          commission_usd: Number(totals.commission_usd.toFixed(2)),
          stripe_gross_usd: totals.stripe_gross_usd_cents / 100,
          stripe_fee_usd: totals.stripe_fee_usd_cents / 100,
          stripe_net_usd: totals.stripe_net_usd_cents / 100,
          real_take_usd: Number(
            (totals.commission_usd - totals.stripe_fee_usd_cents / 100).toFixed(2),
          ),
        }
      },
    }),

    list_bookings: tool({
      description:
        "Recent bookings across the network with customer, gym, payment method, amount, status. Filter by gym, status, or method. Returns up to 50.",
      inputSchema: z.object({
        org_id: z.string().uuid().optional(),
        payment_status: z.enum(["paid", "pending", "refunded", "failed"]).optional(),
        payment_method: z.enum(["stripe", "cash", "transfer"]).optional(),
      }),
      execute: async ({ org_id, payment_status, payment_method }) => {
        let q = supabase
          .from("bookings")
          .select(`
            id, org_id, guest_name, guest_email, booking_date, status,
            payment_status, payment_method, payment_amount_thb,
            payment_amount_usd, stripe_payment_intent_id,
            organizations:org_id (name)
          `)
          .order("booking_date", { ascending: false })
          .limit(50)
        if (org_id) q = q.eq("org_id", org_id)
        if (payment_status) q = q.eq("payment_status", payment_status)
        if (payment_method) q = q.eq("payment_method", payment_method)
        const { data } = await q
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (data ?? []).map((b: any) => {
          const org = Array.isArray(b.organizations) ? b.organizations[0] : b.organizations
          return {
            id: b.id,
            gym_name: org?.name ?? "—",
            customer: b.guest_name || b.guest_email || "—",
            date: b.booking_date,
            status: b.status,
            payment_status: b.payment_status,
            payment_method: b.payment_method,
            amount_thb: b.payment_amount_thb,
            amount_usd: b.payment_amount_usd,
            stripe_pi: b.stripe_payment_intent_id,
          }
        })
        return { count: rows.length, bookings: rows }
      },
    }),

    /* ─── OPS: support ────────────────────────────────────────────── */

    support_summary: tool({
      description:
        "Open support ticket counts by status + overdue count + priority breakdown. Use for 'how's the support queue' questions.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data } = await supabase
          .from("support_tickets")
          .select("status, priority, sla_due_at")
          .in("status", ["open", "in_progress", "waiting_customer"])
        const now = Date.now()
        const summary = {
          open: 0,
          in_progress: 0,
          waiting_customer: 0,
          overdue: 0,
          urgent: 0,
          high: 0,
          normal: 0,
          low: 0,
        }
        for (const t of data ?? []) {
          if (t.status in summary) summary[t.status as keyof typeof summary]++
          if (t.priority in summary) summary[t.priority as keyof typeof summary]++
          if (t.sla_due_at && new Date(t.sla_due_at).getTime() < now) summary.overdue++
        }
        return summary
      },
    }),

    list_support_tickets: tool({
      description:
        "List support tickets with subject, gym, category, priority, status, SLA. Filter by status. Returns up to 30 sorted by SLA risk.",
      inputSchema: z.object({
        status: z
          .enum(["open", "in_progress", "waiting_customer", "resolved", "all"])
          .optional(),
      }),
      execute: async ({ status }) => {
        let q = supabase
          .from("support_tickets")
          .select(`
            id, subject, ai_summary, category, priority, status,
            sla_due_at, created_at,
            organizations:org_id (name)
          `)
          .order("created_at", { ascending: false })
          .limit(30)
        if (status && status !== "all") {
          q = q.eq("status", status)
        } else if (!status) {
          q = q.in("status", ["open", "in_progress", "waiting_customer"])
        }
        const { data } = await q
        const now = Date.now()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (data ?? []).map((t: any) => {
          const org = Array.isArray(t.organizations) ? t.organizations[0] : t.organizations
          const slaMs = t.sla_due_at ? new Date(t.sla_due_at).getTime() - now : null
          return {
            id: t.id,
            subject: t.subject,
            ai_summary: t.ai_summary,
            gym_name: org?.name ?? "—",
            category: t.category,
            priority: t.priority,
            status: t.status,
            minutes_remaining: slaMs != null ? Math.round(slaMs / 60_000) : null,
            overdue: slaMs != null && slaMs < 0,
          }
        })
        return { count: rows.length, tickets: rows }
      },
    }),

    /* ─── INTELLIGENCE: signals ───────────────────────────────────── */

    list_signals: tool({
      description:
        "AI-generated proactive signals — what needs attention. Returns title, summary, severity, suggested action, gym. Sorted by severity. Use for 'what should I focus on' questions.",
      inputSchema: z.object({
        severity: z.enum(["info", "warning", "critical"]).optional(),
      }),
      execute: async ({ severity }) => {
        let q = supabase
          .from("platform_signals")
          .select(`
            id, kind, severity, title, summary, suggested_action,
            generated_at, evidence,
            organizations:target_org_id (name)
          `)
          .eq("status", "open")
          .order("generated_at", { ascending: false })
          .limit(30)
        if (severity) q = q.eq("severity", severity)
        const { data } = await q
        const order = { critical: 0, warning: 1, info: 2 } as const
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = (data ?? []).map((s: any) => {
          const org = Array.isArray(s.organizations) ? s.organizations[0] : s.organizations
          return {
            kind: s.kind,
            severity: s.severity,
            title: s.title,
            summary: s.summary,
            gym_name: org?.name ?? null,
            suggested_action: s.suggested_action,
            generated_at: s.generated_at,
            evidence: s.evidence,
          }
        })
        rows.sort(
          (a, b) =>
            (order[a.severity as keyof typeof order] ?? 9) -
            (order[b.severity as keyof typeof order] ?? 9),
        )
        return { count: rows.length, signals: rows }
      },
    }),

    /* ─── ADOPTION ─────────────────────────────────────────────────── */

    adoption_summary: tool({
      description:
        "Network feature adoption: % of gyms using website builder, social composer, trainer payouts, waivers, packages. Use for 'are gyms using X' questions.",
      inputSchema: z.object({}),
      execute: async () => {
        const [gymsRes, websitesRes, socialRes, rulesRes, waiversRes, packagesRes] =
          await Promise.all([
            supabase
              .from("organizations")
              .select("id", { count: "exact", head: true })
              .eq("status", "active"),
            supabase
              .from("gym_websites")
              .select("org_id", { count: "exact", head: true })
              .eq("status", "published"),
            supabase
              .from("social_posts")
              .select("org_id", { count: "exact", head: true })
              .in("source", ["ai_compose", "ai_batch"])
              .gte(
                "created_at",
                new Date(Date.now() - 30 * 86400_000).toISOString(),
              ),
            supabase
              .from("trainer_commission_rules")
              .select("org_id", { count: "exact", head: true })
              .eq("is_active", true),
            supabase
              .from("org_waivers")
              .select("org_id", { count: "exact", head: true })
              .eq("is_active", true),
            supabase
              .from("gym_packages")
              .select("org_id", { count: "exact", head: true })
              .eq("is_active", true),
          ])
        const total = gymsRes.count ?? 0
        const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
        return {
          total_gyms: total,
          websites_published: websitesRes.count ?? 0,
          websites_pct: pct(websitesRes.count ?? 0),
          ai_posts_30d: socialRes.count ?? 0,
          commission_rules_active: rulesRes.count ?? 0,
          commission_pct: pct(rulesRes.count ?? 0),
          waivers_active: waiversRes.count ?? 0,
          waivers_pct: pct(waiversRes.count ?? 0),
          packages_active: packagesRes.count ?? 0,
          packages_pct: pct(packagesRes.count ?? 0),
        }
      },
    }),

    /* ─── AUDIT ──────────────────────────────────────────────────── */

    list_audit_log: tool({
      description:
        "Recent platform-operator actions (impersonations, payouts settled, support replies, blacklist adds, signals dismissed). Use to answer 'did I do X' or 'who edited Y'. Returns up to 30.",
      inputSchema: z.object({
        action: z.string().optional(),
      }),
      execute: async ({ action }) => {
        let q = supabase
          .from("platform_audit_log")
          .select("action, actor_email, target_label, created_at, metadata")
          .order("created_at", { ascending: false })
          .limit(30)
        if (action) q = q.eq("action", action)
        const { data } = await q
        return { count: data?.length ?? 0, entries: data ?? [] }
      },
    }),
  }
}
