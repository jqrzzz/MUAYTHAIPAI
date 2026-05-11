/**
 * Bulk booking updates — apply a payment_status or status change to
 * many bookings at once.
 *
 * POST /api/admin/bookings/bulk
 *   body: { ids: string[], payment_status?, status?, staff_notes? }
 *
 * Auth: org admin/owner OR can_manage_bookings.
 * Always scoped by org_id so a malicious payload can't reach other gyms.
 *
 * Used by the Recent tab "Mark X selected as Paid" + "Mark Attended /
 * No-show" bulk actions. Fixes the visibility gap from the bookings
 * audit (110 pending-cash bookings sitting in limbo).
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  payment_status: z.enum(["paid", "pending", "refunded", "failed"]).optional(),
  status: z
    .enum(["pending", "confirmed", "completed", "cancelled", "no_show"])
    .optional(),
  staff_notes: z.string().max(500).optional(),
})

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }
  if (parsed.data.payment_status) updates.payment_status = parsed.data.payment_status
  if (parsed.data.status) updates.status = parsed.data.status
  if (parsed.data.staff_notes !== undefined) updates.staff_notes = parsed.data.staff_notes

  if (Object.keys(updates).length === 1) {
    return NextResponse.json(
      { error: "No updates provided" },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .in("id", parsed.data.ids)
    .eq("org_id", orgId)
    .select("id")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    updated: data?.length ?? 0,
  })
}
