/**
 * Trainer commission rules — list + create.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const { data, error } = await supabase
    .from("trainer_commission_rules")
    .select(`
      *,
      trainer:trainer_id (id, display_name),
      service:service_id (id, name)
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ rules: data ?? [] })
}

const RuleSchema = z
  .object({
    trainer_id: z.string().uuid(),
    service_id: z.string().uuid().nullable().optional(),
    rule_type: z.enum(["percent", "flat"]),
    percent_of_revenue: z.number().min(0).max(100).optional(),
    flat_amount_thb: z.number().int().min(0).optional(),
    only_completed: z.boolean().default(true),
    pay_for_no_show: z.boolean().default(false),
    effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    effective_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    is_active: z.boolean().default(true),
  })
  .refine(
    (d) =>
      (d.rule_type === "percent" && d.percent_of_revenue != null) ||
      (d.rule_type === "flat" && d.flat_amount_thb != null),
    { message: "percent_of_revenue required for percent, flat_amount_thb for flat" },
  )

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const parsed = RuleSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("trainer_commission_rules")
    .insert({
      org_id: orgId,
      ...parsed.data,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ rule: data })
}
