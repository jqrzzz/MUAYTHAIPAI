import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

const TOTAL_BY_LEVEL: Record<string, number> = Object.fromEntries(
  CERTIFICATION_LEVELS.map((l) => [l.id, l.skills.length])
)
const SKILLS_BY_LEVEL: Record<string, string[]> = Object.fromEntries(
  CERTIFICATION_LEVELS.map((l) => [l.id, l.skills])
)

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
 * Gym-scoped passport for one student. Cert ladder progress at THIS
 * gym (signoffs, certs issued here, enrollments here) plus optional
 * cross-network attribution (other gyms' signoff counts).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { supabase, membership } = await getMembership()
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const orgId = membership.org_id

  const { data: student } = await supabase
    .from("users")
    .select("id, email, full_name, display_name, avatar_url, phone, created_at")
    .eq("id", id)
    .single()
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 })
  }

  const [signoffsHereRes, signoffsAnywhereRes, certsHereRes, enrollsHereRes] =
    await Promise.all([
      supabase
        .from("skill_signoffs")
        .select(
          "id, level, skill_index, notes, signed_off_at, signed_off_by, " +
            "users:signed_off_by(full_name, email)"
        )
        .eq("org_id", orgId)
        .eq("student_id", id)
        .order("signed_off_at", { ascending: false }),
      supabase
        .from("skill_signoffs")
        .select("level, skill_index, org_id")
        .eq("student_id", id),
      supabase
        .from("certificates")
        .select("id, level, certificate_number, issued_at, status")
        .eq("org_id", orgId)
        .eq("user_id", id)
        .order("issued_at", { ascending: false }),
      supabase
        .from("certification_enrollments")
        .select("id, level, status, enrolled_at, completed_at, payment_status")
        .eq("org_id", orgId)
        .eq("user_id", id)
        .order("enrolled_at", { ascending: false }),
    ])

  const signoffsHere = signoffsHereRes.data || []
  const signoffsAnywhere = signoffsAnywhereRes.data || []
  const certsHere = certsHereRes.data || []
  const enrollsHere = enrollsHereRes.data || []

  // Per-level: skills signed off HERE, skills signed off ANYWHERE
  const ladder = CERTIFICATION_LEVELS.map((lvl) => {
    const here = new Set(
      signoffsHere
        .filter((s) => s.level === lvl.id)
        .map((s) => s.skill_index)
    )
    const anywhere = new Set(
      signoffsAnywhere
        .filter((s) => s.level === lvl.id)
        .map((s) => s.skill_index)
    )
    const earnedHere = certsHere.find(
      (c) => c.level === lvl.id && c.status === "active"
    )
    const enrolled = enrollsHere.find(
      (e) => e.level === lvl.id && e.status === "active"
    )
    return {
      id: lvl.id,
      name: lvl.name,
      number: lvl.number,
      icon: lvl.icon,
      skills: lvl.skills.map((label, idx) => ({
        index: idx,
        label,
        signed_off_here: here.has(idx),
        signed_off_anywhere: anywhere.has(idx),
      })),
      total_skills: lvl.skills.length,
      signed_off_here: here.size,
      signed_off_anywhere: anywhere.size,
      earned_here: !!earnedHere,
      certificate_number: earnedHere?.certificate_number ?? null,
      issued_at: earnedHere?.issued_at ?? null,
      enrolled_here: !!enrolled,
      enrolled_at: enrolled?.enrolled_at ?? null,
    }
  })

  return NextResponse.json({
    student,
    ladder,
    enrollments: enrollsHere,
    certs: certsHere,
    recent_signoffs: signoffsHere.slice(0, 30).map((s) => ({
      id: s.id,
      level: s.level,
      skill_index: s.skill_index,
      skill_label: SKILLS_BY_LEVEL[s.level]?.[s.skill_index] || `#${s.skill_index + 1}`,
      notes: s.notes,
      signed_off_at: s.signed_off_at,
      signed_off_by:
        (s.users as unknown as { full_name?: string; email?: string })?.full_name ||
        (s.users as unknown as { email?: string })?.email ||
        null,
    })),
    cross_network: {
      total_signoffs_anywhere: signoffsAnywhere.length,
      gyms_visited: new Set(signoffsAnywhere.map((s) => s.org_id)).size,
    },
  })
}
