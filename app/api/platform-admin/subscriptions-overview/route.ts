/**
 * Subscription revenue overview for /platform-admin.
 *
 * GET /api/platform-admin/subscriptions-overview
 *
 * The "is the business healthy?" view. Returns:
 *   - totals: MRR + ARR + counts by status + churn 30d + trial conversion
 *   - per_gym: every gym with their sub state, MRR contribution, days in
 *     status, expiration warning if relevant
 *   - recent_invoices: last 50 paid invoices for an activity tail
 *   - cohort_30d: how this month's trials are converting
 *
 * Single API call, server-side aggregation, designed to feel instant
 * even at 50+ gyms.
 */
import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Fallback price for legacy subs that don't have monthly_price_usd_cents
// (created before migration 040). Matches the hardcoded checkout price.
const DEFAULT_MONTHLY_USD_CENTS = 2900

interface SubscriptionRow {
  id: string
  org_id: string
  status: string
  plan: string | null
  monthly_price_usd_cents: number | null
  trial_starts_at: string | null
  trial_ends_at: string | null
  activated_at: string | null
  cancelled_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  stripe_subscription_id: string | null
  created_at: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organizations: any
}

interface InvoiceRow {
  id: string
  org_id: string
  amount_paid_usd_cents: number
  fee_usd_cents: number | null
  net_usd_cents: number | null
  status: string
  period_start: string | null
  period_end: string | null
  paid_at: string
}

