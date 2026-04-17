import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { notifyCourseCompleted } from "@/lib/notifications"
import { getLevelById } from "@/lib/certification-levels"

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  const { lesson_id, course_id, status, video_position_seconds, quiz_answers } = body

  if (!lesson_id || !course_id || typeof lesson_id !== "string" || typeof course_id !== "string") {
    return NextResponse.json({ error: "lesson_id and course_id required" }, { status: 400 })
  }

  if (status && !["in_progress", "completed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
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

  // Server-side quiz scoring
  let quizScore: number | undefined
  let quizResults: { score: number; total: number; correct_answers: Record<string, string> } | undefined

  if (quiz_answers && typeof quiz_answers === "object") {
    const { data: questions } = await serviceClient
      .from("quiz_questions")
      .select("id, correct_answer, options")
      .eq("lesson_id", lesson_id)

    if (questions && questions.length > 0) {
      const correctAnswers: Record<string, string> = {}
      let correctCount = 0

      for (const q of questions) {
        correctAnswers[q.id] = q.correct_answer
        if (quiz_answers[q.id] === q.correct_answer) {
          correctCount++
        }
      }

      quizScore = Math.round((correctCount / questions.length) * 100)
      quizResults = {
        score: correctCount,
        total: questions.length,
        correct_answers: correctAnswers,
      }
    }
  }

  // Upsert lesson progress
  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {
    user_id: user.id,
    lesson_id,
    course_id,
    status: status || "in_progress",
  }

  if (video_position_seconds !== undefined && typeof video_position_seconds === "number") {
    updates.video_position_seconds = video_position_seconds
  }
  if (quiz_answers !== undefined) {
    updates.quiz_answers = quiz_answers
  }
  if (quizScore !== undefined) {
    updates.quiz_score = quizScore
  }
  if (status === "in_progress") {
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
      .select("total_lessons, certificate_level, org_id, title")
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

      if (course?.certificate_level && course.org_id) {
        const levelConfig = getLevelById(course.certificate_level)
        const { data: profile } = await serviceClient
          .from("users")
          .select("full_name")
          .eq("id", user.id)
          .single()

        notifyCourseCompleted({
          orgId: course.org_id,
          studentName: profile?.full_name || "Student",
          studentId: user.id,
          courseTitle: course.title || "Course",
          courseId: course_id,
          certificateLevel: course.certificate_level,
          levelName: levelConfig?.name || course.certificate_level,
        }).catch(() => {})
      }
    }

    await supabase
      .from("enrollments")
      .update(enrollmentUpdate)
      .eq("user_id", user.id)
      .eq("course_id", course_id)
  }

  return NextResponse.json({ progress, quiz_results: quizResults })
}
