import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getLevelById } from "@/lib/certification-levels"
import { notifyCourseCompleted } from "@/lib/notifications"

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Bulk sign off the SAME skill for many students at once.
 * Body: { level, skill_index, student_ids: string[], notes? }
 *
 * Returns per-student result so the UI can show partial success.
 * Triggers the gym-wide "all skills complete" notification for any
 * student that crossed the threshold with this signoff.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()
  if (!membership || !["owner", "admin", "trainer"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { level, skill_index, student_ids, notes } = body as {
    level?: string
    skill_index?: number
    student_ids?: string[]
    notes?: string
  }

  if (!level || skill_index === undefined || !Array.isArray(student_ids)) {
    return NextResponse.json(
      { error: "level, skill_index, and student_ids[] are required" },
      { status: 400 }
    )
  }
  const ids = student_ids
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .slice(0, 100)
  if (ids.length === 0) {
    return NextResponse.json({ error: "student_ids must be non-empty" }, { status: 400 })
  }

  const levelConfig = getLevelById(level)
  if (!levelConfig || skill_index < 0 || skill_index >= levelConfig.skills.length) {
    return NextResponse.json({ error: "Invalid level or skill_index" }, { status: 400 })
  }

  // Existing signoffs across these students at this level — used to
  // detect "completion crossed" after the upsert.
  const { data: priorSignoffs } = await supabase
    .from("skill_signoffs")
    .select("student_id, skill_index")
    .eq("org_id", membership.org_id)
    .eq("level", level)
    .in("student_id", ids)

  const priorByStudent = new Map<string, Set<number>>()
  for (const r of priorSignoffs || []) {
    const set = priorByStudent.get(r.student_id) || new Set<number>()
    set.add(r.skill_index)
    priorByStudent.set(r.student_id, set)
  }

  const signedAt = new Date().toISOString()
  const rows = ids.map((sid) => ({
    org_id: membership.org_id,
    student_id: sid,
    level,
    skill_index,
    signed_off_by: user.id,
    notes: notes || null,
    signed_off_at: signedAt,
  }))

  const { data: upserted, error } = await supabase
    .from("skill_signoffs")
    .upsert(rows, { onConflict: "org_id,student_id,level,skill_index" })
    .select("student_id")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const succeededIds = new Set((upserted || []).map((r) => r.student_id))
  const totalSkills = levelConfig.skills.length
  const completedNow: string[] = []

  // For each student that succeeded: did this signoff bring them to all-complete?
  for (const sid of succeededIds) {
    const prior = priorByStudent.get(sid) || new Set<number>()
    prior.add(skill_index) // include the new one
    if (prior.size >= totalSkills) {
      completedNow.push(sid)
    }
  }

  // Fire completion notifications (best-effort, non-blocking on failure)
  if (completedNow.length > 0) {
    try {
      const { data: profiles } = await serviceClient
        .from("users")
        .select("id, full_name")
        .in("id", completedNow)
      const nameById = new Map<string, string>()
      for (const p of profiles || []) {
        nameById.set(p.id, p.full_name || "Student")
      }
      await Promise.all(
        completedNow.map((sid) =>
          notifyCourseCompleted({
            orgId: membership.org_id,
            studentId: sid,
            studentName: nameById.get(sid) || "Student",
            courseTitle: "Skill Assessment",
            courseId: "",
            certificateLevel: level,
            levelName: levelConfig.name,
          }).catch((err) => {
            console.warn("[skills/bulk] notify failed for", sid, err)
          })
        )
      )
    } catch {
      /* swallow — notifications are best-effort */
    }
  }

  return NextResponse.json({
    level,
    skill_index,
    skill_label: levelConfig.skills[skill_index],
    requested: ids.length,
    succeeded: succeededIds.size,
    completed_now: completedNow,
    skipped: ids.filter((id) => !succeededIds.has(id)),
  })
}
