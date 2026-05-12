/**
 * Platform signal generators — the proactive AI brief.
 *
 * Each generator is a pure function that takes a snapshot of recent
 * platform state and emits an array of signals (deduplicated by
 * dedup_key). The cron route calls all of them, upserts results into
 * platform_signals, and stales any signals that didn't re-emit.
 *
 * Why rule-based + AI framing instead of pure AI?
 *   - Rules are deterministic, free, and fast — perfect for "trial
 *     ends in 3 days" which doesn't need reasoning.
 *   - AI framing is layered on top to rewrite high-signal cards in
 *     natural language. Optional — falls back to templates if the
 *     gateway is down.
 *
 * Adding a new signal type: implement a generator function below,
 * register it in `ALL_GENERATORS`, done. Don't change the table.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { generateObject } from "ai"
import { z } from "zod"
import { MODEL_VOICE } from "./ai-models"

export interface SignalDraft {
  kind: string
  severity: "info" | "warning" | "critical"
  target_org_id: string | null
  title: string
  summary: string
  detail?: string | null
  evidence?: Record<string, unknown>
  suggested_action?: string | null
  dedup_key: string
  expires_at?: string | null
}

interface Snapshot {
  // Subscriptions per gym
  subs: Array<{
    org_id: string
    org_name: string
    org_email: string | null
    status: string
    trial_ends_at: string | null
    current_period_end: string | null
    monthly_price_usd_cents: number | null
    activated_at: string | null
    cancelled_at: string | null
  }>
  // Booking counts per gym, last 7 days vs prior 7 days
  bookings_by_gym: Map<string, { last7: number; prior7: number; last_booking_date: string | null }>
  // Open support tickets past SLA
  overdue_tickets: Array<{ id: string; org_id: string; org_name: string; subject: string; sla_due_at: string }>
  // Discovered gyms with high signal that haven't been invited
  hot_discovery: Array<{ id: string; name: string; city: string | null; google_rating: number | null; status: string }>
  // First-success milestones (gyms hit a "first" this week)
  first_milestones: Array<{ org_id: string; org_name: string; kind: string }>
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

export async function buildSnapshot(supabase: SupabaseClient): Promise<Snapshot> {
  const now = Date.now()
  const sevenDaysAgo = new Date(now - SEVEN_DAYS).toISOString()
  const fourteenDaysAgo = new Date(now - 2 * SEVEN_DAYS).toISOString()

  const [subsRes, bookings7dRes, bookingsPriorRes, ticketsRes, discoveryRes] = await Promise.all([
    supabase
      .from("gym_subscriptions")
      .select(`
        org_id, status, trial_ends_at, current_period_end,
        monthly_price_usd_cents, activated_at, cancelled_at,
        organizations:org_id (name, email)
      `),
    supabase
      .from("bookings")
      .select("org_id, booking_date")
      .gte("booking_date", new Date(now - SEVEN_DAYS).toISOString().slice(0, 10)),
    supabase
      .from("bookings")
      .select("org_id, booking_date")
      .gte("booking_date", new Date(now - 2 * SEVEN_DAYS).toISOString().slice(0, 10))
      .lt("booking_date", new Date(now - SEVEN_DAYS).toISOString().slice(0, 10)),
    supabase
      .from("support_tickets")
      .select(`
        id, org_id, subject, sla_due_at, status,
        organizations:org_id (name)
      `)
      .in("status", ["open", "in_progress"])
      .lt("sla_due_at", new Date().toISOString()),
    supabase
      .from("discovered_gyms")
      .select("id, name, city, google_rating, status, last_extracted_at")
      .gte("google_rating", 4.5)
      .eq("status", "verified"),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs = ((subsRes.data ?? []) as any[]).map((s) => {
    const org = Array.isArray(s.organizations) ? s.organizations[0] : s.organizations
    return {
      org_id: s.org_id,
      org_name: org?.name ?? "—",
      org_email: org?.email ?? null,
      status: s.status,
      trial_ends_at: s.trial_ends_at,
      current_period_end: s.current_period_end,
      monthly_price_usd_cents: s.monthly_price_usd_cents,
      activated_at: s.activated_at,
      cancelled_at: s.cancelled_at,
    }
  })

  const bookings_by_gym = new Map<string, { last7: number; prior7: number; last_booking_date: string | null }>()
  for (const sub of subs) {
    bookings_by_gym.set(sub.org_id, { last7: 0, prior7: 0, last_booking_date: null })
  }
  for (const b of bookings7dRes.data ?? []) {
    const slot = bookings_by_gym.get(b.org_id) ?? { last7: 0, prior7: 0, last_booking_date: null }
    slot.last7++
    if (!slot.last_booking_date || b.booking_date > slot.last_booking_date) {
      slot.last_booking_date = b.booking_date
    }
    bookings_by_gym.set(b.org_id, slot)
  }
  for (const b of bookingsPriorRes.data ?? []) {
    const slot = bookings_by_gym.get(b.org_id) ?? { last7: 0, prior7: 0, last_booking_date: null }
    slot.prior7++
    bookings_by_gym.set(b.org_id, slot)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overdue_tickets = ((ticketsRes.data ?? []) as any[]).map((t) => {
    const org = Array.isArray(t.organizations) ? t.organizations[0] : t.organizations
    return {
      id: t.id,
      org_id: t.org_id,
      org_name: org?.name ?? "—",
      subject: t.subject,
      sla_due_at: t.sla_due_at,
    }
  })

  const hot_discovery = (discoveryRes.data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((d: any) => ({
      id: d.id,
      name: d.name,
      city: d.city,
      google_rating: d.google_rating,
      status: d.status,
    }))

  // Milestone detection — gyms that hit a "first" in the last 7 days
  const first_milestones: Snapshot["first_milestones"] = []

  // First active sub in last 7 days
  for (const s of subs) {
    if (s.status === "active" && s.activated_at) {
      const days = Math.floor((now - new Date(s.activated_at).getTime()) / 86_400_000)
      if (days <= 6) {
        first_milestones.push({ org_id: s.org_id, org_name: s.org_name, kind: "first_subscription" })
      }
    }
  }

  // Suppress unused: fourteenDaysAgo / sevenDaysAgo, used only for documentation
  void sevenDaysAgo
  void fourteenDaysAgo

  return { subs, bookings_by_gym, overdue_tickets, hot_discovery, first_milestones }
}

/* ─── generators ─────────────────────────────────────────────────── */