export async function GET() {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [subsRes, invoicesRes, recentInvoicesRes] = await Promise.all([
    supabase
      .from("gym_subscriptions")
      .select(`
        id, org_id, status, plan, monthly_price_usd_cents,
        trial_starts_at, trial_ends_at, activated_at, cancelled_at,
        current_period_start, current_period_end, stripe_subscription_id,
        created_at,
        organizations:org_id (id, name, slug, email, created_at)
      `)
      .order("created_at", { ascending: false }),
    // All invoices in last 30 days for churn + new-MRR math
    supabase
      .from("gym_subscription_invoices")
      .select("id, org_id, amount_paid_usd_cents, fee_usd_cents, net_usd_cents, status, period_start, period_end, paid_at")
      .gte("paid_at", thirtyDaysAgo.toISOString())
      .order("paid_at", { ascending: false }),
    // Recent activity tail
    supabase
      .from("gym_subscription_invoices")
      .select(`
        id, org_id, amount_paid_usd_cents, fee_usd_cents, net_usd_cents,
        status, period_start, period_end, paid_at,
        organizations:org_id (name, slug)
      `)
      .order("paid_at", { ascending: false })
      .limit(50),
  ])

  const subs = (subsRes.data ?? []) as SubscriptionRow[]
  const invoices = (invoicesRes.data ?? []) as InvoiceRow[]

  // MRR helper — what each active sub contributes per month, in cents
  const monthlyOf = (s: SubscriptionRow): number => {
    if (s.monthly_price_usd_cents) return s.monthly_price_usd_cents
    // Legacy active subs without recorded price — assume the hardcoded $29
    return s.status === "active" ? DEFAULT_MONTHLY_USD_CENTS : 0
  }

  // Per-gym view
  const perGym = subs.map((s) => {
    const org = Array.isArray(s.organizations) ? s.organizations[0] : s.organizations
    const monthly = monthlyOf(s)
    const daysInStatus = daysSince(
      s.status === "trial"
        ? s.created_at
        : s.status === "cancelled"
          ? s.cancelled_at
          : s.activated_at,
    )
    const trialEndsAt = s.trial_ends_at ? new Date(s.trial_ends_at) : null
    const periodEndsAt = s.current_period_end ? new Date(s.current_period_end) : null

    return {
      org_id: s.org_id,
      gym_name: org?.name ?? "—",
      gym_slug: org?.slug ?? null,
      gym_email: org?.email ?? null,
      status: s.status,
      plan: s.plan ?? "standard",
      monthly_price_usd_cents: monthly,
      trial_ends_at: s.trial_ends_at,
      activated_at: s.activated_at,
      cancelled_at: s.cancelled_at,
      current_period_end: s.current_period_end,
      stripe_subscription_id: s.stripe_subscription_id,
      created_at: s.created_at,
      days_in_status: daysInStatus,
      trial_expiring_soon:
        s.status === "trial" && trialEndsAt
          ? trialEndsAt > now && trialEndsAt < sevenDaysFromNow
          : false,
      trial_expired:
        s.status === "trial" && trialEndsAt ? trialEndsAt <= now : false,
      period_renewing_soon:
        s.status === "active" && periodEndsAt
          ? periodEndsAt > now && periodEndsAt < sevenDaysFromNow
          : false,
    }
  })

  // Status counts + MRR
  const totals = {
    gyms_total: perGym.length,
    active_count: 0,
    trial_count: 0,
    past_due_count: 0,
    cancelled_count: 0,
    other_count: 0,
    mrr_usd_cents: 0,
    arr_usd_cents: 0,
    // 30-day signals
    new_subs_30d: 0,
    cancelled_30d: 0,
    trial_expiring_7d: 0,
    trial_expired_unconverted: 0,
    // Cash flow (last 30 days, from invoice ledger)
    invoiced_30d_gross_cents: 0,
    invoiced_30d_fee_cents: 0,
    invoiced_30d_net_cents: 0,
    invoiced_30d_count: 0,
  }

  for (const g of perGym) {
    if (g.status === "active") {
      totals.active_count++
      totals.mrr_usd_cents += g.monthly_price_usd_cents
    } else if (g.status === "trial") {
      totals.trial_count++
      if (g.trial_expiring_soon) totals.trial_expiring_7d++
      if (g.trial_expired) totals.trial_expired_unconverted++
    } else if (g.status === "past_due") {
      totals.past_due_count++
    } else if (g.status === "cancelled") {
      totals.cancelled_count++
    } else {
      totals.other_count++
    }

    if (g.activated_at && new Date(g.activated_at) >= thirtyDaysAgo) {
      totals.new_subs_30d++
    }
    if (g.cancelled_at && new Date(g.cancelled_at) >= thirtyDaysAgo) {
      totals.cancelled_30d++
    }
  }
  totals.arr_usd_cents = totals.mrr_usd_cents * 12

  for (const inv of invoices) {
    if (inv.status !== "paid") continue
    totals.invoiced_30d_gross_cents += inv.amount_paid_usd_cents
    totals.invoiced_30d_fee_cents += inv.fee_usd_cents ?? 0
    totals.invoiced_30d_net_cents += inv.net_usd_cents ?? inv.amount_paid_usd_cents
    totals.invoiced_30d_count++
  }

  // Churn rate (30d) — cancelled / (active at period start)
  // Approximated: active now + cancelled in last 30d as the denominator
  const churnDenom = totals.active_count + totals.cancelled_30d
  const churn_rate_30d_pct =
    churnDenom > 0 ? Math.round((totals.cancelled_30d / churnDenom) * 100) : 0

  // Trial conversion this month — how many trials started in/before this
  // month converted to active during this month?
  const trialsActivatedThisMonth = subs.filter(
    (s) =>
      s.activated_at &&
      new Date(s.activated_at) >= firstOfMonth &&
      new Date(s.activated_at) <= now,
  ).length

  const recent_invoices = (recentInvoicesRes.data ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (inv: any) => {
      const org = Array.isArray(inv.organizations) ? inv.organizations[0] : inv.organizations
      return {
        id: inv.id,
        gym_name: org?.name ?? "—",
        amount_paid_usd_cents: inv.amount_paid_usd_cents,
        fee_usd_cents: inv.fee_usd_cents,
        net_usd_cents: inv.net_usd_cents,
        period_start: inv.period_start,
        period_end: inv.period_end,
        paid_at: inv.paid_at,
        status: inv.status,
      }
    },
  )

  // Sort per-gym: active first (by MRR desc), then trial (by trial_ends_at),
  // then past_due, then cancelled
  const statusOrder: Record<string, number> = {
    active: 0,
    past_due: 1,
    trial: 2,
    cancelled: 3,
  }
  perGym.sort((a, b) => {
    const ao = statusOrder[a.status] ?? 4
    const bo = statusOrder[b.status] ?? 4
    if (ao !== bo) return ao - bo
    // Within same status: highest MRR first
    return b.monthly_price_usd_cents - a.monthly_price_usd_cents
  })

  return NextResponse.json({
    totals: {
      ...totals,
      churn_rate_30d_pct,
      trials_activated_this_month: trialsActivatedThisMonth,
    },
    per_gym: perGym,
    recent_invoices,
  })
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const ms = Date.now() - new Date(dateStr).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}
