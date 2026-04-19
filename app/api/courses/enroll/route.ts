import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/courses/enroll — enroll current user in a course
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Sign in to enroll" }, { status: 401 })
  }

  const { course_id } = await request.json()
  if (!course_id) {
    return NextResponse.json({ error: "course_id required" }, { status: 400 })
  }

  // Get course info
  const { data: course } = await supabase
    .from("courses")
    .select("id, total_lessons, is_free, price_thb, status")
    .eq("id", course_id)
    .eq("status", "published")
    .single()

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("course_id", course_id)
    .single()

  if (existing) {
    // Reactivate if paused
    if (existing.status === "paused") {
      await supabase
        .from("enrollments")
        .update({ status: "active", last_accessed_at: new Date().toISOString() })
        .eq("id", existing.id)
      return NextResponse.json({ enrollment: { ...existing, status: "active" } })
    }
    return NextResponse.json({ enrollment: existing })
  }

  // Paid courses go through /api/courses/checkout
  if (!course.is_free && course.price_thb > 0) {
    return NextResponse.json(
      { error: "paid_course", price_thb: course.price_thb, course_id: course.id },
      { status: 402 }
    )
  }

  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .insert({
      user_id: user.id,
      course_id: course_id,
      total_lessons: course.total_lessons,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ enrollment })
}
