import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

/**
 * Trainer passport — every signoff this trainer has issued, every gym
 * they teach at, every student they've worked with, certs issued
 * (joined through trainer_profiles).
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
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 })
  }

  const [signoffsRes, membersRes, profileRes] = await Promise.all([
    supabase
      .from("skill_signoffs")
      .select(
        "id, student_id, org_id, level, skill_index, notes, signed_off_at, " +
          "organizations:org_id(name, slug, city), users:student_id(email, full_name, display_name)"
      )
      .eq("signed_off_by", id)
      .order("signed_off_at", { ascending: false })
      .limit(500),
    supabase
      .from("org_members")
      .select(
        "org_id, role, status, joined_at, organizations:org_id(name, slug, city)"
      )
      .eq("user_id", id),
    supabase.from("trainer_profiles").select("id").eq("user_id", id).maybeSingle(),
  ])

  const signoffs = signoffsRes.data || []
  const memberships = membersRes.data || []
  const trainerProfileId = profileRes.data?.id ?? null

  // Certificates issued by this trainer (via trainer_profiles)
  let certs: Array<{
    id: string
    org_id: string
    org_name: string | null
    user_id: string
    student_name: string | null
    level: string
    issued_at: string
    certificate_number: string | null
  }> = []
  if (trainerProfileId) {
    const { data: certRows } = await supabase
      .from("certificates")
      .select(
        "id, org_id, user_id, level, level_number, certificate_number, issued_at, status, " +
          "organizations:org_id(name), users:user_id(full_name, email)"
      )
      .eq("issued_by", trainerProfileId)
      .order("issued_at", { ascending: false })
      .limit(100)
    certs = (certRows || []).map((c) => ({
      id: c.id,
      org_id: c.org_id,
      org_name: (c.organizations as unknown as { name?: string })?.name || null,
      user_id: c.user_id,
      student_name:
        (c.users as unknown as { full_name?: string; email?: string })?.full_name ||
        (c.users as unknown as { email?: string })?.email ||
        null,
      level: c.level,
      issued_at: c.issued_at,
      certificate_number: c.certificate_number,
    }))
  }

  // Aggregate gyms (signoffs + memberships)
  const gymMap = new Map<
    string,
    {
      name: string
      slug: string
      city: string | null
      signoffs: number
      role?: string
      status?: string
    }
  >()
  for (const s of signoffs) {
    const o = s.organizations as unknown as {
      name?: string
      slug?: string
      city?: string | null
    }
    if (!o?.name) continue
    const cur = gymMap.get(s.org_id) || {
      name: o.name,
      slug: o.slug || "",
      city: o.city ?? null,
      signoffs: 0,
    }
    cur.signoffs += 1
    gymMap.set(s.org_id, cur)
  }
  for (const m of memberships) {
    const o = m.organizations as unknown as {
      name?: string
      slug?: string
      city?: string | null
    }
    if (!o?.name) continue
    const cur = gymMap.get(m.org_id) || {
      name: o.name,
      slug: o.slug || "",
      city: o.city ?? null,
      signoffs: 0,
    }
    cur.role = m.role
    cur.status = m.status
    gymMap.set(m.org_id, cur)
  }

  // Aggregate students touched
  const studentMap = new Map<
    string,
    { name: string | null; email: string | null; signoffs: number }
  >()
  for (const s of signoffs) {
    const u = s.users as unknown as { full_name?: string; display_name?: string; email?: string }
    const cur = studentMap.get(s.student_id) || {
      name: u?.full_name || u?.display_name || null,
      email: u?.email || null,
      signoffs: 0,
    }
    cur.signoffs += 1
    studentMap.set(s.student_id, cur)
  }

  // Per-level totals
  const byLevel: Record<string, { signoffs: number; students: Set<string>; gyms: Set<string> }> = {}
  for (const s of signoffs) {
    const cur = byLevel[s.level] || {
      signoffs: 0,
      students: new Set<string>(),
      gyms: new Set<string>(),
    }
    cur.signoffs += 1
    cur.students.add(s.student_id)
    cur.gyms.add(s.org_id)
    byLevel[s.level] = cur
  }

  return NextResponse.json({
    trainer: user,
    summary: {
      total_signoffs: signoffs.length,
      students_touched: studentMap.size,
      gyms_taught_at: [...gymMap.values()].filter((g) => g.signoffs > 0 || g.role).length,
      certs_issued: certs.length,
    },
    by_level: Object.entries(byLevel).map(([level, v]) => ({
      level,
      signoffs: v.signoffs,
      students: v.students.size,
      gyms: v.gyms.size,
    })),
    gyms: [...gymMap.entries()].map(([org_id, v]) => ({ org_id, ...v })),
    students: [...studentMap.entries()].map(([id, v]) => ({ id, ...v })),
    certs,
    recent_signoffs: signoffs.slice(0, 30).map((s) => ({
      id: s.id,
      student_id: s.student_id,
      student_name:
        (s.users as unknown as { full_name?: string; display_name?: string; email?: string })
          ?.full_name ||
        (s.users as unknown as { display_name?: string })?.display_name ||
        (s.users as unknown as { email?: string })?.email ||
        null,
      org_id: s.org_id,
      org_name: (s.organizations as unknown as { name?: string })?.name || null,
      level: s.level,
      skill_index: s.skill_index,
      notes: s.notes,
      signed_off_at: s.signed_off_at,
    })),
  })
}
