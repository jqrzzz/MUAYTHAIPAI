/**
 * Sell a package to a student.
 *
 * POST /api/admin/students/:id/buy-package  body: { package_id, payment_method? }
 *
 * Creates a student_credits row from the package definition and records
 * a credit_transactions row stamping the payment + linking back to the
 * package for audit. Trainers can do this too — front-desk operations.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { requireGymStaff } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BodySchema = z.object({
  package_id: z.string().uuid(),
  payment_method: z
    .enum(["cash", "card", "stripe", "bank_transfer", "other"])
    .default("cash"),
  notes: z.string().max(300).optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGymStaff()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId, user } = auth
  const { id: studentId } = await params

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Pull the package — must belong to this gym + be active.
  const { data: pkg, error: pkgErr } = await supabase
    .from("gym_packages")
    .select("*")
    .eq("id", parsed.data.package_id)
    .eq("org_id", orgId)
    .eq("is_active", true)
    .maybeSingle()

  if (pkgErr || !pkg) {
    return NextResponse.json(
      { error: "Package not found or inactive" },
      { status: 404 },
    )
  }

  // Verify the student exists (any user with a row in `users` qualifies —
  // students are network-wide, not gym-scoped, so we can sell a package
  // to any signed-in user).
  const { data: student } = await supabase
    .from("users")
    .select("id")
    .eq("id", studentId)
    .maybeSingle()
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 })
  }

  const expiresAt = pkg.duration_days
    ? new Date(Date.now() + pkg.duration_days * 86400_000).toISOString()
    : null

  // Create the student_credits row.
  const { data: credit, error: creditErr } = await supabase
    .from("student_credits")
    .insert({
      org_id: orgId,
      user_id: studentId,
      credit_type: pkg.credit_type,
      credits_remaining: pkg.credit_count ?? 0,
      expires_at: expiresAt,
      package_id: pkg.id,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single()

  if (creditErr) {
    return NextResponse.json({ error: creditErr.message }, { status: 500 })
  }

  // Record the transaction. amount = pkg.credit_count (or 0 for unlimited
  // so audit shows it ≠ a top-up). payment_amount_thb captures the revenue.
  await supabase.from("credit_transactions").insert({
    org_id: orgId,
    user_id: studentId,
    transaction_type: "package_purchase",
    amount: pkg.credit_count ?? 0,
    payment_amount_thb: pkg.price_thb,
    payment_method: parsed.data.payment_method,
    description: `Sold ${pkg.name}${parsed.data.notes ? ` — ${parsed.data.notes}` : ""}`,
    created_by: user.id,
  })

  return NextResponse.json({
    ok: true,
    credit,
    package: { id: pkg.id, name: pkg.name },
  })
}
