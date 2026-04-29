import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

/**
 * Full student passport — every signoff, every cert, every enrollment,
 * every gym they've trained at across the network.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, email, full_name, display_name, avatar_url, phone, created_at")
    .eq("id", id)
    .single()
  if (!user) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 })
  }

  const [signoffsRes, certsRes, enrollsRes, membersRes] = await Promise.all([
    supabase
      .from("skill_signoffs")
      .select(
        "id, org_id, level, skill_index, notes, signed_off_at, " +
          "signed_off_by, organizations:org_id(name, slug, city)"
      )
      .eq("student_id", id)
      .order("signed_off_at", { ascending: false }),
    supabase
      .from("certificates")
      .select(
        "id, org_id, level, level_number, certificate_number, issued_at, status, " +
          "organizations:org_id(name, slug, city)"
      )
      .eq("user_id", id)
      .order("issued_at", { ascending: false }),
    supabase
      .from("certification_enrollments")
      .select(
        "id, org_id, level, status, enrolled_at, completed_at, " +
          "organizations:org_id(name, slug, city)"
      )
      .eq("user_id", id)
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("org_members")
      .select(
        "id, org_id, role, status, joined_at, organizations:org_id(name, slug, city)"
      )
      .eq("user_id", id),
  ])

  const signoffs = signoffsRes.data || []
  const certs = certsRes.data || []
  const enrolls = enrollsRes.data || []
  const memberships = membersRes.data || []

  // Cert ladder progress: for every level, signoffs done / total skills
  const ladder = CERTIFICATION_LEVELS.map((lvl) => {
    const lvlSignoffs = signoffs.filter((s) => s.level === lvl.id)
    const earned = certs.find((c) => c.level === lvl.id)
    const enrolledRow = enrolls.find((e) => e.level === lvl.id && e.status === "active")
    return {
      id: lvl.id,
      name: lvl.name,
      number: lvl.number,
      icon: lvl.icon,
      total_skills: lvl.skills.length,
      signed_off: new Set(lvlSignoffs.map((s) => `${s.org_id}:${s.skill_index}`)).size,
      gyms_with_signoffs: new Set(lvlSignoffs.map((s) => s.org_id)).size,
      earned: earned
        ? {
            id: earned.id,
            certificate_number: earned.certificate_number,
            issued_at: earned.issued_at,
            org: (earned.organizations as unknown as { name?: string }) || null,
          }
        : null,
      enrolled: !!enrolledRow,
      enrolled_at: enrolledRow?.enrolled_at ?? null,
      enrolled_at_org:
        (enrolledRow?.organizations as unknown as { name?: string })?.name || null,
    }
  })

  // Distinct gyms visited (any signoff org + any active membership org)
  const gymMap = new Map<
    string,
    { name: string; slug: string; city: string | null; signoffs: number; role?: string }
  >()
  for (const s of signoffs) {
    const orgId = s.org_id
    const o = s.organizations as unknown as { name?: string; slug?: string; city?: string | null }
    if (!o?.name) continue
    const cur = gymMap.get(orgId) || {
      name: o.name,
      slug: o.slug || "",
      city: o.city ?? null,
      signoffs: 0,
    }
    cur.signoffs += 1
    gymMap.set(orgId, cur)
  }
  for (const m of memberships) {
    const orgId = m.org_id
    const o = m.organizations as unknown as { name?: string; slug?: string; city?: string | null }
    if (!o?.name) continue
    const cur = gymMap.get(orgId) || {
      name: o.name,
      slug: o.slug || "",
      city: o.city ?? null,
      signoffs: 0,
    }
    cur.role = m.role
    gymMap.set(orgId, cur)
  }
  const gyms = [...gymMap.entries()].map(([org_id, v]) => ({ org_id, ...v }))

  return NextResponse.json({
    student: user,
    ladder,
    gyms,
    signoffs: signoffs.map((s) => ({
      id: s.id,
      org_id: s.org_id,
      org_name: (s.organizations as unknown as { name?: string })?.name || null,
      level: s.level,
      skill_index: s.skill_index,
      notes: s.notes,
      signed_off_at: s.signed_off_at,
    })),
    certs: certs.map((c) => ({
      id: c.id,
      org_id: c.org_id,
      org_name: (c.organizations as unknown as { name?: string })?.name || null,
      level: c.level,
      level_number: c.level_number,
      certificate_number: c.certificate_number,
      issued_at: c.issued_at,
      status: c.status,
    })),
    enrollments: enrolls.map((e) => ({
      id: e.id,
      org_id: e.org_id,
      org_name: (e.organizations as unknown as { name?: string })?.name || null,
      level: e.level,
      status: e.status,
      enrolled_at: e.enrolled_at,
      completed_at: e.completed_at,
    })),
  })
}