/**
 * Trial expiring within 7 days (and trial expired but not converted).
 * Severity escalates as the deadline approaches.
 */
function trialExpirationSignals(snap: Snapshot): SignalDraft[] {
  const now = Date.now()
  const drafts: SignalDraft[] = []
  for (const s of snap.subs) {
    if (s.status !== "trial" || !s.trial_ends_at) continue
    const endsAt = new Date(s.trial_ends_at).getTime()
    const daysLeft = Math.ceil((endsAt - now) / 86_400_000)
    if (endsAt < now) {
      drafts.push({
        kind: "trial_expired",
        severity: "critical",
        target_org_id: s.org_id,
        title: `${s.org_name} — trial expired`,
        summary: `Trial ended ${-daysLeft}d ago, no payment yet. Probably gone unless you reach out.`,
        evidence: { trial_ends_at: s.trial_ends_at, days_overdue: -daysLeft },
        suggested_action: `Email ${s.org_email ?? "the owner"} with a friendly nudge + offer help.`,
        dedup_key: `expired:${new Date(s.trial_ends_at).toISOString().slice(0, 10)}`,
      })
    } else if (daysLeft <= 3) {
      drafts.push({
        kind: "trial_ending",
        severity: "warning",
        target_org_id: s.org_id,
        title: `${s.org_name} — trial ends in ${daysLeft}d`,
        summary: `Trial converts or churns ${new Date(s.trial_ends_at).toLocaleDateString()}.`,
        evidence: { trial_ends_at: s.trial_ends_at, days_left: daysLeft },
        suggested_action: `Send a check-in: "Need help getting set up before your trial ends?"`,
        dedup_key: `ending:${new Date(s.trial_ends_at).toISOString().slice(0, 10)}`,
      })
    } else if (daysLeft <= 7) {
      drafts.push({
        kind: "trial_ending",
        severity: "info",
        target_org_id: s.org_id,
        title: `${s.org_name} — trial ends in ${daysLeft}d`,
        summary: `Heads up — week's worth of runway left.`,
        evidence: { trial_ends_at: s.trial_ends_at, days_left: daysLeft },
        suggested_action: `Make sure they've activated key features (website published, services set up).`,
        dedup_key: `ending:${new Date(s.trial_ends_at).toISOString().slice(0, 10)}`,
      })
    }
  }
  return drafts
}

