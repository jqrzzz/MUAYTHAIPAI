/**
 * Course Study Pack — printable artifact of an entire course.
 *
 * Server component fetches everything in one shot (course, modules,
 * lessons, gallery, quiz questions). Renders a print-formatted HTML
 * page. Browser print → save as PDF works great.
 *
 * Auth: same gate as /courses/[slug]/[lessonId] — enrollment OR
 * platform admin OR every lesson is preview. If gated, redirect to the
 * course page (let the standard enrollment flow take over).
 *
 * Layout (see client.tsx):
 *   Title page (course, gym, certification level, generated date)
 *   Table of contents
 *   Each module → header → each lesson → hero / text / drill / quiz / gallery
 *   Footer: gym name + study pack disclaimer
 */
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import StudyPackClient from "./client"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("slug", slug)
    .single()
  return {
    title: course ? `Study pack — ${course.title} | MUAYTHAIPAI` : "Study pack",
    robots: "noindex, nofollow",
  }
}

export default async function StudyPackPage({ params }: Props) {
  const { slug } = await params

  const { data: course } = await supabase
    .from("courses")
    .select(`
      id, title, slug, description, short_description, cover_image_url,
      certificate_level, difficulty, category, total_modules, total_lessons,
      estimated_hours, org_id,
      organizations:org_id (name, slug, logo_url)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!course) notFound()

  // Auth: enrolled OR platform admin. (Preview-only courses are visible
  // to anyone but most courses are enrolled-only.)
  const authClient = await createServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  let studentName: string | null = null
  if (user) {
    const { data: u } = await authClient
      .from("users")
      .select("full_name, email, is_platform_admin")
      .eq("id", user.id)
      .single()
    studentName = u?.full_name ?? u?.email ?? null

    if (!u?.is_platform_admin) {
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .in("status", ["active", "completed"])
        .maybeSingle()
      if (!enrollment) redirect(`/courses/${slug}`)
    }
  } else {
    // Not logged in — must enroll first.
    redirect(`/student/login?redirect=/courses/${slug}/study-pack`)
  }

  // Pull all modules + lessons in one shot, ordered.
  const { data: modulesRaw } = await supabase
    .from("course_modules")
    .select(`
      id, title, description, module_order,
      lessons (
        id, title, description, content_type, lesson_order,
        video_url, video_duration_seconds, text_content,
        drill_instructions, drill_duration_minutes,
        estimated_minutes, hero_image_url, gallery
      )
    `)
    .eq("course_id", course.id)
    .order("module_order")

  // Quiz questions for every quiz lesson — single query
  const lessonIds: string[] = []
  for (const m of modulesRaw ?? []) {
    for (const l of m.lessons ?? []) {
      if (l.content_type === "quiz") lessonIds.push(l.id)
    }
  }
  const { data: quizQuestions } = lessonIds.length
    ? await supabase
        .from("quiz_questions")
        .select("id, lesson_id, question_text, question_type, options, explanation, question_order")
        .in("lesson_id", lessonIds)
        .order("question_order")
    : { data: [] }

  const quizByLesson = new Map<string, typeof quizQuestions>()
  for (const q of quizQuestions ?? []) {
    const arr = quizByLesson.get(q.lesson_id) ?? []
    arr.push(q)
    quizByLesson.set(q.lesson_id, arr)
  }

  // Normalize + sort lessons within each module
  const modules = (modulesRaw ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    module_order: m.module_order,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lessons: ((m.lessons ?? []) as any[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.lesson_order - b.lesson_order)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((l: any) => ({
        ...l,
        quiz_questions: quizByLesson.get(l.id) ?? [],
      })),
  }))

  const org = Array.isArray(course.organizations)
    ? course.organizations[0]
    : course.organizations

  return (
    <StudyPackClient
      course={{
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        short_description: course.short_description,
        cover_image_url: course.cover_image_url,
        certificate_level: course.certificate_level,
        difficulty: course.difficulty,
        total_modules: course.total_modules,
        total_lessons: course.total_lessons,
        estimated_hours: course.estimated_hours,
      }}
      gymName={org?.name ?? null}
      gymLogoUrl={org?.logo_url ?? null}
      studentName={studentName}
      modules={modules}
    />
  )
}
