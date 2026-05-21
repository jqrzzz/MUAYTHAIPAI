import { NextResponse } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth-helpers"

// Network-wide revenue + bookings for the super-admin view. Mirrors the
// per-gym analytics, aggregated across every gym on the platform. THB.

interface GymRow {
  id: string
  name: string | null
  slug: string | null
  status: string | null
  gym_subscriptions?: { status: string | null }[] | null
}
interface BookingRow {
  org_id: string | null
  booking_date: string | null
  status: string | null
  payment_status: string | null
  payment_amount_thb: number | null
}

export async function GET() {
  // Revenue is a money surface — partners are excluded.
  const auth = await requirePlatformAdmin({ billing: true })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase } = auth

  const [{ data: gyms }, { data: bookings }] = await Promise.all([
    supabase.from("organizations").select("id, name, slug, status, gym_subscriptions(status)"),
    supabase.from("bookings").select("org_id, booking_date, status, payment_status, payment_amount_thb"),
  ])

  const gymList = (gyms as GymRow[]) || []
  const bookingList = (bookings as BookingRow[]) || []

  const perGym = new Map<
    string,
    { name: string; slug: string; status: string; bookings: number; collectedThb: number }
  >()
  for (const g of gymList) {
    perGym.set(g.id, {
      name: g.name || "Unnamed gym",
      slug: g.slug || "",
      status: g.status || "active",
      bookings: 0,
      collectedThb: 0,
    })
  }

  const monthly = new Map<string, { collectedThb: number; bookings: number }>()
  let totalBookings = 0
  let collectedThb = 0
  let outstandingThb = 0

  for (const bk of bookingList) {
    if (bk.status === "cancelled") continue
    const gym = bk.org_id ? perGym.get(bk.org_id) : undefined
    const amt = bk.payment_amount_thb || 0
    const month = (bk.booking_date || "").slice(0, 7)
    totalBookings += 1
    if (gym) gym.bookings += 1
    if (month && !monthly.has(month)) monthly.set(month, { collectedThb: 0, bookings: 0 })
    if (month) monthly.get(month)!.bookings += 1

    if (bk.payment_status === "paid") {
      collectedThb += amt
      if (gym) gym.collectedThb += amt
      if (month) monthly.get(month)!.collectedThb += amt
    } else if (bk.payment_status === "pending") {
      outstandingThb += amt
    }
  }

  const subStatus: Record<string, number> = {}
  let activeGyms = 0
  for (const g of gymList) {
    if (g.status === "active") activeGyms += 1
    const sub = g.gym_subscriptions?.[0]?.status || "none"
    subStatus[sub] = (subStatus[sub] || 0) + 1
  }

  const byGym = [...perGym.values()].sort(
    (a, b) => b.collectedThb - a.collectedThb || b.bookings - a.bookings,
  )
  const months = [...monthly.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, v]) => ({ month, ...v }))

  return NextResponse.json({
    totals: { gyms: gymList.length, activeGyms, bookings: totalBookings, collectedThb, outstandingThb },
    subStatus,
    byGym,
    months,
  })
}
