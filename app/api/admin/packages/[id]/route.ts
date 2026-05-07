/**
 * Gym package — single-row operations.
 *
 * PATCH  /api/admin/packages/:id  → edit fields (price, name, etc.)
 * DELETE /api/admin/packages/:id  → soft-delete (sets is_active=false)
 *                                   so existing student_credits rows
 *                                   that reference this package keep
 *                                   their FK intact.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(500).nullable().optional(),
    price_thb: z.number().int().min(0).optional(),
    price_usd: z.number().int().min(0).nullable().optional(),
    credit_type: z.string().min(1).max(40).optional(),
    credit_count: z.number().int().min(1).max(1000).nullable().optional(),
    duration_days: z.number().int().min(1).max(3650).nullable().optional(),
    is_active: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    display_order: z.number().int().optional(),
  })
  .strict()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth
  const { id } = await params

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("gym_packages")
    .update(parsed.data)
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ package: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth
  const { id } = await params

  // Soft delete — preserve referential integrity for student_credits
  // that already point at this package.
  const { error } = await supabase
    .from("gym_packages")
    .update({ is_active: false })
    .eq("id", id)
    .eq("org_id", orgId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
