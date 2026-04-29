import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { createClient } from "@/lib/supabase/server"

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

async function verifyPlatformCourse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .is("org_id", null)
    .single()
  return !!data
}

export async function GET(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get("course_id")
  if (!courseId) {
    return NextResponse.json({ error: "course_id is required" }, { status: 400 })
  }

  if (!(await verifyPlatformCourse(supabase, courseId))) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  const { data: modules, error } = await supabase
    .from("course_modules")
    .select("*, lessons(id, title, content_type, lesson_order, is_preview, estimated_minutes)")
    .eq("course_id", courseId)
    .order("module_order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ modules: modules || [] })
}

export async function POST(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()
  const { course_id, title } = body

  if (!course_id || !title) {
    return NextResponse.json({ error: "course_id and title are required" }, { status: 400 })
  }

  if (!(await verifyPlatformCourse(supabase, course_id))) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("course_modules")
    .insert({
      course_id,
      title,
      description: body.description || null,
      module_order: body.module_order ?? 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await updateCourseCounts(supabase, course_id)

  return NextResponse.json({ module: data })
}

export async function PATCH(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("course_modules")
    .select("course_id")
    .eq("id", id)
    .single()

  if (!existing || !(await verifyPlatformCourse(supabase, existing.course_id))) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }

  const allowed = ["title", "description", "module_order"]
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in updates) filtered[key] = updates[key]
  }

  const { data, error } = await supabase
    .from("course_modules")
    .update(filtered)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ module: data })
}

export async function DELETE(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("course_modules")
    .select("course_id")
    .eq("id", id)
    .single()

  if (!existing || !(await verifyPlatformCourse(supabase, existing.course_id))) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 })
  }

  const courseId = existing.course_id

  const { error } = await supabase
    .from("course_modules")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await updateCourseCounts(supabase, courseId)

  return NextResponse.json({ success: true })
}
