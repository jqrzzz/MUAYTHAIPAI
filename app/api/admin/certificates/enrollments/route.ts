import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { LEVEL_IDS } from "@/lib/certification-levels"

async function getMembership(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .single()
  return data
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await getMembership(supabase, user.id)
  if (!membership) {
    return NextResponse.json({ error: "No organization access" }, { status: 403 })
  }

  const { data: enrollments, error } = await supabase
    .from("certification_enrollments")
    .select(`
      id, level, status, enrolled_at, completed_at, payment_status, payment_amount_thb, notes, certificate_id,
      users:user_id (id, full_name, email)
    `)
    .eq("org_id", membership.org_id)
    .order("enrolled_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ enrollments: enrollments || [] })
}

// POST - Manually enroll a student in a certification level
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await getMembership(supabase, user.id)
  if (!membership || !["owner", "admin", "trainer"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const { student_email, level, notes } = await request.json()

  if (!student_email || !level) {
    return NextResponse.json({ error: "student_email and level are required" }, { status: 400 })
  }

  if (!LEVEL_IDS.includes(level)) {
    return NextResponse.json({ error: `Invalid level. Must be one of: ${LEVEL_IDS.join(", ")}` }, { status: 400 })
  }

  const { data: student } = await supabase
    .from("users")
    .select("id")
    .eq("email", student_email)
    .single()

  if (!student) {
    return NextResponse.json({ error: "Student not found. They must have an account first." }, { status: 404 })
  }

  const { data: existing } = await supabase
    .from("certification_enrollments")
    .select("id, status")
    .eq("org_id", membership.org_id)
    .eq("user_id", student.id)
    .eq("level", level)
    .single()

  if (existing && existing.status === "active") {
    return NextResponse.json({ error: "Student is already enrolled at this level" }, { status: 409 })
  }

  // Reactivate cancelled/expired enrollment or create new
  if (existing) {
    const { data: enrollment, error } = await supabase
      .from("certification_enrollments")
      .update({ status: "active", notes: notes || existing.status === "cancelled" ? "Re-enrolled by admin" : null, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ enrollment })
  }

  const { data: enrollment, error } = await supabase
    .from("certification_enrollments")
    .insert({
      org_id: membership.org_id,
      user_id: student.id,
      level,
      status: "active",
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ enrollment })
}

// PATCH - Update enrollment status (cancel, complete, etc.)
export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await getMembership(supabase, user.id)
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can update enrollments" }, { status: 403 })
  }

  const { enrollment_id, status, payment_status, notes } = await request.json()

  if (!enrollment_id) {
    return NextResponse.json({ error: "enrollment_id is required" }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (status) {
    if (!["active", "completed", "cancelled", "expired"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    updates.status = status
    if (status === "completed") updates.completed_at = new Date().toISOString()
    if (status === "cancelled") updates.completed_at = null
  }

  if (payment_status) {
    if (!["pending", "paid", "refunded"].includes(payment_status)) {
      return NextResponse.json({ error: "Invalid payment_status" }, { status: 400 })
    }
    updates.payment_status = payment_status
  }

  if (notes !== undefined) updates.notes = notes

  const { data: enrollment, error } = await supabase
    .from("certification_enrollments")
    .update(updates)
    .eq("id", enrollment_id)
    .eq("org_id", membership.org_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
  }

  return NextResponse.json({ enrollment })
}

// DELETE - Remove an enrollment entirely
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await getMembership(supabase, user.id)
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can delete enrollments" }, { status: 403 })
  }

  const { enrollment_id } = await request.json()

  if (!enrollment_id) {
    return NextResponse.json({ error: "enrollment_id is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("certification_enrollments")
    .delete()
    .eq("id", enrollment_id)
    .eq("org_id", membership.org_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