/** Past-due subscriptions — collection signal. */
function pastDueSignals(snap: Snapshot): SignalDraft[] {
  return snap.subs
    .filter((s) => s.status === "past_due")
    .map((s) => ({
      kind: "past_due",
      severity: "critical",
      target_org_id: s.org_id,
      title: `${s.org_name} — payment failed`,
      summary: `Subscription past due. Stripe will retry, but you should reach out.`,
      evidence: { current_period_end: s.current_period_end },
      suggested_action: `Email ${s.org_email ?? "the owner"} to confirm card on file is current.`,
      dedup_key: `past_due:${new Date().toISOString().slice(0, 10)}`,
    }))
}

/**
 * Active gyms with no bookings in last 14 days → engagement risk.
 * Excludes gyms that joined very recently (no chance to have bookings yet).
 */
function inactivityRiskSignals(snap: Snapshot): SignalDraft[] {
  const drafts: SignalDraft[] = []
  const now = Date.now()
  for (const s of snap.subs) {
    if (s.status !== "active") continue
    if (!s.activated_at) continue
    const daysActive = Math.floor((now - new Date(s.activated_at).getTime()) / 86_400_000)
    if (daysActive < 14) continue // too soon to flag

    const buckets = snap.bookings_by_gym.get(s.org_id)
    const last14 = (buckets?.last7 ?? 0) + (buckets?.prior7 ?? 0)
    if (last14 === 0) {
      drafts.push({
        kind: "inactivity_risk",
        severity: "warning",
        target_org_id: s.org_id,
        title: `${s.org_name} — no bookings in 2 weeks`,
        summary: `Active subscription but zero booking activity. Could be the off-season or could be a problem.`,
        evidence: { last_14_days_bookings: 0, days_subscribed: daysActive },
        suggested_action: `Quick check-in: "How's everything going? Any setup issues we can help with?"`,
        dedup_key: `inactive:week:${new Date().toISOString().slice(0, 10)}`,
      })
    }
  }
  return drafts
}

/**
 * Booking velocity drop — >50% week-over-week, only flag if prior week
 * had meaningful volume (≥3) so we don't yell about random noise.
 */
function bookingVelocityDropSignals(snap: Snapshot): SignalDraft[] {
  const drafts: SignalDraft[] = []
  for (const s of snap.subs) {
    if (s.status !== "active") continue
    const b = snap.bookings_by_gym.get(s.org_id)
    if (!b) continue
    if (b.prior7 < 3) continue
    const drop = (b.prior7 - b.last7) / b.prior7
    if (drop >= 0.5) {
      drafts.push({
        kind: "velocity_drop",
        severity: "warning",
        target_org_id: s.org_id,
        title: `${s.org_name} — bookings dropped ${Math.round(drop * 100)}%`,
        summary: `${b.prior7} bookings last week → ${b.last7} this week. Could be seasonal, but worth a glance.`,
        evidence: { last7: b.last7, prior7: b.prior7, drop_pct: Math.round(drop * 100) },
        suggested_action: `Open their /admin → Today to scan what's going on. Maybe a holiday week, maybe a problem.`,
        dedup_key: `velocity:${new Date().toISOString().slice(0, 10).slice(0, 7)}`,
      })
    }
  }
  return drafts
}

/** SLA-overdue support tickets → bubble them up as critical. */
function supportOverdueSignals(snap: Snapshot): SignalDraft[] {
  return snap.overdue_tickets.map((t) => {
    const hoursOverdue = Math.round(
      (Date.now() - new Date(t.sla_due_at).getTime()) / 3_600_000,
    )
    return {
      kind: "support_overdue",
      severity: hoursOverdue > 24 ? "critical" : "warning",
      target_org_id: t.org_id,
      title: `Support overdue: ${t.subject}`,
      summary: `${hoursOverdue}h past SLA for ${t.org_name}.`,
      evidence: { ticket_id: t.id, sla_due_at: t.sla_due_at, hours_overdue: hoursOverdue },
      suggested_action: `Open /platform-admin → Support → ${t.subject.slice(0, 40)}…`,
      dedup_key: `sla:${t.id}`,
    } satisfies SignalDraft
  })
}

