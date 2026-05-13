import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getLevelById } from "@/lib/certification-levels"
import { notifyCourseCompleted } from "@/lib/notifications"
import { getOrgMember } from "@/lib/auth-helpers"
import { logAudit } from "@/lib/audit-log"

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BulkSignoffSchema = z.object({
  level: z.string().min(1),
  skill_index: z.number().int().min(0),
  student_ids: z.array(z.string().uuid()).min(1).max(100),
  notes: z.string().optional(),
})

/**
 * Bulk sign off the SAME skill for many students at once.
 * Body: { level, skill_index, student_ids: string[], notes? }
 *
 * Returns per-student result so the UI can show partial success.
 * Triggers the gym-wide "all skills complete" notification for any
 * student that crossed the threshold with this signoff.
 */
export async function POST(request: Request) {
  const { supabase, user, membership } = await getOrgMember()
  if (!user || !membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const actorEmail = user.email ?? null
  if (!["owner", "admin", "trainer"].includes(String(membership.role))) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const parsed = BulkSignoffSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { level, skill_index, student_ids, notes } = parsed.data
  const ids = student_ids

  const levelConfig = getLevelById(level)
  if (!levelConfig || skill_index >= levelConfig.skills.length) {
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
    const { data: profiles, error: profilesError } = await serviceClient
      .from("users")
      .select("id, full_name")
      .in("id", completedNow)
    if (profilesError) {
      console.warn("[skills/bulk] profile lookup failed", profilesError)
    }
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
  }

  // Audit log: bulk signoffs are how skills get on the ladder, so each
  // batch is part of the moat's evidence trail. We log the requested
  // student count + the succeeded count; the actual student IDs go in
  // metadata so a security review can replay who got signed off on what.
  logAudit(supabase, {
    action: "skill.signoff.bulk",
    actorUserId: user.id,
    actorEmail,
    targetType: "skill_signoff",
    targetId: null,
    targetLabel: `${level} #${skill_index} (${levelConfig.skills[skill_index]})`,
    metadata: {
      org_id: membership.org_id,
      level,
      skill_index,
      skill_label: levelConfig.skills[skill_index],
      actor_role: membership.role,
      requested: ids.length,
      succeeded: succeededIds.size,
      succeeded_student_ids: [...succeededIds],
      completed_now: completedNow,
      notes: notes || null,
    },
    request,
  }).catch(() => {})

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
