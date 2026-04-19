import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const { name: rawName, full_name, email, phone, creditType, credits, expiresAt, paymentMethod, paymentAmount, notes } = body
  const name = rawName || full_name

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's org
  const { data: membership } = await supabase.from("org_members").select("org_id, role").eq("user_id", user.id).single()

  if (!membership || !["owner", "admin", "trainer"].includes(membership.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Check if user already exists by email
  let studentId: string
  const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

  if (existingUser) {
    studentId = existingUser.id
  } else {
    // Create a placeholder user (they can claim account later)
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        id: crypto.randomUUID(),
        email: email,
        full_name: name,
        phone: phone,
      })
      .select()
      .single()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }
    studentId = newUser.id
  }

  // Create student credits if provided
  if (credits && credits > 0) {
    const { error: creditError } = await supabase.from("student_credits").insert({
      org_id: membership.org_id,
      user_id: studentId,
      credit_type: creditType || "sessions",
      credits_remaining: credits,
      expires_at: expiresAt,
      notes: notes,
    })

    if (creditError && !creditError.message.includes("duplicate")) {
      return NextResponse.json({ error: creditError.message }, { status: 500 })
    }

    // Log the transaction
    await supabase.from("credit_transactions").insert({
      org_id: membership.org_id,
      user_id: studentId,
      transaction_type: "payment",
      amount: credits,
      payment_method: paymentMethod,
      payment_amount_thb: paymentAmount,
      description: notes || `Initial ${credits} ${creditType || "sessions"}`,
      recorded_by: user.id,
    })
  }

  return NextResponse.json({ success: true, studentId })
}
