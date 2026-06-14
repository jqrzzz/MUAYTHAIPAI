/**
 * Member retention snapshot — who's at risk of churning.
 *
 * GET /api/admin/retention
 *
 * For every active student of this gym, computes:
 *   - last_booking_date (or null if never booked)
 *   - days_since_last_booking
 *   - risk bucket: active / cooling / lapsed / dormant / never_booked
 *
 * Plus a side list of students whose packages expire in the next 14
 * days (renewal opportunity).
 *
 * No AI yet — keep the data deterministic. AI-suggested nudges can be
 * layered on later.
 */
import { NextResponse } from "next/server"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Member {
  user_id: string
  joined_at: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any
}

interface Booking {
  user_id: string | null
  booking_date: string
  status: string
}

interface PackageRow {
  user_id: string
  end_date: string | null
  package_name: string | null
}

type RiskBucket =
  | "active"
  | "cooling"
  | "lapsed"
  | "dormant"
  | "never_booked"

export async function GET() {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 86400_000)
    .toISOString()
    .slice(0, 10)

  // Fetch active student memberships + their booking history in parallel
  const [membersRes, bookingsRes, packagesRes] = await Promise.all([
    supabase
      .from("org_members")
      .select(`
        user_id, joined_at,
        users:user_id (id, full_name, email)
      `)
      .eq("org_id", orgId)
      .eq("role", "student")
      .eq("status", "active")
      .order("joined_at", { ascending: false })
      .limit(500),
    // Pull last 365 days of bookings to compute last-seen.
    // status='confirmed' OR 'completed' counts as engagement.
    supabase
      .from("bookings")
      .select("user_id, booking_date, status")
      .eq("org_id", orgId)
      .in("status", ["confirmed", "completed"])
      .gte("booking_date", new Date(now.getTime() - 365 * 86400_000).toISOString().slice(0, 10))
      .not("user_id", "is", null),
    // Active student packages expiring soon (renewal opportunity)
    // (The real model: selling a package creates a student_credits row with
    // package_id set — see scripts/032. A separate student_packages table
    // never existed; the previous query 400'd and this slice was empty.)
    supabase
      .from("student_credits")
      .select(`
        user_id, expires_at,
        package:package_id (name)
      `)
      .eq("org_id", orgId)
      .eq("is_active", true)
      .not("package_id", "is", null)
      .gte("expires_at", todayStr)
      .lte("expires_at", fourteenDaysFromNow)
      .order("expires_at"),
  ])

  const members = (membersRes.data ?? []) as Member[]
  const bookings = (bookingsRes.data ?? []) as Booking[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const packages = ((packagesRes.data ?? []) as any[]).map((p) => ({
    user_id: p.user_id,
    end_date: p.expires_at,
    package_name: Array.isArray(p.package) ? p.package[0]?.name : p.package?.name,
  })) as PackageRow[]

  // Index bookings by user → latest date + total count
  const stats = new Map<string, { last: string; count: number }>()
  for (const b of bookings) {
    if (!b.user_id) continue
    const cur = stats.get(b.user_id)
    if (!cur) {
      stats.set(b.user_id, { last: b.booking_date, count: 1 })
    } else {
      cur.count++
      if (b.booking_date > cur.last) cur.last = b.booking_date
    }
  }

  function bucketFor(daysSince: number | null): RiskBucket {
    if (daysSince == null) return "never_booked"
    if (daysSince <= 14) return "active"
    if (daysSince <= 30) return "cooling"
    if (daysSince <= 60) return "lapsed"
    return "dormant"
  }

  const perMember = members.map((m) => {
    const u = Array.isArray(m.users) ? m.users[0] : m.users
    const s = stats.get(m.user_id)
    const lastBookingDate = s?.last ?? null
    const daysSince = lastBookingDate
      ? Math.floor(
          (now.getTime() - new Date(lastBookingDate).getTime()) / 86400_000,
        )
      : null
    const joinedDays = Math.floor(
      (now.getTime() - new Date(m.joined_at).getTime()) / 86400_000,
    )
    return {
      user_id: m.user_id,
      name: u?.full_name ?? null,
      email: u?.email ?? null,
      total_bookings: s?.count ?? 0,
      last_booking_date: lastBookingDate,
      days_since_last_booking: daysSince,
      days_since_joined: joinedDays,
      bucket: bucketFor(daysSince),
    }
  })

  // Hide "never booked but joined < 7 days ago" — they haven't had a
  // chance to book yet, no signal
  const filtered = perMember.filter(
    (m) => !(m.bucket === "never_booked" && m.days_since_joined < 7),
  )

  const counts = {
    active: 0,
    cooling: 0,
    lapsed: 0,
    dormant: 0,
    never_booked: 0,
    total: filtered.length,
  }
  for (const m of filtered) counts[m.bucket]++

  // Sort: dormant first (highest churn risk), then lapsed, cooling,
  // never_booked, active (no urgency). Within bucket, oldest last-seen first.
  const bucketOrder: Record<RiskBucket, number> = {
    dormant: 0,
    lapsed: 1,
    cooling: 2,
    never_booked: 3,
    active: 4,
  }
  filtered.sort((a, b) => {
    const bo = bucketOrder[a.bucket] - bucketOrder[b.bucket]
    if (bo !== 0) return bo
    if (a.days_since_last_booking == null) return 1
    if (b.days_since_last_booking == null) return -1
    return b.days_since_last_booking - a.days_since_last_booking
  })

  // Packages expiring soon — join with member info if we have it
  const memberByUser = new Map(filtered.map((m) => [m.user_id, m]))
  const expiringPackages = packages
    .map((p) => {
      const m = memberByUser.get(p.user_id)
      const daysUntilExpire = p.end_date
        ? Math.ceil(
            (new Date(p.end_date).getTime() - now.getTime()) / 86400_000,
          )
        : null
      return {
        user_id: p.user_id,
        name: m?.name ?? null,
        email: m?.email ?? null,
        package_name: p.package_name,
        end_date: p.end_date,
        days_until_expire: daysUntilExpire,
      }
    })
    .filter((p) => p.days_until_expire != null)

  return NextResponse.json({
    counts,
    members: filtered,
    expiring_packages: expiringPackages,
  })
}
