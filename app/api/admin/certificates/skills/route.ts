import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getLevelById, CERTIFICATION_LEVELS } from "@/lib/certification-levels"
import { notifyCourseCompleted } from "@/lib/notifications"

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET - Get skill signoffs for a student at a level
// Query: ?student_id=xxx&level=naga
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get("student_id")
  const level = searchParams.get("level")

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

  if (!membership) {
    return NextResponse.json({ error: "No organization" }, { status: 403 })
  }

  if (!studentId || !level) {
    return NextResponse.json({ error: "student_id and level are required" }, { status: 400 })
  }

  const levelConfig = getLevelById(level)
  if (!levelConfig) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 })
  }

  const { data: signoffs } = await supabase
    .from("skill_signoffs")
    .select("skill_index, signed_off_by, notes, signed_off_at")
    .eq("org_id", membership.org_id)
    .eq("student_id", studentId)
    .eq("level", level)

  const signedSet = new Set((signoffs ?? []).map((s: { skill_index: number }) => s.skill_index))

  const skills = levelConfig.skills.map((name, index) => {
    const signoff = (signoffs ?? []).find((s: { skill_index: number }) => s.skill_index === index)
    return {
      index,
      name,
      signedOff: signedSet.has(index),
      signedOffAt: signoff?.signed_off_at ?? null,
      signedOffBy: signoff?.signed_off_by ?? null,
      notes: signoff?.notes ?? null,
    }
  })

  return NextResponse.json({
    level: levelConfig.id,
    levelName: levelConfig.name,
    skills,
    completedCount: signedSet.size,
    totalCount: levelConfig.skills.length,
    allComplete: signedSet.size >= levelConfig.skills.length,
  })
}

// POST - Sign off a skill for a student
// Body: { student_id, level, skill_index, notes? }
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

  const { student_id, level, skill_index, notes } = body as {
    student_id?: string
    level?: string
    skill_index?: number
    notes?: string
  }

  if (!student_id || !level || skill_index === undefined) {
    return NextResponse.json(
      { error: "student_id, level, and skill_index are required" },
      { status: 400 }
    )
  }

  const levelConfig = getLevelById(level)
  if (!levelConfig || skill_index < 0 || skill_index >= levelConfig.skills.length) {
    return NextResponse.json({ error: "Invalid level or skill_index" }, { status: 400 })
  }

  const { data: signoff, error } = await supabase
    .from("skill_signoffs")
    .upsert(
      {
        org_id: membership.org_id,
        student_id,
        level,
        skill_index,
        signed_off_by: user.id,
        notes: notes || null,
        signed_off_at: new Date().toISOString(),
      },
      { onConflict: "org_id,student_id,level,skill_index" }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check if all skills are now signed off
  const { count } = await supabase
    .from("skill_signoffs")
    .select("id", { count: "exact", head: true })
    .eq("org_id", membership.org_id)
    .eq("student_id", student_id)
    .eq("level", level)

  const allComplete = (count ?? 0) >= levelConfig.skills.length

  // Notify gym when all skills for a level are complete
  if (allComplete) {
    const { data: studentProfile } = await serviceClient
      .from("users")
      .select("full_name")
      .eq("id", student_id)
      .single()

    notifyCourseCompleted({
      orgId: membership.org_id,
      studentName: studentProfile?.full_name || "Student",
      studentId: student_id,
      courseTitle: "Skill Assessment",
      courseId: "",
      certificateLevel: level,
      levelName: levelConfig.name,
    }).catch(() => {})
  }

  return NextResponse.json({
    signoff,
    completedCount: count ?? 0,
    totalCount: levelConfig.skills.length,
    allComplete,
    skillName: levelConfig.skills[skill_index],
  })
}

// DELETE - Remove a skill signoff (undo)
// Body: { student_id, level, skill_index }
export async function DELETE(request: Request) {
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

  const { student_id, level, skill_index } = body

  const { error } = await supabase
    .from("skill_signoffs")
    .delete()
    .eq("org_id", membership.org_id)
    .eq("student_id", student_id)
    .eq("level", level)
    .eq("skill_index", skill_index)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// GET all levels with skill definitions (no auth — public reference)
export { CERTIFICATION_LEVELS }
