import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if platform admin
  const { data: userData } = await supabase.from("users").select("is_platform_admin").eq("id", user.id).single()

  if (!userData?.is_platform_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      org_id,
      customer_name,
      payment_amount_usd,
      commission_rate,
      commission_amount_usd,
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
    const amountOwed = totalCollected - totalCommission

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
        customerName: b.customer_name,
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
            amountThb: existingPayout.amount_thb,
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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if platform admin
  const { data: userData } = await supabase.from("users").select("is_platform_admin").eq("id", user.id).single()

  if (!userData?.is_platform_admin) {
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
        total_online_usd: amountUsd + commissionUsd,
        commission_usd: commissionUsd,
        amount_owed_usd: amountUsd,
        exchange_rate: exchangeRate,
        amount_thb: amountThb,
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

  return NextResponse.json({ success: true, payout })
}
