/**
 * Settle a trainer payout.
 *
 * POST /api/admin/payouts/settle
 *   body: { trainer_id, period_start, period_end, payment_method?, notes? }
 *
 * Computes the total at this moment, snapshots the breakdown into the
 * trainer_payouts row, and marks status=paid. The breakdown is JSON so
 * the trainer can verify what they got paid for.
 */
import { NextResponse } from "next/server"
import type { Json } from "@/lib/supabase/database.types"
import { z } from "zod"
import { requireGymAdmin } from "@/lib/auth-helpers"
import {
  computeCommissions,
  type CommissionRule,
  type BookingForCommission,
} from "@/lib/commissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BodySchema = z.object({
  trainer_id: z.string().uuid(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_method: z.enum(["cash", "bank_transfer", "other"]).default("cash"),
  notes: z.string().max(500).optional(),
})

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId, user } = auth

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { trainer_id, period_start, period_end, payment_method, notes } =
    parsed.data

  // Pull bookings + rules just for this trainer + period
  const [bookingsRes, rulesRes] = await Promise.all([
    supabase
      .from("bookings")
      .select(`
        id, trainer_id, service_id, booking_date, status, payment_status, payment_amount_thb,
        services:service_id (name)
      `)
      .eq("org_id", orgId)
      .eq("trainer_id", trainer_id)
      .gte("booking_date", period_start)
      .lte("booking_date", period_end),
    supabase
      .from("trainer_commission_rules")
      .select("*")
      .eq("org_id", orgId)
      .eq("trainer_id", trainer_id),
  ])

  const bookings: BookingForCommission[] = (bookingsRes.data ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row: any) => {
      const svc = Array.isArray(row.services) ? row.services[0] : row.services
      return {
        id: row.id,
        trainer_id: row.trainer_id,
        service_id: row.service_id,
        booking_date: row.booking_date,
        status: row.status,
        payment_status: row.payment_status,
        payment_amount_thb: row.payment_amount_thb,
        service_name: svc?.name ?? null,
      }
    },
  )
  const rules = (rulesRes.data ?? []) as CommissionRule[]
  const result = computeCommissions(bookings, rules)

  if (result.total_sessions === 0) {
    return NextResponse.json(
      { error: "No sessions in this period for this trainer" },
      { status: 400 },
    )
  }

  // Save the snapshot — breakdown lets the trainer verify
  const { data: payout, error } = await supabase
    .from("trainer_payouts")
    .insert({
      org_id: orgId,
      trainer_id,
      period_start,
      period_end,
      total_sessions: result.total_sessions,
      total_amount_thb: result.total_commission_thb,
      breakdown: result.line_items as unknown as Json,
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_method,
      notes: notes ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ payout })
}
