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

async function verifyLessonOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lessonId: string,
  orgId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("lessons")
    .select("course_id, courses!inner(org_id)")
    .eq("id", lessonId)
    .single()

  if (!data) return false
  const course = data.courses as unknown as { org_id: string }
  return course.org_id === orgId
}

export async function GET(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get("lesson_id")
  if (!lessonId) {
    return NextResponse.json({ error: "lesson_id is required" }, { status: 400 })
  }

  if (!(await verifyLessonOwnership(supabase, lessonId, membership.org_id))) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }

  const { data: questions, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("question_order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ questions: questions || [] })
}

export async function POST(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()
  const { lesson_id, question_text } = body

  if (!lesson_id || !question_text) {
    return NextResponse.json(
      { error: "lesson_id and question_text are required" },
      { status: 400 }
    )
  }

  if (!(await verifyLessonOwnership(supabase, lesson_id, membership.org_id))) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }

  const allowed = [
    "lesson_id", "question_text", "question_type",
    "options", "correct_answer", "explanation", "question_order",
  ]
  const insert: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) insert[key] = body[key]
  }

  const { data, error } = await supabase
    .from("quiz_questions")
    .insert(insert)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ question: data })
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
    .from("quiz_questions")
    .select("lesson_id")
    .eq("id", id)
    .single()

  if (!existing || !(await verifyLessonOwnership(supabase, existing.lesson_id, membership.org_id))) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 })
  }

  const allowed = [
    "question_text", "question_type",
    "options", "correct_answer", "explanation", "question_order",
  ]
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in updates) filtered[key] = updates[key]
  }

  const { data, error } = await supabase
    .from("quiz_questions")
    .update(filtered)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ question: data })
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
    .from("quiz_questions")
    .select("lesson_id")
    .eq("id", id)
    .single()

  if (!existing || !(await verifyLessonOwnership(supabase, existing.lesson_id, membership.org_id))) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 })
  }

  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
