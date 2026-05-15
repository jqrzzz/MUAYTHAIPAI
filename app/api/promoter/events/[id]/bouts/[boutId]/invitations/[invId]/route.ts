/**
 * DELETE /api/promoter/events/[id]/bouts/[boutId]/invitations/[invId]
 *
 * Promoter cancels a pending invitation. We don't hard-delete the row
 * — we mark it cancelled so the fighter (if they happened to be
 * viewing) sees the status change rather than the row disappearing
 * mysteriously. Already-accepted invitations can't be cancelled here;
 * the promoter has to use the picker's "Clear" to unassign the fighter.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; boutId: string; invId: string }> },
) {
  const { id: eventId, boutId, invId } = await params
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const { data: inv } = await supabase
    .from("bout_invitations")
    .select("id, bout_id, status, invited_by_org_id")
    .eq("id", invId)
    .maybeSingle()

  if (!inv) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
  }
  if (inv.bout_id !== boutId) {
    return NextResponse.json({ error: "Bout mismatch" }, { status: 400 })
  }
  if (inv.invited_by_org_id !== auth.orgId) {
    return NextResponse.json({ error: "Not your invitation" }, { status: 403 })
  }
  if (inv.status !== "pending") {
    return NextResponse.json(
      { error: `Can't cancel an invitation that's already ${inv.status}.` },
      { status: 409 },
    )
  }

  const { error } = await supabase
    .from("bout_invitations")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("id", invId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
