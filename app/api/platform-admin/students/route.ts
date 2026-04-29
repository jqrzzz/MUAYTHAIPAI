import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

/**
 * Network-wide student list with aggregated stats: total signoffs,
 * certificates earned, gyms visited, last activity. Used as the
 * Students tab list view on /platform-admin.
 */
export async function GET(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("q")
  const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10), 500)
  const sort = searchParams.get("sort") || "recent" // recent | certs | signoffs | name

  let query = supabase
    .from("users")
    .select("id, email, full_name, display_name, avatar_url, created_at")
    .eq("is_platform_admin", false)
    .limit(limit)

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%,display_name.ilike.%${search}%`
    )
  }

  const { data: users, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userIds = (users || []).map((u) => u.id)
  if (userIds.length === 0) {
    return NextResponse.json({ students: [] })
  }

  // Bulk-pull aggregate data for all users at once
  const [signoffsRes, certsRes, enrollsRes] = await Promise.all([
    supabase
      .from("skill_signoffs")
      .select("student_id, org_id, level, signed_off_at")
      .in("student_id", userIds),
    supabase
      .from("certificates")
      .select("user_id, level, issued_at")
      .in("user_id", userIds),
    supabase
      .from("certification_enrollments")
      .select("user_id, org_id, level, status")
      .in("user_id", userIds),
  ])

  const signoffsByUser = new Map<
    string,
    { count: number; orgs: Set<string>; levels: Set<string>; lastAt: string | null }
  >()
  for (const s of signoffsRes.data || []) {
    const cur = signoffsByUser.get(s.student_id) || {
      count: 0,
      orgs: new Set<string>(),
      levels: new Set<string>(),
      lastAt: null,
    }
    cur.count += 1
    cur.orgs.add(s.org_id)
    cur.levels.add(s.level)
    if (!cur.lastAt || s.signed_off_at > cur.lastAt) cur.lastAt = s.signed_off_at
    signoffsByUser.set(s.student_id, cur)
  }

  const certsByUser = new Map<string, { count: number; levels: string[]; lastAt: string | null }>()
  for (const c of certsRes.data || []) {
    const cur = certsByUser.get(c.user_id) || { count: 0, levels: [], lastAt: null }
    cur.count += 1
    cur.levels.push(c.level)
    if (!cur.lastAt || c.issued_at > cur.lastAt) cur.lastAt = c.issued_at
    certsByUser.set(c.user_id, cur)
  }

  const enrollsByUser = new Map<string, { active: number; totalLevels: Set<string> }>()
  for (const e of enrollsRes.data || []) {
    const cur = enrollsByUser.get(e.user_id) || { active: 0, totalLevels: new Set<string>() }
    if (e.status === "active") cur.active += 1
    cur.totalLevels.add(e.level)
    enrollsByUser.set(e.user_id, cur)
  }

  const students = (users || []).map((u) => {
    const so = signoffsByUser.get(u.id)
    const ce = certsByUser.get(u.id)
    const en = enrollsByUser.get(u.id)
    return {
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      created_at: u.created_at,
      total_signoffs: so?.count ?? 0,
      gyms_visited: so?.orgs.size ?? 0,
      levels_active: so ? [...so.levels].sort() : [],
      total_certs: ce?.count ?? 0,
      cert_levels: ce?.levels ?? [],
      active_enrollments: en?.active ?? 0,
      last_signoff_at: so?.lastAt ?? null,
      last_cert_at: ce?.lastAt ?? null,
    }
  })

  students.sort((a, b) => {
    if (sort === "certs") return b.total_certs - a.total_certs
    if (sort === "signoffs") return b.total_signoffs - a.total_signoffs
    if (sort === "name")
      return (a.full_name || a.email).localeCompare(b.full_name || b.email)
    // recent
    const aLast = a.last_signoff_at || a.last_cert_at || a.created_at
    const bLast = b.last_signoff_at || b.last_cert_at || b.created_at
    return (bLast || "").localeCompare(aLast || "")
  })

  return NextResponse.json({ students })
}
