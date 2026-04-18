import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select(`
      id, status, progress_pct, completed_lessons, total_lessons,
      last_accessed_at, completed_at,
      courses (
        id, title, slug, cover_image_url, certificate_level,
        difficulty, category, total_lessons, estimated_hours
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["active", "completed"])
    .order("last_accessed_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const courses = await Promise.all(
    (enrollments || []).map(async (enrollment: Record<string, unknown>) => {
      const course = enrollment.courses as unknown as {
        id: string
        title: string
        slug: string
        cover_image_url: string | null
        certificate_level: string | null
        difficulty: string
        category: string
        total_lessons: number
        estimated_hours: number
      }

      if (!course) return null

      let next_lesson = null
      if (enrollment.status === "active") {
        const { data: allLessons } = await supabase
          .from("lessons")
          .select("id, title, content_type, lesson_order, module_id")
          .eq("course_id", course.id)
          .order("lesson_order", { ascending: true })

        const { data: completedLessons } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("course_id", course.id)
          .eq("status", "completed")

        const completedIds = new Set((completedLessons || []).map((l: { lesson_id: string }) => l.lesson_id))
        const nextIncomplete = (allLessons || []).find((l: { id: string }) => !completedIds.has(l.id))

        if (nextIncomplete) {
          next_lesson = {
            id: nextIncomplete.id,
            title: nextIncomplete.title,
            content_type: nextIncomplete.content_type,
          }
        }
      }

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        cover_image_url: course.cover_image_url,
        certificate_level: course.certificate_level,
        difficulty: course.difficulty,
        category: course.category,
        total_lessons: course.total_lessons,
        estimated_hours: course.estimated_hours,
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          progress_pct: enrollment.progress_pct,
          completed_lessons: enrollment.completed_lessons,
          total_lessons: enrollment.total_lessons,
          last_accessed_at: enrollment.last_accessed_at,
          completed_at: enrollment.completed_at,
        },
        next_lesson,
      }
    })
  )

  return NextResponse.json({ courses: courses.filter(Boolean) })
}
