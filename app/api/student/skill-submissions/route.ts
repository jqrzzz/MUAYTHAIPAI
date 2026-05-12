/**
 * Student-facing API for skill demonstration submissions.
 *
 *   GET   — list the student's own submissions
 *   POST  — record a new submission (after the file is uploaded to storage)
 *
 * The actual video upload happens client-side directly to the
 * skill-submissions bucket. This endpoint takes the resulting public URL
 * and persists the row. We keep the upload off the server to avoid
 * proxying 100MB through Node.
 *
 * org_id is derived from the student's active certification_enrollment
 * for that level — we won't accept submissions for levels the student
 * isn't enrolled in.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PostSchema = z.object({
  level: z.string().min(1),
  skillIndex: z.number().int().min(0),
  videoUrl: z.string().url(),
  studentNotes: z.string().max(500).optional().nullable(),
})

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("skill_submissions")
    .select(
      "id, org_id, level, skill_index, video_url, student_notes, status, reviewer_notes, decided_at, created_at, organizations:org_id (name)",
    )
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submissions: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = PostSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { level, skillIndex, videoUrl, studentNotes } = parsed.data

  const levelDef = CERTIFICATION_LEVELS.find((l) => l.id === level)
  if (!levelDef) {
    return NextResponse.json({ error: "Unknown level" }, { status: 400 })
  }
  if (skillIndex < 0 || skillIndex >= levelDef.skills.length) {
    return NextResponse.json({ error: "Unknown skill" }, { status: 400 })
  }

  // Pin the submission to the student's active enrollment for this level
  const { data: enrollment } = await supabase
    .from("certification_enrollments")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("level", level)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!enrollment?.org_id) {
    return NextResponse.json(
      { error: "Enroll in this level before submitting demonstrations" },
      { status: 400 },
    )
  }

  // Reject duplicate active submissions — student must wait for review or
  // for the previous one to be sent_back/rejected before resubmitting.
  const { data: existing } = await supabase
    .from("skill_submissions")
    .select("id, status")
    .eq("student_id", user.id)
    .eq("org_id", enrollment.org_id)
    .eq("level", level)
    .eq("skill_index", skillIndex)
    .in("status", ["pending", "approved"])
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === "approved"
            ? "This skill is already approved"
            : "You already have a pending submission for this skill",
      },
      { status: 409 },
    )
  }

  const { data, error } = await supabase
    .from("skill_submissions")
    .insert({
      org_id: enrollment.org_id,
      student_id: user.id,
      level,
      skill_index: skillIndex,
      video_url: videoUrl,
      student_notes: studentNotes ?? null,
      status: "pending",
    })
    .select("id, org_id, level, skill_index, video_url, status, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submission: data })
}
