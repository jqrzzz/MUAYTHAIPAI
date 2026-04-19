import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import LessonPlayerClient from "./client"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Props {
  params: Promise<{ slug: string; lessonId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params
  const { data: lesson } = await supabase
    .from("lessons")
    .select("title")
    .eq("id", lessonId)
    .single()

  return {
    title: lesson ? `${lesson.title} | MUAYTHAIPAI` : "Lesson Not Found",
    robots: "noindex, nofollow",
  }
}

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params

  // Get course
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!course) notFound()

  // Get current lesson
  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, course_modules!inner(title, module_order)")
    .eq("id", lessonId)
    .eq("course_id", course.id)
    .single()

  if (!lesson) notFound()

  // Enrollment gate: preview lessons are open, others require enrollment
  if (!lesson.is_preview) {
    const authClient = await createServerClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      redirect(`/student/login?redirect=/courses/${slug}/${lessonId}`)
    }

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .in("status", ["active", "completed"])
      .single()

    if (!enrollment) {
      redirect(`/courses/${slug}`)
    }
  }

  // Get all lessons for navigation (ordered)
  const { data: allModules } = await supabase
    .from("course_modules")
    .select(`
      id, title, module_order,
      lessons (id, title, lesson_order, content_type, is_preview, estimated_minutes)
    `)
    .eq("course_id", course.id)
    .order("module_order")

  const sortedModules = (allModules || []).map((m) => ({
    ...m,
    lessons: ((m.lessons || []) as { lesson_order: number; id: string; title: string; content_type: string; is_preview: boolean; estimated_minutes: number | null }[]).sort(
      (a, b) => a.lesson_order - b.lesson_order
    ),
  }))

  // Get quiz questions for any lesson that has them — strip correct answers
  let quizQuestions = null
  const { data: quizData } = await supabase
    .from("quiz_questions")
    .select("id, question_text, question_type, options, explanation, question_order")
    .eq("lesson_id", lessonId)
    .order("question_order")

  if (quizData && quizData.length > 0) {
    quizQuestions = quizData.map((q) => ({
      ...q,
      options: Array.isArray(q.options)
        ? q.options.map((opt: { id: string; text: string }) => ({ id: opt.id, text: opt.text }))
        : q.options,
    }))
  }

  return (
    <LessonPlayerClient
      course={course}
      lesson={lesson}
      moduleName={(lesson.course_modules as { title: string }).title}
      modules={sortedModules}
      quizQuestions={quizQuestions}
    />
  )
}
