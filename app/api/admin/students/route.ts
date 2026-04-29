import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

const TOTAL_BY_LEVEL: Record<string, number> = Object.fromEntries(
  CERTIFICATION_LEVELS.map((l) => [l.id, l.skills.length])
)

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's org
  const { data: membership } = await supabase.from("org_members").select("org_id, role").eq("user_id", user.id).single()

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 })
  }

  // Get all students who have bookings or credits at this gym
  const { data: students, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      display_name,
      phone,
      created_at
    `)
    .in("id", supabase.from("bookings").select("user_id").eq("org_id", membership.org_id).not("user_id", "is", null))
    .order("full_name")

  // Also get students with credits
  const { data: creditStudents } = await supabase
    .from("student_credits")
    .select(`
      user_id,
      users (
        id,
        email,
        full_name,
        display_name,
        phone,
        created_at
      )
    `)
    .eq("org_id", membership.org_id)

  // Get credits for all students
  const { data: allCredits } = await supabase.from("student_credits").select("*").eq("org_id", membership.org_id)

  // Get recent transactions
  const { data: recentTransactions } = await supabase
    .from("credit_transactions")
    .select(`
      *,
      users:user_id (full_name, display_name)
    `)
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false })
    .limit(50)

  // Merge students lists and add credits
  const studentMap = new Map()

  students?.forEach((s) => studentMap.set(s.id, { ...s, credits: null }))
  creditStudents?.forEach((cs) => {
    if (cs.users && !studentMap.has(cs.users.id)) {
      studentMap.set(cs.users.id, { ...cs.users, credits: null })
    }
  })

  // Add credits to students
  allCredits?.forEach((credit) => {
    const student = studentMap.get(credit.user_id)
    if (student) {
      student.credits = credit
    }
  })

  // ---- Cert ladder context, gym-scoped ----
  const studentIds = [...studentMap.keys()]
  if (studentIds.length > 0) {
    const [signoffsRes, enrollmentsRes, certsRes] = await Promise.all([
      supabase
        .from("skill_signoffs")
        .select("student_id, level, skill_index, signed_off_at")
        .eq("org_id", membership.org_id)
        .in("student_id", studentIds),
      supabase
        .from("certification_enrollments")
        .select("user_id, level, status, enrolled_at")
        .eq("org_id", membership.org_id)
        .in("user_id", studentIds),
      supabase
        .from("certificates")
        .select("user_id, level, certificate_number, issued_at")
        .eq("org_id", membership.org_id)
        .eq("status", "active")
        .in("user_id", studentIds),
    ])

    // Build per-student cert progress
    const distinctSkills = new Map<string, Set<number>>()
    const lastSignoffByKey = new Map<string, string>()
    for (const s of signoffsRes.data || []) {
      const key = `${s.student_id}:${s.level}`
      const set = distinctSkills.get(key) || new Set<number>()
      set.add(s.skill_index)
      distinctSkills.set(key, set)
      const prev = lastSignoffByKey.get(key)
      if (!prev || s.signed_off_at > prev) lastSignoffByKey.set(key, s.signed_off_at)
    }
    const earnedByUser = new Map<string, Set<string>>()
    for (const c of certsRes.data || []) {
      const set = earnedByUser.get(c.user_id) || new Set<string>()
      set.add(c.level)
      earnedByUser.set(c.user_id, set)
    }
    const activeEnrollByUser = new Map<string, Set<string>>()
    for (const e of enrollmentsRes.data || []) {
      if (e.status !== "active") continue
      const set = activeEnrollByUser.get(e.user_id) || new Set<string>()
      set.add(e.level)
      activeEnrollByUser.set(e.user_id, set)
    }

    // Attach cert_progress to each student
    for (const student of studentMap.values()) {
      const earned = earnedByUser.get(student.id) || new Set<string>()
      const enrolled = activeEnrollByUser.get(student.id) || new Set<string>()
      const levels: Array<{
        level: string
        signed_off: number
        total: number
        earned: boolean
        enrolled: boolean
        last_signoff_at: string | null
      }> = []
      for (const lvl of CERTIFICATION_LEVELS) {
        const key = `${student.id}:${lvl.id}`
        const signedOff = distinctSkills.get(key)?.size ?? 0
        if (
          signedOff === 0 &&
          !earned.has(lvl.id) &&
          !enrolled.has(lvl.id)
        ) {
          continue // skip levels with no relationship to this student
        }
        levels.push({
          level: lvl.id,
          signed_off: signedOff,
          total: TOTAL_BY_LEVEL[lvl.id] ?? 0,
          earned: earned.has(lvl.id),
          enrolled: enrolled.has(lvl.id),
          last_signoff_at: lastSignoffByKey.get(key) || null,
        })
      }
      // Pick the "current" level: highest active enrollment, else highest with signoffs but unearned
      const current =
        levels.find((l) => l.enrolled && !l.earned) ||
        [...levels].reverse().find((l) => l.signed_off > 0 && !l.earned) ||
        null
      student.cert_progress = {
        levels,
        earned_count: earned.size,
        current,
      }
    }
  }

  return NextResponse.json({
    students: Array.from(studentMap.values()),
    transactions: recentTransactions || [],
    orgId: membership.org_id,
  })
}
