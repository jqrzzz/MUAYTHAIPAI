import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Update booking status (mark arrived, no-show, etc.)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's org membership
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, can_manage_bookings")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (!membership || !membership.can_manage_bookings) {
      return NextResponse.json({ error: "No permission" }, { status: 403 })
    }

    const body = await request.json()
    const { status, payment_status, staff_notes } = body

    // Build update object with only provided fields
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (payment_status) updates.payment_status = payment_status
    if (staff_notes !== undefined) updates.staff_notes = staff_notes

    // Update booking (only if it belongs to user's org)
    const { data, error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", id)
      .eq("org_id", membership.org_id)
      .select()
      .single()

    if (error) {
      console.error("Error updating booking:", error)
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, booking: data })
  } catch (error) {
    console.error("Error in PATCH /api/admin/bookings/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
