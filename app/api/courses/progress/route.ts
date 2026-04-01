import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/courses/progress?course_id=xxx — get user's progress for a course
export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get("course_id")
  if (!courseId) {
    return NextResponse.json({ error: "course_id required" }, { status: 400 })
  }

  // Get enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single()

  // Get lesson-level progress
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, status, video_position_seconds, completed_at")
    .eq("user_id", user.id)
    .eq("course_id", courseId)

  return NextResponse.json({
    enrollment: enrollment || null,
    progress: progress || [],
  })
}

// POST /api/courses/progress — mark lesson progress
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { lesson_id, course_id, status, video_position_seconds, quiz_answers, quiz_score } = body

  if (!lesson_id || !course_id) {
    return NextResponse.json({ error: "lesson_id and course_id required" }, { status: 400 })
  }

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course_id)
    .single()

  if (!enrollment) {
    return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 })
  }

  // Upsert lesson progress
  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {
    user_id: user.id,
    lesson_id,
    course_id,
    status: status || "in_progress",
  }

  if (video_position_seconds !== undefined) {
    updates.video_position_seconds = video_position_seconds
  }
  if (quiz_answers !== undefined) {
    updates.quiz_answers = quiz_answers
  }
  if (quiz_score !== undefined) {
    updates.quiz_score = quiz_score
  }
  if (status === "in_progress" && !updates.started_at) {
    updates.started_at = now
  }
  if (status === "completed") {
    updates.completed_at = now
  }

  const { data: progress, error } = await supabase
    .from("lesson_progress")
    .upsert(updates, { onConflict: "user_id,lesson_id" })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update enrollment progress counts
  if (status === "completed") {
    const { count } = await supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("course_id", course_id)
      .eq("status", "completed")

    const { data: course } = await supabase
      .from("courses")
      .select("total_lessons")
      .eq("id", course_id)
      .single()

    const completedCount = count || 0
    const totalCount = course?.total_lessons || 1
    const pct = Math.round((completedCount / totalCount) * 100)

    const enrollmentUpdate: Record<string, unknown> = {
      completed_lessons: completedCount,
      progress_pct: pct,
      last_accessed_at: now,
    }

    if (pct >= 100) {
      enrollmentUpdate.status = "completed"
      enrollmentUpdate.completed_at = now
    }

    await supabase
      .from("enrollments")
      .update(enrollmentUpdate)
      .eq("user_id", user.id)
      .eq("course_id", course_id)
  }

  return NextResponse.json({ progress })
}
