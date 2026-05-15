/**
 * POST /api/fighter/invitations/[id]/respond
 *
 * Body: { action: 'accept' | 'decline', reason?: string }
 *
 * Accept:
 *   - Marks the invitation accepted
 *   - Populates event_bouts.fighter_{red,blue}_id so the rest of the
 *     system (public fight page, ticket sales, bout cards) treats the
 *     fighter as confirmed
 *   - The promoter's view auto-reflects on next fetch
 *
 * Decline:
 *   - Marks the invitation declined with an optional reason
 *   - Leaves event_bouts untouched (the corner stays empty / available
 *     for the promoter to invite someone else)
 *
 * RLS ensures only the invited fighter can call this — we double-check
 * fighter_id matches a profile this user owns before performing any
 * mutation to keep the audit trail clean.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: invitationId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const action = body?.action === "accept" ? "accept" : body?.action === "decline" ? "decline" : null
  const reason =
    typeof body?.reason === "string" && body.reason.trim().length > 0
      ? body.reason.trim().slice(0, 500)
      : null
  if (!action) {
    return NextResponse.json(
      { error: "action must be 'accept' or 'decline'" },
      { status: 400 },
    )
  }

  // Load the invitation + verify the current user owns the fighter profile.
  const { data: inv } = await supabase
    .from("bout_invitations")
    .select("id, bout_id, corner, fighter_id, status")
    .eq("id", invitationId)
    .maybeSingle()
  if (!inv) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
  }
  if (inv.status !== "pending") {
    return NextResponse.json(
      { error: `This invitation is already ${inv.status}.` },
      { status: 409 },
    )
  }

  const { data: profile } = await supabase
    .from("trainer_profiles")
    .select("id")
    .eq("id", inv.fighter_id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!profile) {
    return NextResponse.json({ error: "Not your invitation" }, { status: 403 })
  }

  const respondedAt = new Date().toISOString()

  if (action === "accept") {
    // Optimistically write to event_bouts via service role first — this
    // is the part that's expensive to roll back. If the second update
    // fails we leave the bout in the "accepted but inv still pending"
    // state, which is recoverable on retry (idempotent UPDATEs).
    const cornerField = inv.corner === "red" ? "fighter_red_id" : "fighter_blue_id"
    const { error: boutErr } = await supabase
      .from("event_bouts")
      .update({ [cornerField]: inv.fighter_id })
      .eq("id", inv.bout_id)
    if (boutErr) {
      return NextResponse.json(
        { error: `Couldn't update bout: ${boutErr.message}` },
        { status: 500 },
      )
    }

    const { error: invErr } = await supabase
      .from("bout_invitations")
      .update({ status: "accepted", responded_at: respondedAt })
      .eq("id", invitationId)
    if (invErr) {
      return NextResponse.json({ error: invErr.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, status: "accepted" })
  }

  // Decline path — leave event_bouts unchanged.
  const { error: declineErr } = await supabase
    .from("bout_invitations")
    .update({
      status: "declined",
      responded_at: respondedAt,
      decline_reason: reason,
    })
    .eq("id", invitationId)
  if (declineErr) {
    return NextResponse.json({ error: declineErr.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, status: "declined" })
}
