/**
 * Trainer payout reports.
 *
 * GET /api/admin/payouts?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns per-trainer commission totals for the period, computed from
 * bookings × rules. Doesn't write anything — that's what /settle is for.
 *
 * Also returns the prior settled payouts for the same period so the UI
 * can show "X owed, Y already paid out" if any have been settled.
 */
import { NextResponse } from "next/server"
import { requireGymAdmin } from "@/lib/auth-helpers"
import { groupByTrainer, type CommissionRule, type BookingForCommission } from "@/lib/commissions"

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

  // Pull bookings + rules + trainer profiles + prior payouts in parallel
  const [bookingsRes, rulesRes, trainersRes, payoutsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(`
        id, trainer_id, service_id, booking_date, status, payment_status, payment_amount_thb,
        services:service_id (name)
      `)
      .eq("org_id", orgId)
      .gte("booking_date", from)
      .lte("booking_date", to)
      .not("trainer_id", "is", null),
    supabase
      .from("trainer_commission_rules")
      .select("*")
      .eq("org_id", orgId),
    supabase
      .from("trainer_profiles")
      .select("id, display_name, user_id, users:user_id (full_name, email)")
      .eq("org_id", orgId),
    supabase
      .from("trainer_payouts")
      .select("id, trainer_id, period_start, period_end, total_amount_thb, status, paid_at")
      .eq("org_id", orgId)
      .gte("period_end", from)
      .lte("period_start", to),
  ])

  // Normalize bookings shape (services join could be array or object)
  const bookings: BookingForCommission[] = (bookingsRes.data ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row: any) => {
      const svc = Array.isArray(row.services) ? row.services[0] : row.services
      return {
        id: row.id,
        trainer_id: row.trainer_id,
        service_id: row.service_id,
        booking_date: row.booking_date,
        status: row.status,
        payment_status: row.payment_status,
        payment_amount_thb: row.payment_amount_thb,
        service_name: svc?.name ?? null,
      }
    },
  )

  const rules = (rulesRes.data ?? []) as CommissionRule[]
  const grouped = groupByTrainer(bookings, rules)

  const trainers = (trainersRes.data ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row: any) => {
      const u = Array.isArray(row.users) ? row.users[0] : row.users
      return {
        id: row.id,
        display_name: row.display_name ?? u?.full_name ?? u?.email ?? "Trainer",
      }
    },
  )

  const summary = trainers
    .map((t) => {
      const result = grouped.get(t.id) ?? {
        line_items: [],
        total_sessions: 0,
        total_commission_thb: 0,
        total_revenue_thb: 0,
        flagged_count: 0,
      }
      return {
        trainer_id: t.id,
        trainer_name: t.display_name,
        ...result,
      }
    })
    // Hide trainers with zero activity in the period to keep the UI clean
    .filter((t) => t.total_sessions > 0)
    .sort((a, b) => b.total_commission_thb - a.total_commission_thb)

  const totals = {
    sessions: summary.reduce((s, t) => s + t.total_sessions, 0),
    commission_thb: summary.reduce((s, t) => s + t.total_commission_thb, 0),
    revenue_thb: summary.reduce((s, t) => s + t.total_revenue_thb, 0),
    flagged: summary.reduce((s, t) => s + t.flagged_count, 0),
  }

  return NextResponse.json({
    period: { from, to },
    summary,
    totals,
    prior_payouts: payoutsRes.data ?? [],
  })
}
