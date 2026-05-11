/**
 * Single skill-submission review handler.
 *
 *   PATCH — set status to approved / rejected / sent_back, attribute the
 *           reviewer, and (on approval) upsert a skill_signoffs row so
 *           the verify/passport pages immediately reflect the new tick.
 *
 * The signoff is intentionally written from the API (not a DB trigger)
 * so we can attribute signed_off_by = reviewer.id and audit-log it.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireGymStaff } from "@/lib/auth-helpers"
import { logAudit } from "@/lib/audit-log"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PatchSchema = z.object({
  status: z.enum(["approved", "rejected", "sent_back"]),
  reviewer_notes: z.string().max(1000).optional().nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGymStaff()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, user, orgId } = auth
  const { id } = await params

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { status, reviewer_notes } = parsed.data

  // Load the submission first so we can (a) verify it belongs to this
  // org and (b) read student_id/level/skill_index for the signoff.
  const { data: submission, error: loadErr } = await supabase
    .from("skill_submissions")
    .select("id, org_id, student_id, level, skill_index, status")
    .eq("id", id)
    .single()

  if (loadErr || !submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (submission.org_id !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (submission.status !== "pending") {
    return NextResponse.json(
      { error: `Submission already ${submission.status}` },
      { status: 409 },
    )
  }

  const decidedAt = new Date().toISOString()

  const { data: updated, error: updateErr } = await supabase
    .from("skill_submissions")
    .update({
      status,
      reviewer_id: user.id,
      reviewer_notes: reviewer_notes ?? null,
      decided_at: decidedAt,
    })
    .eq("id", id)
    .select(
      "id, student_id, level, skill_index, status, reviewer_notes, decided_at",
    )
    .single()

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // On approval, persist a skill_signoffs row so the rest of the
  // platform (verify page, passport, progress dashboards) treats this
  // as a real tick. Upsert because a manual signoff may already exist.
  if (status === "approved") {
    const lvl = CERTIFICATION_LEVELS.find((l) => l.id === submission.level)
    const skillName = lvl?.skills[submission.skill_index] ?? "Skill"

    await supabase
      .from("skill_signoffs")
      .upsert(
        {
          org_id: orgId,
          student_id: submission.student_id,
          level: submission.level,
          skill_index: submission.skill_index,
          signed_off_by: user.id,
          notes:
            reviewer_notes ?? `Video-verified: ${skillName}`,
          signed_off_at: decidedAt,
        },
        { onConflict: "org_id,student_id,level,skill_index" },
      )
  }

  await logAudit(supabase, {
    action: `skill_submission.${status}`,
    actorUserId: user.id,
    targetType: "skill_submission",
    targetId: id,
    targetLabel: `${submission.level}#${submission.skill_index}`,
    metadata: {
      student_id: submission.student_id,
      level: submission.level,
      skill_index: submission.skill_index,
      reviewer_notes: reviewer_notes ?? null,
    },
    request,
  })

  return NextResponse.json({ submission: updated })
}
