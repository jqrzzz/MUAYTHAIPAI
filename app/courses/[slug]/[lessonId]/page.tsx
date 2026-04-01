import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
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
    lessons: ((m.lessons as unknown[]) || []).sort(
      (a: { lesson_order: number }, b: { lesson_order: number }) =>
        a.lesson_order - b.lesson_order
    ),
  }))

  // Get quiz questions if quiz type
  let quizQuestions = null
  if (lesson.content_type === "quiz") {
    const { data } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("question_order")
    quizQuestions = data
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
