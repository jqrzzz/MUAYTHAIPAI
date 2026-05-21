import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { bookingAmountThb } from "@/lib/payment-config"

// Revenue + bookings analytics for the gym dashboard, bucketed by calendar
// month so the Reports tab can offer a real month filter (the page-level
// analyticsBookings slice is only the last 30 days). All money is in THB —
// the operating currency for gyms on the platform.

interface MethodSlot {
  count: number
  thb: number
}

interface Bucket {
  bookings: number
  collectedThb: number // paid
  outstandingThb: number // pending
  online: MethodSlot // paid via stripe/card
  cash: MethodSlot // paid in cash
  transfer: MethodSlot // paid by bank transfer
  other: MethodSlot // paid, method unknown
  status: { paid: number; pending: number; refunded: number; failed: number }
}

function emptyBucket(): Bucket {
  return {
    bookings: 0,
    collectedThb: 0,
    outstandingThb: 0,
    online: { count: 0, thb: 0 },
    cash: { count: 0, thb: 0 },
    transfer: { count: 0, thb: 0 },
    other: { count: 0, thb: 0 },
    status: { paid: 0, pending: 0, refunded: 0, failed: 0 },
  }
}

interface Row {
  booking_date: string | null
  status: string | null
  payment_method: string | null
  payment_status: string | null
  payment_amount_thb: number | null
  payment_amount_usd: number | null
}

function addRow(b: Bucket, row: Row) {
  const amt = bookingAmountThb(row)
  b.bookings += 1
  switch (row.payment_status) {
    case "paid": {
      b.collectedThb += amt
      b.status.paid += 1
      const slot =
        row.payment_method === "cash"
          ? b.cash
          : row.payment_method === "stripe" || row.payment_method === "card"
            ? b.online
            : row.payment_method === "transfer"
              ? b.transfer
              : b.other
      slot.count += 1
      slot.thb += amt
      break
    }
    case "pending":
      b.outstandingThb += amt
      b.status.pending += 1
      break
    case "refunded":
      b.status.refunded += 1
      break
    case "failed":
      b.status.failed += 1
      break
  }
}

async function getMembership() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, membership: null }
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()
  return { supabase, membership }
}

export async function GET() {
  const { supabase, membership } = await getMembership()
  // Revenue is owner/manager-only — trainers don't see the gym's books.
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const { data: rows, error } = await supabase
    .from("bookings")
    .select("booking_date, status, payment_method, payment_status, payment_amount_thb, payment_amount_usd")
    .eq("org_id", membership.org_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const months = new Map<string, Bucket>()
  const allTime = emptyBucket()

  for (const row of (rows as Row[]) || []) {
    if (row.status === "cancelled") continue // cancelled bookings aren't revenue
    const key = (row.booking_date || "").slice(0, 7) // YYYY-MM
    if (!key) continue
    if (!months.has(key)) months.set(key, emptyBucket())
    addRow(months.get(key)!, row)
    addRow(allTime, row)
  }

  const monthsArr = [...months.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, bucket]) => ({ month, ...bucket }))

  return NextResponse.json({ months: monthsArr, allTime })
}
