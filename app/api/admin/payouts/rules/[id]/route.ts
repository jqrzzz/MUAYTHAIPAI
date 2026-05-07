/**
 * Single rule: PATCH / DELETE.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PatchSchema = z.object({
  rule_type: z.enum(["percent", "flat"]).optional(),
  percent_of_revenue: z.number().min(0).max(100).nullable().optional(),
  flat_amount_thb: z.number().int().min(0).nullable().optional(),
  only_completed: z.boolean().optional(),
  pay_for_no_show: z.boolean().optional(),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  effective_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  is_active: z.boolean().optional(),
})

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
    .from("trainer_commission_rules")
    .update(parsed.data)
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ rule: data })
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

  const { error } = await supabase
    .from("trainer_commission_rules")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
