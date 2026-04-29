import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

const DAY = 86400_000

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

/**
 * Gym-scoped reports — cert pipeline, student growth, services
 * breakdown, and a 30-day booking sparkline. Complements the existing
 * revenue cards on the Reports tab (which run off of analyticsBookings
 * passed by the parent page).
 */
export async function GET() {
  const { supabase, membership } = await getMembership()
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orgId = membership.org_id
  const now = Date.now()
  const ago = (d: number) => new Date(now - d * DAY).toISOString()

  const [
    enrollsRes,
    certsRes,
    bookings90Res,
    studentsRes,
    servicesMonthRes,
    signoffsRes,
  ] = await Promise.all([
    supabase
      .from("certification_enrollments")
      .select("level, status, enrolled_at")
      .eq("org_id", orgId)
      .eq("status", "active"),
    supabase
      .from("certificates")
      .select("level, issued_at")
      .eq("org_id", orgId)
      .eq("status", "active"),
    // Bookings for daily sparkline (30 days) and growth trend (90 days)
    supabase
      .from("bookings")
      .select("user_id, booking_date, payment_status, payment_amount_thb, services:service_id(name)")
      .eq("org_id", orgId)
      .gte("booking_date", ago(90).slice(0, 10))
      .order("booking_date", { ascending: false }),
    // All students who've ever booked at this gym (for growth + active)
    supabase
      .from("bookings")
      .select("user_id, booking_date")
      .eq("org_id", orgId)
      .not("user_id", "is", null),
    supabase
      .from("services")
      .select("id, name, category, is_active")
      .eq("org_id", orgId),
    supabase
      .from("skill_signoffs")
      .select("signed_off_by, signed_off_at")
      .eq("org_id", orgId)
      .gte("signed_off_at", ago(30)),
  ])

  // ---- Cert pipeline ----
  const enrolledByLevel: Record<string, number> = {}
  for (const e of enrollsRes.data || []) {
    enrolledByLevel[e.level] = (enrolledByLevel[e.level] ?? 0) + 1
  }
  const issuedByLevel30d: Record<string, number> = {}
  const issuedByLevelAllTime: Record<string, number> = {}
  const cutoff30 = ago(30)
  for (const c of certsRes.data || []) {
    issuedByLevelAllTime[c.level] = (issuedByLevelAllTime[c.level] ?? 0) + 1
    if (c.issued_at >= cutoff30) {
      issuedByLevel30d[c.level] = (issuedByLevel30d[c.level] ?? 0) + 1
    }
  }
  const certPipeline = CERTIFICATION_LEVELS.map((lvl) => ({
    id: lvl.id,
    name: lvl.name,
    icon: lvl.icon,
    enrolled: enrolledByLevel[lvl.id] ?? 0,
    issued_30d: issuedByLevel30d[lvl.id] ?? 0,
    issued_all_time: issuedByLevelAllTime[lvl.id] ?? 0,
  }))

  // ---- Student growth ----
  const allBookings = studentsRes.data || []
  const seen = new Map<string, string>() // user_id -> first booking date
  for (const b of allBookings) {
    if (!b.user_id) continue
    const cur = seen.get(b.user_id)
    if (!cur || b.booking_date < cur) seen.set(b.user_id, b.booking_date)
  }
  const newThisMonthCutoff = ago(30).slice(0, 10)
  let totalStudents = seen.size
  let newThisMonth = 0
  for (const firstDate of seen.values()) {
    if (firstDate >= newThisMonthCutoff) newThisMonth++
  }
  // Active = has a booking in the last 30 days
  const activeIds = new Set<string>()
  for (const b of allBookings) {
    if (!b.user_id) continue
    if (b.booking_date >= newThisMonthCutoff) activeIds.add(b.user_id)
  }
  const activeStudents = activeIds.size

  // Returning = in the active set AND first-seen before the 30d cutoff
  let returning = 0
  for (const id of activeIds) {
    const first = seen.get(id)
    if (first && first < newThisMonthCutoff) returning++
  }

  // ---- Top services (by paid revenue this month) ----
  const bookingsLast90 = bookings90Res.data || []
  const month = newThisMonthCutoff
  type SvcAgg = { name: string; bookings: number; revenue: number }
  const svcMap = new Map<string, SvcAgg>()
  for (const b of bookingsLast90) {
    if (b.booking_date < month) continue
    if (b.payment_status !== "paid") continue
    const name =
      ((b.services as unknown as { name?: string }) || {}).name || "(unnamed)"
    const cur = svcMap.get(name) || { name, bookings: 0, revenue: 0 }
    cur.bookings += 1
    cur.revenue += b.payment_amount_thb || 0
    svcMap.set(name, cur)
  }
  const topServices = [...svcMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // ---- Daily booking sparkline (last 30 days) ----
  const sparkline: { date: string; bookings: number; paid: number }[] = []
  const buckets = new Map<string, { bookings: number; paid: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * DAY).toISOString().slice(0, 10)
    buckets.set(d, { bookings: 0, paid: 0 })
  }
  for (const b of bookingsLast90) {
    const cur = buckets.get(b.booking_date)
    if (!cur) continue
    cur.bookings += 1
    if (b.payment_status === "paid") cur.paid += 1
  }
  for (const [date, v] of buckets.entries()) {
    sparkline.push({ date, ...v })
  }

  // ---- Trainer signoff productivity (last 30d) ----
  const signoffsByTrainer = new Map<string, number>()
  for (const s of signoffsRes.data || []) {
    signoffsByTrainer.set(
      s.signed_off_by,
      (signoffsByTrainer.get(s.signed_off_by) || 0) + 1
    )
  }
  const trainerIds = [...signoffsByTrainer.keys()]
  let topTrainers: Array<{ id: string; name: string; signoffs: number }> = []
  if (trainerIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", trainerIds)
    topTrainers = (users || [])
      .map((u) => ({
        id: u.id,
        name: u.full_name || u.email || "—",
        signoffs: signoffsByTrainer.get(u.id) ?? 0,
      }))
      .sort((a, b) => b.signoffs - a.signoffs)
      .slice(0, 5)
  }

  return NextResponse.json({
    cert_pipeline: certPipeline,
    students: {
      total: totalStudents,
      active_30d: activeStudents,
      new_30d: newThisMonth,
      returning_30d: returning,
    },
    top_services: topServices,
    sparkline_30d: sparkline,
    top_trainers_30d: topTrainers,
    services_count: (servicesMonthRes.data || []).filter((s) => s.is_active).length,
  })
}
