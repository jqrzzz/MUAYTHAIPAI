import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { PAYMENT_CONFIG, estimateStripeFee } from "@/lib/payment-config"

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .single()

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const months = parseInt(searchParams.get("months") || "3")

  const since = new Date()
  since.setMonth(since.getMonth() - months)

  const [bookingsRes, payoutsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, customer_name, payment_amount_usd, commission_rate, commission_amount_usd, payment_method, payment_currency, created_at, services(name)")
      .eq("org_id", membership.org_id)
      .eq("payment_currency", "USD")
      .in("payment_status", ["paid", "completed"])
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false }),

    supabase
      .from("gym_payouts")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("period_start", { ascending: false })
      .limit(12),
  ])

  const bookings = bookingsRes.data || []
  const payouts = payoutsRes.data || []

  const totalCollected = bookings.reduce((sum, b) => sum + (b.payment_amount_usd || 0), 0)
  const totalCommission = bookings.reduce((sum, b) => sum + (b.commission_amount_usd || 0), 0)
  const totalOwed = totalCollected - totalCommission
  const totalStripeFees = bookings.reduce((sum, b) => sum + estimateStripeFee(b.payment_amount_usd || 0), 0)

  const monthlyBreakdown: Record<string, { collected: number; commission: number; owed: number; bookings: number; stripeFees: number }> = {}
  for (const b of bookings) {
    const month = b.created_at.slice(0, 7)
    if (!monthlyBreakdown[month]) {
      monthlyBreakdown[month] = { collected: 0, commission: 0, owed: 0, bookings: 0, stripeFees: 0 }
    }
    const amt = b.payment_amount_usd || 0
    const comm = b.commission_amount_usd || 0
    monthlyBreakdown[month].collected += amt
    monthlyBreakdown[month].commission += comm
    monthlyBreakdown[month].owed += amt - comm
    monthlyBreakdown[month].bookings += 1
    monthlyBreakdown[month].stripeFees += estimateStripeFee(amt)
  }

  const monthly = Object.entries(monthlyBreakdown)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => b.month.localeCompare(a.month))

  return NextResponse.json({
    commissionRate: PAYMENT_CONFIG.platform.commissionRate,
    stripeFeeInfo: {
      percent: PAYMENT_CONFIG.stripe.processingFeePercent,
      fixedUsd: PAYMENT_CONFIG.stripe.processingFeeFixedUsd,
      absorbedByPlatform: true,
    },
    summary: {
      totalCollected,
      totalCommission,
      totalOwed,
      totalStripeFees,
      bookingCount: bookings.length,
      months,
    },
    monthly,
    recentBookings: bookings.slice(0, 20).map((b) => ({
      id: b.id,
      customerName: b.customer_name,
      service: (b.services as unknown as { name: string } | null)?.name || "Unknown",
      amountUsd: b.payment_amount_usd,
      commissionUsd: b.commission_amount_usd,
      date: b.created_at,
    })),
    payouts: payouts.map((p) => ({
      id: p.id,
      periodStart: p.period_start,
      periodEnd: p.period_end,
      amountUsd: p.amount_owed_usd,
      amountThb: p.amount_thb,
      exchangeRate: p.exchange_rate,
      status: p.status,
      paidAt: p.paid_at,
    })),
  })
}
