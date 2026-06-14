/**
 * Network customers for the operator console.
 *
 * GET /api/platform-admin/customers
 *
 * Aggregates bookings into one row per customer (keyed by email). Most
 * customers are GUEST bookings that never created an account, so this is the
 * real picture of reach — distinct from the "Students" passport view (cert
 * progression) and from the users table (registered accounts only).
 *
 * Operator-gated; uses a service-role client to aggregate across every gym.
 */
import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { createServiceClient } from "@/lib/supabase/service"
import { bookingAmountThb } from "@/lib/payment-config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface BookingLite {
  guest_email: string | null
  guest_name: string | null
  org_id: string | null
  booking_date: string
  payment_status: string | null
  payment_amount_thb: number | null
  payment_amount_usd: number | null
}

export async function GET() {
  const { isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const db = createServiceClient()

  const [{ data: bookings }, { data: orgs }] = await Promise.all([
    db
      .from("bookings")
      .select(
        "guest_email, guest_name, org_id, booking_date, payment_status, payment_amount_thb, payment_amount_usd",
      )
      .not("guest_email", "is", null)
      .order("booking_date", { ascending: false })
      .limit(20000),
    db.from("organizations").select("id, name"),
  ])

  const orgName = new Map<string, string>(
    ((orgs ?? []) as { id: string; name: string }[]).map((o) => [o.id, o.name]),
  )

  interface Agg {
    email: string
    name: string
    bookings: number
    paid: number
    gymIds: Set<string>
    firstBooking: string
    lastBooking: string
    spentThb: number
  }

  const map = new Map<string, Agg>()
  // bookings arrive newest-first, so the first row seen for an email carries
  // that customer's most recent name.
  for (const b of (bookings ?? []) as BookingLite[]) {
    const email = (b.guest_email ?? "").toLowerCase().trim()
    if (!email) continue
    let c = map.get(email)
    if (!c) {
      c = {
        email,
        name: b.guest_name?.trim() || email,
        bookings: 0,
        paid: 0,
        gymIds: new Set<string>(),
        firstBooking: b.booking_date,
        lastBooking: b.booking_date,
        spentThb: 0,
      }
      map.set(email, c)
    }
    c.bookings++
    if (b.org_id) c.gymIds.add(b.org_id)
    if (b.booking_date < c.firstBooking) c.firstBooking = b.booking_date
    if (b.booking_date > c.lastBooking) c.lastBooking = b.booking_date
    if (b.payment_status === "paid") {
      c.paid++
      c.spentThb += bookingAmountThb(b)
    }
  }

  const customers = [...map.values()]
    .map((c) => ({
      email: c.email,
      name: c.name,
      bookings: c.bookings,
      paid: c.paid,
      gyms: [...c.gymIds].map((id) => orgName.get(id) || "Unknown gym"),
      firstBooking: c.firstBooking,
      lastBooking: c.lastBooking,
      spentThb: c.spentThb,
    }))
    .sort((a, b) => (a.lastBooking < b.lastBooking ? 1 : a.lastBooking > b.lastBooking ? -1 : 0))

  return NextResponse.json({ totalCustomers: customers.length, customers })
}
