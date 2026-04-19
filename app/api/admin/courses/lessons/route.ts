import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function getMembership() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, membership: null }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  return { supabase, membership }
}

async function updateCourseCounts(supabase: Awaited<ReturnType<typeof createClient>>, courseId: string) {
  const { count: totalModules } = await supabase
    .from("course_modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)

  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)

  await supabase
    .from("courses")
    .update({
      total_modules: totalModules ?? 0,
      total_lessons: totalLessons ?? 0,
    })
    .eq("id", courseId)
}

async function verifyCourseOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
  orgId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("org_id", orgId)
    .single()
  return !!data
}

export async function GET(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const moduleId = searchParams.get("module_id")
  if (!moduleId) {
    return NextResponse.json({ error: "module_id is required" }, { status: 400 })
  }

  const { data: mod } = await supabase
    .from("course_modules")
    .select("course_id")
    .eq("id", moduleId)
    .single()

  if (!mod || !(await verifyCourseOwnership(supabase, mod.course_id, membership.org_id))) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }

  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("lesson_order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lessons: lessons || [] })
}

export async function POST(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()
  const { module_id, course_id, title } = body

  if (!module_id || !course_id || !title) {
    return NextResponse.json(
      { error: "module_id, course_id, and title are required" },
      { status: 400 }
    )
  }

  if (!(await verifyCourseOwnership(supabase, course_id, membership.org_id))) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  const allowed = [
    "module_id", "course_id", "title", "description", "content_type",
    "video_url", "video_duration_seconds", "text_content",
    "drill_instructions", "drill_duration_minutes",
    "lesson_order", "is_preview", "estimated_minutes",
  ]
  const insert: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) insert[key] = body[key]
  }

  const { data, error } = await supabase
    .from("lessons")
    .insert(insert)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await updateCourseCounts(supabase, course_id)

  return NextResponse.json({ lesson: data })
}

export async function PATCH(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("lessons")
    .select("course_id")
    .eq("id", id)
    .single()

  if (!existing || !(await verifyCourseOwnership(supabase, existing.course_id, membership.org_id))) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }

  const allowed = [
    "title", "description", "content_type",
    "video_url", "video_duration_seconds", "text_content",
    "drill_instructions", "drill_duration_minutes",
    "lesson_order", "is_preview", "estimated_minutes",
  ]
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in updates) filtered[key] = updates[key]
  }

  const { data, error } = await supabase
    .from("lessons")
    .update(filtered)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lesson: data })
}

export async function DELETE(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("lessons")
    .select("course_id")
    .eq("id", id)
    .single()

  if (!existing || !(await verifyCourseOwnership(supabase, existing.course_id, membership.org_id))) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }

  const courseId = existing.course_id

  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await updateCourseCounts(supabase, courseId)

  return NextResponse.json({ success: true })
}
