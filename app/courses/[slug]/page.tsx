import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import CourseDetailClient from "./client"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: course } = await supabase
    .from("courses")
    .select("title, short_description")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!course) return { title: "Course Not Found" }

  return {
    title: `${course.title} | MUAYTHAIPAI`,
    description: course.short_description || `Learn Muay Thai with ${course.title}`,
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params

  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      organizations:org_id (name, slug, logo_url)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!course) notFound()

  // Fetch modules with their lessons
  const { data: modules } = await supabase
    .from("course_modules")
    .select(`
      id, title, description, module_order,
      lessons (
        id, title, description, content_type,
        video_duration_seconds, estimated_minutes,
        lesson_order, is_preview
      )
    `)
    .eq("course_id", course.id)
    .order("module_order")

  // Sort lessons within each module
  type LessonRow = {
    id: string; title: string; description: string | null; content_type: string;
    video_duration_seconds: number | null; estimated_minutes: number | null;
    lesson_order: number; is_preview: boolean
  }
  const sortedModules = (modules || []).map((m) => ({
    ...m,
    lessons: ((m.lessons || []) as LessonRow[]).sort(
      (a, b) => a.lesson_order - b.lesson_order
    ),
  }))

  return <CourseDetailClient course={course} modules={sortedModules} />
}
