/**
 * Bookings breakdown for /platform-admin.
 *
 * GET /api/platform-admin/bookings-breakdown?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Single endpoint that returns everything the dashboard needs in one
 * round trip. Designed to stay fast as gyms grow — indexed lookups +
 * server-side aggregation, no N+1.
 *
 * Returns:
 *   - totals: network-wide rollup for the headline cards
 *   - by_gym: per-gym summary table (sortable client-side)
 *   - recent: last 50 bookings across all gyms (for the activity tail)
 *
 * All money is in the smallest unit:
 *   - THB columns: whole baht (no decimals)
 *   - USD columns: cents
 * The UI formats for display.
 */
import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface BookingRow {
  id: string
  org_id: string
  booking_date: string
  status: string
  payment_method: string | null
  payment_status: string | null
  payment_currency: string | null
  payment_amount_thb: number | null
  payment_amount_usd: number | null
  commission_amount_usd: number | null
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  stripe_fee_cents: number | null
  stripe_net_cents: number | null
  refunded_amount_cents: number | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: any
  guest_name: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any
}

export async function GET(request: Request) {
  const { supabase, isPlatformAdmin, role } = await getPlatformAdmin()
  if (!isPlatformAdmin || role === "partner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const todayStr = today.toISOString().slice(0, 10)
  const from = url.searchParams.get("from") ?? firstOfMonth
  const to = url.searchParams.get("to") ?? todayStr

  // Pull gyms + bookings + payouts in parallel
  const [gymsRes, bookingsRes, payoutsRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, status, gym_subscriptions(status), stripe_account_id, stripe_onboarded")
      .order("name"),
    supabase
      .from("bookings")
      .select(`
        id, org_id, booking_date, status, payment_method, payment_status,
        payment_currency, payment_amount_thb, payment_amount_usd,
        commission_amount_usd, stripe_payment_intent_id,
        stripe_charge_id, stripe_fee_cents, stripe_net_cents,
        refunded_amount_cents,
        guest_name,
        services:service_id (name),
        users:user_id (full_name, email)
      `)
      .gte("booking_date", from)
      .lte("booking_date", to)
      .order("booking_date", { ascending: false })
      .limit(5000), // hard cap; sane at any near-term scale
    supabase
      .from("gym_payouts")
      .select("org_id, amount_usd, status, period_start, period_end, paid_at")
      .gte("period_end", from)
      .lte("period_start", to),
  ])

  const bookings = (bookingsRes.data ?? []) as BookingRow[]

  // Build per-gym buckets
  type Bucket = {
    org_id: string
    gym_name: string
    gym_slug: string | null
    stripe_onboarded: boolean
    stripe_paid_usd_cents: number
    stripe_fee_usd_cents: number
    stripe_net_usd_cents: number
    stripe_fee_known_count: number
    platform_commission_usd_cents: number
    cash_paid_thb: number
    cash_pending_thb: number
    transfer_paid_thb: number
    stripe_paid_count: number
    cash_paid_count: number
    cash_pending_count: number
    transfer_paid_count: number
    unspecified_count: number
    total_bookings: number
    refunded_count: number
    refunded_amount_usd_cents: number
    payouts_paid_usd_cents: number
  }

  const buckets = new Map<string, Bucket>()
  for (const g of gymsRes.data ?? []) {
    buckets.set(g.id, {
      org_id: g.id,
      gym_name: g.name,
      gym_slug: g.slug,
      stripe_onboarded: !!g.stripe_onboarded,
      stripe_paid_usd_cents: 0,
      stripe_fee_usd_cents: 0,
      stripe_net_usd_cents: 0,
      stripe_fee_known_count: 0,
      platform_commission_usd_cents: 0,
      cash_paid_thb: 0,
      cash_pending_thb: 0,
      transfer_paid_thb: 0,
      stripe_paid_count: 0,
      cash_paid_count: 0,
      cash_pending_count: 0,
      transfer_paid_count: 0,
      unspecified_count: 0,
      total_bookings: 0,
      refunded_count: 0,
      refunded_amount_usd_cents: 0,
      payouts_paid_usd_cents: 0,
    })
  }

  for (const b of bookings) {
    const slot = buckets.get(b.org_id)
    if (!slot) continue
    slot.total_bookings++

    if (b.payment_status === "refunded") {
      slot.refunded_count++
      slot.refunded_amount_usd_cents += b.refunded_amount_cents ?? 0
      // refunded bookings don't contribute to revenue totals
      continue
    }

    const method = b.payment_method ?? "unspecified"
    const thb = b.payment_amount_thb ?? 0
    const usdCents = b.payment_amount_usd ?? 0
    const commissionCents = Math.round((b.commission_amount_usd ?? 0) * 100)

    if (method === "stripe" && b.payment_status === "paid") {
      slot.stripe_paid_usd_cents += usdCents
      slot.platform_commission_usd_cents += commissionCents
      slot.stripe_paid_count++
      // Fees may be NULL on pre-migration historical bookings — only
      // count toward the snapshot when we actually have ground truth.
      if (b.stripe_fee_cents != null) {
        slot.stripe_fee_usd_cents += b.stripe_fee_cents
        slot.stripe_net_usd_cents += b.stripe_net_cents ?? (usdCents - b.stripe_fee_cents)
        slot.stripe_fee_known_count++
      }
    } else if (method === "cash" && b.payment_status === "paid") {
      slot.cash_paid_thb += thb
      slot.cash_paid_count++
    } else if (method === "cash" && b.payment_status === "pending") {
      slot.cash_pending_thb += thb
      slot.cash_pending_count++
    } else if (method === "transfer" && b.payment_status === "paid") {
      slot.transfer_paid_thb += thb
      slot.transfer_paid_count++
    } else if (!b.payment_method) {
      slot.unspecified_count++
    }
  }

  // Layer in payouts that have been settled in this period
  for (const p of payoutsRes.data ?? []) {
    const slot = buckets.get(p.org_id)
    if (!slot) continue
    if (p.status === "paid") {
      // amount_usd is stored as dollars (decimal). Convert to cents for the rollup.
      slot.payouts_paid_usd_cents += Math.round((p.amount_usd ?? 0) * 100)
    }
  }

  const by_gym = Array.from(buckets.values())
    // Hide gyms with zero activity to keep the UI clean at scale
    .filter((b) => b.total_bookings > 0 || b.payouts_paid_usd_cents > 0)
    .sort((a, b) => b.total_bookings - a.total_bookings)

  // Network totals
  const totals = by_gym.reduce(
    (acc, g) => ({
      bookings: acc.bookings + g.total_bookings,
      stripe_paid_usd_cents: acc.stripe_paid_usd_cents + g.stripe_paid_usd_cents,
      stripe_fee_usd_cents: acc.stripe_fee_usd_cents + g.stripe_fee_usd_cents,
      stripe_net_usd_cents: acc.stripe_net_usd_cents + g.stripe_net_usd_cents,
      stripe_fee_known_count: acc.stripe_fee_known_count + g.stripe_fee_known_count,
      platform_commission_usd_cents:
        acc.platform_commission_usd_cents + g.platform_commission_usd_cents,
      cash_paid_thb: acc.cash_paid_thb + g.cash_paid_thb,
      cash_pending_thb: acc.cash_pending_thb + g.cash_pending_thb,
      transfer_paid_thb: acc.transfer_paid_thb + g.transfer_paid_thb,
      stripe_paid_count: acc.stripe_paid_count + g.stripe_paid_count,
      cash_paid_count: acc.cash_paid_count + g.cash_paid_count,
      cash_pending_count: acc.cash_pending_count + g.cash_pending_count,
      transfer_paid_count: acc.transfer_paid_count + g.transfer_paid_count,
      unspecified_count: acc.unspecified_count + g.unspecified_count,
      refunded_count: acc.refunded_count + g.refunded_count,
      refunded_amount_usd_cents:
        acc.refunded_amount_usd_cents + g.refunded_amount_usd_cents,
      payouts_paid_usd_cents: acc.payouts_paid_usd_cents + g.payouts_paid_usd_cents,
    }),
    {
      bookings: 0,
      stripe_paid_usd_cents: 0,
      stripe_fee_usd_cents: 0,
      stripe_net_usd_cents: 0,
      stripe_fee_known_count: 0,
      platform_commission_usd_cents: 0,
      cash_paid_thb: 0,
      cash_pending_thb: 0,
      transfer_paid_thb: 0,
      stripe_paid_count: 0,
      cash_paid_count: 0,
      cash_pending_count: 0,
      transfer_paid_count: 0,
      unspecified_count: 0,
      refunded_count: 0,
      refunded_amount_usd_cents: 0,
      payouts_paid_usd_cents: 0,
    },
  )

  // Recent tail — 50 most recent bookings across all gyms for the activity stream
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent = bookings.slice(0, 50).map((b: any) => {
    const service = Array.isArray(b.services) ? b.services[0] : b.services
    const user = Array.isArray(b.users) ? b.users[0] : b.users
    return {
      id: b.id,
      org_id: b.org_id,
      gym_name: buckets.get(b.org_id)?.gym_name ?? "—",
      booking_date: b.booking_date,
      customer: b.guest_name || user?.full_name || user?.email || "—",
      service: service?.name ?? "—",
      payment_method: b.payment_method,
      payment_status: b.payment_status,
      payment_currency: b.payment_currency,
      payment_amount_thb: b.payment_amount_thb,
      payment_amount_usd: b.payment_amount_usd,
      stripe_payment_intent_id: b.stripe_payment_intent_id,
      stripe_fee_cents: b.stripe_fee_cents,
      stripe_net_cents: b.stripe_net_cents,
      refunded_amount_cents: b.refunded_amount_cents,
    }
  })

  return NextResponse.json({
    period: { from, to },
    totals,
    by_gym,
    recent,
  })
}