/** Discovered gyms with strong signal but never invited. */
function outreachOpportunitySignals(snap: Snapshot): SignalDraft[] {
  return snap.hot_discovery.slice(0, 5).map((d) => ({
    kind: "outreach_opportunity",
    severity: "info",
    target_org_id: null,
    title: `Outreach: ${d.name}`,
    summary: `Google ${d.google_rating}★${d.city ? ` in ${d.city}` : ""}. Verified but not yet invited.`,
    evidence: {
      discovered_gym_id: d.id,
      google_rating: d.google_rating,
      city: d.city,
    },
    suggested_action: `Open /platform-admin → Network → ${d.name} → Draft invite.`,
    dedup_key: `outreach:${d.id}:${new Date().toISOString().slice(0, 10).slice(0, 7)}`,
  }))
}

/** Celebrations — gyms that hit a "first" recently. */
function celebrationSignals(snap: Snapshot): SignalDraft[] {
  return snap.first_milestones.map((m) => ({
    kind: "celebration",
    severity: "info",
    target_org_id: m.org_id,
    title: `🎉 ${m.org_name} — ${labelMilestone(m.kind)}`,
    summary: `Worth a personal note. Small touch + big retention impact.`,
    evidence: { milestone: m.kind },
    suggested_action: `Send a 1-line note: "Just saw you converted — congrats! Holler if you need anything."`,
    dedup_key: `celebrate:${m.kind}:${new Date().toISOString().slice(0, 10)}`,
  }))
}

function labelMilestone(kind: string): string {
  if (kind === "first_subscription") return "first paid subscription"
  if (kind === "first_booking") return "first online booking"
  return kind.replace(/_/g, " ")
}

const ALL_GENERATORS = [
  trialExpirationSignals,
  pastDueSignals,
  inactivityRiskSignals,
  bookingVelocityDropSignals,
  supportOverdueSignals,
  outreachOpportunitySignals,
  celebrationSignals,
]

export function generateAllSignals(snap: Snapshot): SignalDraft[] {
  const drafts: SignalDraft[] = []
  for (const gen of ALL_GENERATORS) {
    try {
      drafts.push(...gen(snap))
    } catch (err) {
      console.error("[signals] generator failed:", err)
    }
  }
  return drafts
}

/**
 * Optional AI pass — rewrites the title + summary in a warmer, more
 * specific voice for critical/warning signals. Skipped for info-level
 * to keep cost low. Falls back silently if the gateway is down.
 */
export async function aiReframeSignals(drafts: SignalDraft[]): Promise<SignalDraft[]> {
  const candidates = drafts.filter(
    (d) => d.severity !== "info" && d.kind !== "celebration",
  )
  if (candidates.length === 0) return drafts

  try {
    const result = await generateObject({
      model: MODEL_VOICE,
      schema: z.object({
        rewrites: z.array(
          z.object({
            index: z.number().int(),
            title: z.string().max(140),
            summary: z.string().max(280),
          }),
        ),
      }),
      system: `You are OckOck, drafting the morning brief for a single-operator SaaS that serves Muay Thai gyms.

For each signal: rewrite the title + summary in a warmer, more specific voice. Keep it punchy — operator is on the road and scanning. No emojis (we already use them where it matters). No marketing fluff. Speak like a sharp coworker who knows the data.

Don't add facts; only rephrase. If the original is already good, don't change much.`,
      prompt: `Rewrite these signals:\n\n${candidates
        .map(
          (d, i) =>
            `${i}. [${d.severity}] ${d.title}\n   ${d.summary}\n   action: ${d.suggested_action ?? "—"}`,
        )
        .join("\n\n")}`,
    })

    // Apply rewrites back onto a new array
    const out = [...drafts]
    const candidateIndices = new Map<number, number>()
    let ci = 0
    drafts.forEach((d, i) => {
      if (d.severity !== "info" && d.kind !== "celebration") {
        candidateIndices.set(ci, i)
        ci++
      }
    })

    for (const r of result.object.rewrites) {
      const originalIdx = candidateIndices.get(r.index)
      if (originalIdx == null) continue
      out[originalIdx] = {
        ...out[originalIdx],
        title: r.title || out[originalIdx].title,
        summary: r.summary || out[originalIdx].summary,
      }
    }
    return out
  } catch (err) {
    console.error("[signals] AI reframe failed:", err)
    return drafts
  }
}
