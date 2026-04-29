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

const TOTAL_SKILLS_BY_LEVEL: Record<string, number> = Object.fromEntries(
  CERTIFICATION_LEVELS.map((l) => [l.id, l.skills.length])
)

/**
 * Gym-scoped daily signal — cert-focused. Surfaces:
 *  - Students whose signoffs are complete and a cert hasn't been issued
 *    yet (ready for assessment).
 *  - Stuck enrollments (active, no new signoffs in 14d).
 *  - Recent signoffs at this gym (last 7d).
 *  - Recent certs issued by this gym (last 30d).
 */
export async function GET() {
  const { supabase, membership } = await getMembership()
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orgId = membership.org_id
  const now = Date.now()
  const ago = (d: number) => new Date(now - d * DAY).toISOString()

  const [enrollsRes, signoffsRes, certsRes, recentSignoffsRes, recentCertsRes] =
    await Promise.all([
      supabase
        .from("certification_enrollments")
        .select("id, user_id, level, status, enrolled_at, users:user_id(full_name, email)")
        .eq("org_id", orgId)
        .eq("status", "active"),
      supabase
        .from("skill_signoffs")
        .select("student_id, level, skill_index, signed_off_at")
        .eq("org_id", orgId),
      supabase
        .from("certificates")
        .select("user_id, level")
        .eq("org_id", orgId)
        .eq("status", "active"),
      supabase
        .from("skill_signoffs")
        .select(
          "id, student_id, level, skill_index, signed_off_at, " +
            "users:student_id(full_name, email)"
        )
        .eq("org_id", orgId)
        .gte("signed_off_at", ago(7))
        .order("signed_off_at", { ascending: false })
        .limit(10),
      supabase
        .from("certificates")
        .select(
          "id, level, certificate_number, issued_at, " +
            "users:user_id(full_name, email)"
        )
        .eq("org_id", orgId)
        .gte("issued_at", ago(30))
        .order("issued_at", { ascending: false })
        .limit(10),
    ])

  const enrolls = enrollsRes.data || []
  const allSignoffs = signoffsRes.data || []
  const issuedCerts = certsRes.data || []

  // Per-student-level signoffs — distinct skills only
  const signoffsByKey = new Map<string, { count: number; lastAt: string }>()
  for (const s of allSignoffs) {
    const key = `${s.student_id}:${s.level}`
    const cur = signoffsByKey.get(key) || { count: 0, lastAt: "" }
    cur.count = Math.max(cur.count, 0) + 0 // accumulate distinct via separate set
    if (s.signed_off_at > cur.lastAt) cur.lastAt = s.signed_off_at
    signoffsByKey.set(key, cur)
  }
  // Distinct-skill counts
  const distinctSkills = new Map<string, Set<number>>()
  for (const s of allSignoffs) {
    const key = `${s.student_id}:${s.level}`
    const set = distinctSkills.get(key) || new Set<number>()
    set.add(s.skill_index)
    distinctSkills.set(key, set)
  }
  const certKeys = new Set(issuedCerts.map((c) => `${c.user_id}:${c.level}`))

  const certEligible: Array<{
    enrollment_id: string
    user_id: string
    name: string | null
    email: string
    level: string
    signed_off: number
    total: number
  }> = []
  const stuck: Array<{
    enrollment_id: string
    user_id: string
    name: string | null
    email: string
    level: string
    signed_off: number
    total: number
    last_signoff_at: string | null
    days_inactive: number
  }> = []

  for (const e of enrolls) {
    const u = e.users as unknown as { full_name?: string; email?: string }
    const key = `${e.user_id}:${e.level}`
    const signedOff = distinctSkills.get(key)?.size ?? 0
    const total = TOTAL_SKILLS_BY_LEVEL[e.level] ?? 0
    const lastAt = signoffsByKey.get(key)?.lastAt || null
    const enrolledAt = e.enrolled_at as string

    if (signedOff >= total && total > 0 && !certKeys.has(key)) {
      certEligible.push({
        enrollment_id: e.id,
        user_id: e.user_id,
        name: u?.full_name || null,
        email: u?.email || "",
        level: e.level,
        signed_off: signedOff,
        total,
      })
    } else {
      const lastTs = lastAt ? new Date(lastAt).getTime() : new Date(enrolledAt).getTime()
      const daysInactive = Math.floor((now - lastTs) / DAY)
      if (daysInactive >= 14 && signedOff < total) {
        stuck.push({
          enrollment_id: e.id,
          user_id: e.user_id,
          name: u?.full_name || null,
          email: u?.email || "",
          level: e.level,
          signed_off: signedOff,
          total,
          last_signoff_at: lastAt,
          days_inactive: daysInactive,
        })
      }
    }
  }

  return NextResponse.json({
    cert_eligible: certEligible,
    stuck: stuck.slice(0, 15),
    active_enrollments: enrolls.length,
    recent_signoffs: (recentSignoffsRes.data || []).map((s) => {
      const u = s.users as unknown as { full_name?: string; email?: string }
      return {
        id: s.id,
        student: u?.full_name || u?.email || "—",
        level: s.level,
        skill_index: s.skill_index,
        signed_off_at: s.signed_off_at,
      }
    }),
    recent_certs: (recentCertsRes.data || []).map((c) => {
      const u = c.users as unknown as { full_name?: string; email?: string }
      return {
        id: c.id,
        student: u?.full_name || u?.email || "—",
        level: c.level,
        certificate_number: c.certificate_number,
        issued_at: c.issued_at,
      }
    }),
  })
}
