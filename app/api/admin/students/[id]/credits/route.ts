import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params
  const body = await request.json()
  const { creditType, credits, expiresAt, paymentMethod, paymentAmount, notes } = body

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

  // Check if student already has credits of this type
  const { data: existingCredit } = await supabase
    .from("student_credits")
    .select("*")
    .eq("org_id", membership.org_id)
    .eq("user_id", studentId)
    .eq("credit_type", creditType)
    .single()

  let studentCreditId: string

  if (existingCredit) {
    // Update existing credits
    const newBalance = (existingCredit.credits_remaining || 0) + credits
    const { data: updated, error } = await supabase
      .from("student_credits")
      .update({
        credits_remaining: newBalance,
        expires_at: expiresAt || existingCredit.expires_at,
        notes: notes || existingCredit.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingCredit.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    studentCreditId = existingCredit.id
  } else {
    // Create new credit record
    const { data: newCredit, error } = await supabase
      .from("student_credits")
      .insert({
        org_id: membership.org_id,
        user_id: studentId,
        credit_type: creditType,
        credits_remaining: credits,
        expires_at: expiresAt,
        notes: notes,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    studentCreditId = newCredit.id
  }

  // Log the transaction
  const { error: txError } = await supabase.from("credit_transactions").insert({
    org_id: membership.org_id,
    user_id: studentId,
    student_credit_id: studentCreditId,
    transaction_type: "payment",
    amount: credits,
    payment_method: paymentMethod,
    payment_amount_thb: paymentAmount,
    description: notes || `Added ${credits} ${creditType}`,
    recorded_by: user.id,
  })

  if (txError) {
    console.error("Failed to log transaction:", txError)
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params
  const body = await request.json()
  const { action, creditType, amount, reason, bookingId } = body

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

  // Get student's credits
  const { data: credit } = await supabase
    .from("student_credits")
    .select("*")
    .eq("org_id", membership.org_id)
    .eq("user_id", studentId)
    .eq("credit_type", creditType || "sessions")
    .single()

  if (!credit) {
    return NextResponse.json({ error: "No credits found" }, { status: 404 })
  }

  // Calculate new balance
  let newBalance = credit.credits_remaining || 0
  const transactionType = action
  let transactionAmount = amount || 1

  if (action === "deduct") {
    newBalance = Math.max(0, newBalance - transactionAmount)
    transactionAmount = -transactionAmount
  } else if (action === "add") {
    newBalance = newBalance + transactionAmount
  }

  // Update credits
  const { error: updateError } = await supabase
    .from("student_credits")
    .update({
      credits_remaining: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", credit.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log transaction
  await supabase.from("credit_transactions").insert({
    org_id: membership.org_id,
    user_id: studentId,
    student_credit_id: credit.id,
    transaction_type: transactionType,
    amount: transactionAmount,
    description: reason || `${action === "deduct" ? "Deducted" : "Added"} ${Math.abs(transactionAmount)} session(s)`,
    recorded_by: user.id,
    booking_id: bookingId,
  })

  return NextResponse.json({ success: true, newBalance })
}
