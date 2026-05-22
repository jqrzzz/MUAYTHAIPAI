import { type NextRequest, NextResponse } from "next/server"
import { requireGymStaff } from "@/lib/auth-helpers"

const ALLOWED_STATUS = ["pending", "confirmed", "completed", "cancelled", "no_show"]
const ALLOWED_PAYMENT_STATUS = ["pending", "paid", "refunded", "failed"]
const ALLOWED_PAYMENT_METHOD = ["cash", "stripe", "transfer"]

// Update a booking: attendance (status), payment (status/method/amount),
// cancellation, or staff notes. Any gym staff member (owner/admin/trainer)
// can manage bookings — they run the floor and collect cash.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const auth = await requireGymStaff()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase, user, orgId } = auth

    const body = await request.json()
    const { status, payment_status, payment_method, payment_amount_thb, staff_notes } = body

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (status !== undefined) {
      if (!ALLOWED_STATUS.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      updates.status = status
    }
    if (payment_status !== undefined) {
      if (!ALLOWED_PAYMENT_STATUS.includes(payment_status)) {
        return NextResponse.json({ error: "Invalid payment_status" }, { status: 400 })
      }
      updates.payment_status = payment_status
    }
    if (payment_method !== undefined && payment_method !== null) {
      if (!ALLOWED_PAYMENT_METHOD.includes(payment_method)) {
        return NextResponse.json({ error: "Invalid payment_method" }, { status: 400 })
      }
      updates.payment_method = payment_method
    }
    if (payment_amount_thb !== undefined && payment_amount_thb !== null) {
      const amt = Number(payment_amount_thb)
      if (!Number.isFinite(amt) || amt < 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
      }
      updates.payment_amount_thb = Math.round(amt)
    }
    if (staff_notes !== undefined) updates.staff_notes = staff_notes

    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .eq("org_id", orgId)
      .select()
      .single()

    if (error) {
      console.error("Error updating booking:", error)
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Best-effort cash audit: stamp who/when when payment is marked collected.
    // These columns come from migration 070 — if it isn't applied yet the
    // error is ignored so the core update above never regresses.
    if (payment_status === "paid") {
      await supabase
        .from("bookings")
        .update({ payment_collected_at: new Date().toISOString(), payment_collected_by: user.id })
        .eq("id", id)
        .eq("org_id", orgId)
    }

    return NextResponse.json({ success: true, booking: data })
  } catch (error) {
    console.error("Error in PATCH /api/admin/bookings/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
