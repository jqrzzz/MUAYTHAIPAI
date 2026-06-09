/**
 * Per-gym finance summary for the gym owner's "Payments" tab.
 *
 * GET /api/admin/finance?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Read-only. Scoped to the caller's own gym (requireGymAdmin). Mirrors the
 * platform payout math exactly so a gym owner sees the same "you're owed"
 * number the operator settles:
 *
 *   online collected (USD, whole dollars) − 15% commission = owed to gym.
 *
 * Online card payments are collected into the platform Stripe account and
 * settled to the gym via gym_payouts. Cash + bank transfer are collected by
 * the gym directly (it keeps 100%); we surface them for completeness.
 */
import { NextResponse } from "next/server"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const url = new URL(request.url)
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const todayStr = today.toISOString().slice(0, 10)
  const from = url.searchParams.get("from") ?? firstOfMonth
  const to = url.searchParams.get("to") ?? todayStr

  const [bookingsRes, payoutsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(`
        id, booking_date, payment_method, payment_status,
        payment_amount_thb, payment_amount_usd, commission_amount_usd,
        refunded_amount_cents, guest_name,
        services:service_id (name),
        users:user_id (full_name, email)
      `)
      .eq("org_id", orgId)
      .gte("booking_date", from)
      .lte("booking_date", to)
      .order("booking_date", { ascending: false })
      .limit(2000),
    supabase
      .from("gym_payouts")
      .select(
        "period_start, period_end, total_collected_usd, commission_usd, payout_usd, payout_thb, status, paid_at",
      )
      .eq("org_id", orgId)
      .gte("period_end", from)
      .lte("period_start", to)
      .order("period_end", { ascending: false }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (bookingsRes.data ?? []) as any[]

  let onlineCollectedUsd = 0
  let onlineCommissionUsd = 0
  let onlineCount = 0
  let cashPaidThb = 0
  let cashPaidCount = 0
  let cashPendingThb = 0
  let cashPendingCount = 0
  let transferPaidThb = 0
  let transferPaidCount = 0
  let refundedCount = 0
  let refundedUsd = 0

  for (const b of bookings) {
    if (b.payment_status === "refunded") {
      refundedCount++
      refundedUsd += (b.refunded_amount_cents ?? 0) / 100
      continue
    }
    const method = b.payment_method
    if (method === "stripe" && b.payment_status === "paid") {
      onlineCollectedUsd += b.payment_amount_usd ?? 0
      onlineCommissionUsd += Number(b.commission_amount_usd ?? 0)
      onlineCount++
    } else if (method === "cash" && b.payment_status === "paid") {
      cashPaidThb += b.payment_amount_thb ?? 0
      cashPaidCount++
    } else if (method === "cash" && b.payment_status === "pending") {
      cashPendingThb += b.payment_amount_thb ?? 0
      cashPendingCount++
    } else if (method === "transfer" && b.payment_status === "paid") {
      transferPaidThb += b.payment_amount_thb ?? 0
      transferPaidCount++
    }
  }

  const owedUsd = onlineCollectedUsd - onlineCommissionUsd
  const payout = (payoutsRes.data ?? [])[0] ?? null

  const recent = bookings
    .filter((b) => b.payment_method === "stripe")
    .slice(0, 15)
    .map((b) => {
      const service = Array.isArray(b.services) ? b.services[0] : b.services
      const user = Array.isArray(b.users) ? b.users[0] : b.users
      return {
        id: b.id,
        date: b.booking_date,
        customer: b.guest_name || user?.full_name || user?.email || "—",
        service: service?.name ?? "—",
        status: b.payment_status,
        amountUsd: b.payment_amount_usd ?? 0,
        commissionUsd: Number(b.commission_amount_usd ?? 0),
      }
    })

  return NextResponse.json({
    period: { from, to },
    online: {
      collectedUsd: onlineCollectedUsd,
      commissionUsd: onlineCommissionUsd,
      owedUsd,
      count: onlineCount,
    },
    cash: {
      paidThb: cashPaidThb,
      paidCount: cashPaidCount,
      pendingThb: cashPendingThb,
      pendingCount: cashPendingCount,
    },
    transfer: { paidThb: transferPaidThb, paidCount: transferPaidCount },
    refunds: { count: refundedCount, amountUsd: refundedUsd },
    payout: payout
      ? {
          status: payout.status,
          payoutUsd: Number(payout.payout_usd ?? 0),
          payoutThb: Number(payout.payout_thb ?? 0),
          paidAt: payout.paid_at,
        }
      : null,
    recent,
  })
}
