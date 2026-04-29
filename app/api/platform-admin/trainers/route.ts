import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

/**
 * Network-wide trainer list. A "trainer" is defined behaviourally —
 * any user who has issued ≥1 skill signoff. Aggregates counts of
 * signoffs, gyms taught at, students touched, plus last activity.
 */
export async function GET(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("q")
  const sort = searchParams.get("sort") || "recent"

  // 1) Pull all signoffs (capped) — small enough for v1, can paginate later
  const { data: signoffs, error } = await supabase
    .from("skill_signoffs")
    .select("signed_off_by, student_id, org_id, level, signed_off_at")
    .order("signed_off_at", { ascending: false })
    .limit(20000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type Agg = {
    count: number
    students: Set<string>
    orgs: Set<string>
    levels: Set<string>
    lastAt: string | null
  }
  const byTrainer = new Map<string, Agg>()
  for (const s of signoffs || []) {
    const cur = byTrainer.get(s.signed_off_by) || {
      count: 0,
      students: new Set<string>(),
      orgs: new Set<string>(),
      levels: new Set<string>(),
      lastAt: null,
    }
    cur.count += 1
    cur.students.add(s.student_id)
    cur.orgs.add(s.org_id)
    cur.levels.add(s.level)
    if (!cur.lastAt || s.signed_off_at > cur.lastAt) cur.lastAt = s.signed_off_at
    byTrainer.set(s.signed_off_by, cur)
  }

  const trainerIds = [...byTrainer.keys()]
  if (trainerIds.length === 0) {
    return NextResponse.json({ trainers: [] })
  }

  let userQuery = supabase
    .from("users")
    .select("id, email, full_name, display_name, avatar_url")
    .in("id", trainerIds)
  if (search) {
    userQuery = userQuery.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%,display_name.ilike.%${search}%`
    )
  }
  const { data: users } = await userQuery

  const trainers = (users || []).map((u) => {
    const a = byTrainer.get(u.id)!
    return {
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      total_signoffs: a.count,
      students_touched: a.students.size,
      gyms_taught_at: a.orgs.size,
      levels: [...a.levels].sort(),
      last_signoff_at: a.lastAt,
    }
  })

  trainers.sort((a, b) => {
    if (sort === "students") return b.students_touched - a.students_touched
    if (sort === "gyms") return b.gyms_taught_at - a.gyms_taught_at
    if (sort === "name")
      return (a.full_name || a.email).localeCompare(b.full_name || b.email)
    if (sort === "signoffs") return b.total_signoffs - a.total_signoffs
    // recent
    return (b.last_signoff_at || "").localeCompare(a.last_signoff_at || "")
  })

  return NextResponse.json({ trainers })
}
