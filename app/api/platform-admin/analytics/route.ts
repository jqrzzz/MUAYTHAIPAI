import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()

  if (!userData?.is_platform_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get("days") || "30")

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceISO = since.toISOString()

  const [bookingRes, gymBookingRes, subRes, studentSubRes] = await Promise.all([
    serviceClient
      .from("bookings")
      .select("id, org_id, payment_status, payment_method, payment_amount_thb, payment_amount_usd, payment_currency, booking_date, created_at")
      .gte("created_at", sinceISO)
      .in("payment_status", ["paid", "completed"]),

    serviceClient
      .from("bookings")
      .select("org_id, payment_amount_thb, payment_amount_usd, payment_currency, payment_method")
      .gte("created_at", sinceISO)
      .in("payment_status", ["paid", "completed"]),

    serviceClient
      .from("gym_subscriptions")
      .select("org_id, status, price_thb, current_period_end, organizations(name, slug)")
      .in("status", ["active", "trial", "past_due"]),

    serviceClient
      .from("student_subscriptions")
      .select("id, status, price_thb, created_at, cancelled_at"),
  ])

  const bookings = bookingRes.data || []
  const gymBookings = gymBookingRes.data || []
  const gymSubs = subRes.data || []
  const studentSubs = studentSubRes.data || []

  const cashBookings = bookings.filter((b) => b.payment_method === "cash")
  const onlineBookings = bookings.filter((b) => b.payment_method !== "cash")

  const totalCashThb = cashBookings.reduce((sum, b) => sum + (b.payment_amount_thb || 0), 0)
  const totalOnlineUsd = onlineBookings.reduce((sum, b) => sum + (b.payment_amount_usd || 0), 0)
  const totalOnlineThb = onlineBookings.reduce((sum, b) => sum + (b.payment_amount_thb || 0), 0)

  const dailyRevenue: Record<string, { cash_thb: number; online_usd: number; bookings: number }> = {}
  for (const b of bookings) {
    const day = b.booking_date || b.created_at?.split("T")[0]
    if (!day) continue
    if (!dailyRevenue[day]) dailyRevenue[day] = { cash_thb: 0, online_usd: 0, bookings: 0 }
    dailyRevenue[day].bookings += 1
    if (b.payment_method === "cash") {
      dailyRevenue[day].cash_thb += b.payment_amount_thb || 0
    } else {
      dailyRevenue[day].online_usd += b.payment_amount_usd || 0
    }
  }

  const dailyArray = Object.entries(dailyRevenue)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const gymMap: Record<string, { name: string; cash_thb: number; online_usd: number; bookings: number }> = {}
  const orgNames: Record<string, string> = {}
  for (const sub of gymSubs) {
    const org = sub.organizations as unknown as { name: string; slug: string } | null
    if (org) orgNames[sub.org_id] = org.name
  }

  for (const b of gymBookings) {
    if (!b.org_id) continue
    if (!gymMap[b.org_id]) {
      gymMap[b.org_id] = {
        name: orgNames[b.org_id] || b.org_id,
        cash_thb: 0,
        online_usd: 0,
        bookings: 0,
      }
    }
    gymMap[b.org_id].bookings += 1
    if (b.payment_method === "cash") {
      gymMap[b.org_id].cash_thb += b.payment_amount_thb || 0
    } else {
      gymMap[b.org_id].online_usd += b.payment_amount_usd || 0
    }
  }

  const gymPerformance = Object.values(gymMap).sort((a, b) => b.bookings - a.bookings)

  const activeStudentSubs = studentSubs.filter((s) => s.status === "active").length
  const studentSubMrr = activeStudentSubs * (studentSubs[0]?.price_thb || 299)
  const cancelledSubs = studentSubs.filter((s) => s.status === "cancelled").length

  return NextResponse.json({
    period: { days, since: sinceISO },
    summary: {
      totalBookings: bookings.length,
      cashBookings: cashBookings.length,
      onlineBookings: onlineBookings.length,
      totalCashThb,
      totalOnlineUsd,
      totalOnlineThb,
    },
    daily: dailyArray,
    gymPerformance,
    studentSubscriptions: {
      active: activeStudentSubs,
      cancelled: cancelledSubs,
      total: studentSubs.length,
      mrr: studentSubMrr,
    },
    gymSubscriptions: {
      active: gymSubs.filter((s) => s.status === "active").length,
      trial: gymSubs.filter((s) => s.status === "trial").length,
      pastDue: gymSubs.filter((s) => s.status === "past_due").length,
      mrr: gymSubs.filter((s) => s.status === "active").length * 999,
    },
  })
}
