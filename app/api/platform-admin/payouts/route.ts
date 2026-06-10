import { getPlatformAdmin } from "@/lib/auth-helpers"
import { NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-log"
import { serviceRoleClient } from "@/lib/supabase/service-role"

export async function GET(request: Request) {
  const { supabase, user, isPlatformAdmin, role } = await getPlatformAdmin()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isPlatformAdmin || role === "partner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // bookings has no platform-admin RLS policy — read it network-wide via the
  // service-role client (route is partner-gated above). organizations +
  // gym_payouts have admin policies and stay on the RLS client.
  const db = serviceRoleClient()

  // Get query params for period
  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "month" // "week" or "month"
  const dateParam = searchParams.get("date") // YYYY-MM or YYYY-Www

  // Calculate date range
  let startDate: Date
  let endDate: Date

  if (period === "week") {
    // If dateParam is like "2026-W03", parse it; otherwise use current week
    if (dateParam && dateParam.includes("W")) {
      const [year, week] = dateParam.split("-W").map(Number)
      startDate = getStartOfWeek(year, week)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
    } else {
      const now = new Date()
      const dayOfWeek = now.getDay()
      startDate = new Date(now)
      startDate.setDate(now.getDate() - dayOfWeek)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
    }
  } else {
    // Monthly
    if (dateParam && dateParam.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = dateParam.split("-").map(Number)
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0) // Last day of month
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }
  }

  endDate.setHours(23, 59, 59, 999)

  // Fetch all gyms
  const { data: gyms } = await supabase
    .from("organizations")
    .select("id, name, slug, gym_subscriptions(status)")
    .order("name")

  // Fetch all online bookings (USD) in the period
  const { data: bookings } = await db
    .from("bookings")
    .select(`
      id,
      org_id,
      guest_name,
      payment_amount_usd,
      commission_rate,
      commission_amount_usd,
      stripe_net_cents,
      payment_currency,
      payment_method,
      created_at,
      services(name)
    `)
    .eq("payment_currency", "USD")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: false })

  // Fetch existing payouts for this period
  const { data: existingPayouts } = await supabase
    .from("gym_payouts")
    .select("*")
    .gte("period_start", startDate.toISOString())
    .lte("period_end", endDate.toISOString())

  // Group bookings by gym
  const gymPayouts = (gyms || []).map((gym) => {
    const gymBookings = (bookings || []).filter((b) => b.org_id === gym.id)
    const totalCollected = gymBookings.reduce((sum, b) => sum + (b.payment_amount_usd || 0), 0)
    const totalCommission = gymBookings.reduce((sum, b) => sum + (b.commission_amount_usd || 0), 0)
    // Pure-SaaS: we take 0% — the gym is owed its full Stripe net (gross minus
    // Stripe's own card fee). Historical rows with no captured net fall back to
    // collected − stored commission.
    const amountOwed = gymBookings.reduce(
      (sum, b) =>
        sum +
        (b.stripe_net_cents != null
          ? b.stripe_net_cents / 100
          : (b.payment_amount_usd || 0) - (b.commission_amount_usd || 0)),
      0,
    )

    const existingPayout = (existingPayouts || []).find((p) => p.org_id === gym.id)

    return {
      gym: {
        id: gym.id,
        name: gym.name,
        slug: gym.slug,
        subscriptionStatus: gym.gym_subscriptions?.status || "none",
      },
      bookings: gymBookings.map((b) => ({
        id: b.id,
        customerName: b.guest_name,
        service: b.services?.name || "Unknown",
        amountUsd: b.payment_amount_usd,
        commissionUsd: b.commission_amount_usd,
        date: b.created_at,
      })),
      summary: {
        bookingCount: gymBookings.length,
        totalCollectedUsd: totalCollected,
        commissionUsd: totalCommission,
        amountOwedUsd: amountOwed,
      },
      payout: existingPayout
        ? {
            id: existingPayout.id,
            status: existingPayout.status,
            paidAt: existingPayout.paid_at,
            exchangeRate: existingPayout.exchange_rate,
            amountThb: existingPayout.payout_thb,
          }
        : null,
    }
  })

  // Filter out gyms with no bookings unless they have an existing payout
  const activePayouts = gymPayouts.filter((p) => p.summary.bookingCount > 0 || p.payout)

  // Platform totals
  const totals = {
    totalCollectedUsd: activePayouts.reduce((sum, p) => sum + p.summary.totalCollectedUsd, 0),
    totalCommissionUsd: activePayouts.reduce((sum, p) => sum + p.summary.commissionUsd, 0),
    totalOwedUsd: activePayouts.reduce((sum, p) => sum + p.summary.amountOwedUsd, 0),
    totalBookings: activePayouts.reduce((sum, p) => sum + p.summary.bookingCount, 0),
    gymCount: activePayouts.length,
  }

  return NextResponse.json({
    period: {
      type: period,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      label:
        period === "week"
          ? `Week of ${startDate.toLocaleDateString()}`
          : `${startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    },
    gyms: activePayouts,
    totals,
  })
}

// Helper to get start of ISO week
function getStartOfWeek(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const isoWeek1 = new Date(jan4)
  isoWeek1.setDate(jan4.getDate() - dayOfWeek + 1)

  const result = new Date(isoWeek1)
  result.setDate(isoWeek1.getDate() + (week - 1) * 7)
  result.setHours(0, 0, 0, 0)
  return result
}

// POST - Mark payout as paid
export async function POST(request: Request) {
  const { supabase, user, isPlatformAdmin, role } = await getPlatformAdmin()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isPlatformAdmin || role === "partner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { orgId, periodStart, periodEnd, amountUsd, commissionUsd, exchangeRate, amountThb, notes } = body

  // Create or update payout record
  const { data: payout, error } = await supabase
    .from("gym_payouts")
    .upsert(
      {
        org_id: orgId,
        period_start: periodStart,
        period_end: periodEnd,
        total_collected_usd: amountUsd + commissionUsd,
        commission_usd: commissionUsd,
        payout_usd: amountUsd,
        exchange_rate: exchangeRate,
        payout_thb: amountThb,
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_by: user.id,
        notes,
      },
      {
        onConflict: "org_id,period_start,period_end",
      },
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Resolve gym name for the audit label (best effort)
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle()

  await logAudit(supabase, {
    action: "payout.settle",
    actorUserId: user.id,
    actorEmail: user.email,
    targetType: "gym_payout",
    targetId: payout?.id,
    targetLabel: org?.name ?? null,
    metadata: {
      org_id: orgId,
      period_start: periodStart,
      period_end: periodEnd,
      amount_usd: amountUsd,
      commission_usd: commissionUsd,
      amount_thb: amountThb,
    },
    request,
  })

  return NextResponse.json({ success: true, payout })
}
