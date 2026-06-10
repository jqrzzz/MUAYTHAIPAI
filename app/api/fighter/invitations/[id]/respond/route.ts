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
import { EmailService } from "@/lib/email-service"
import { notifyInvitationResponded } from "@/lib/notifications"
import { ockockUrl } from "@/lib/ockock/url"

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

  if (!inv.fighter_id) {
    return NextResponse.json({ error: "Not your invitation" }, { status: 403 })
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
    sendResponseEmailBestEffort(supabase, invitationId, "accepted", null).catch(
      (err) => console.warn("[invitations.respond] email send failed:", err),
    )
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
  sendResponseEmailBestEffort(supabase, invitationId, "declined", reason).catch(
    (err) => console.warn("[invitations.respond] email send failed:", err),
  )
  return NextResponse.json({ ok: true, status: "declined" })
}

// Notify the promoter that the fighter responded. Pulls everything the
// email template needs in one round trip and fires the send fire-and-
// forget so a Resend hiccup doesn't roll back the response itself.
async function sendResponseEmailBestEffort(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  invitationId: string,
  action: "accepted" | "declined",
  reason: string | null,
) {
  const { data: inv } = await supabase
    .from("bout_invitations")
    .select(`
      corner,
      invited_by_user_id,
      invited_by_org_id,
      invited_by:users!bout_invitations_invited_by_user_id_fkey (email, full_name),
      fighter:trainer_profiles!bout_invitations_fighter_id_fkey (display_name),
      bout:event_bouts!bout_invitations_bout_id_fkey (
        event_id,
        event:fight_events!event_bouts_event_id_fkey (name, org_id)
      )
    `)
    .eq("id", invitationId)
    .maybeSingle()
  if (!inv) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invitedBy = Array.isArray((inv as any).invited_by)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (inv as any).invited_by[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (inv as any).invited_by
  const promoterEmail = invitedBy?.email
  if (!promoterEmail) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fighter = Array.isArray((inv as any).fighter)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (inv as any).fighter[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (inv as any).fighter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bout = Array.isArray((inv as any).bout)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (inv as any).bout[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : (inv as any).bout
  const event = Array.isArray(bout?.event) ? bout.event[0] : bout?.event
  const eventId = bout?.event_id
  if (!event || !eventId) return

  await EmailService.getInstance().sendBoutInvitationResponseEmail({
    promoterEmail,
    promoterName: invitedBy?.full_name ?? null,
    fighterName: fighter?.display_name || "Fighter",
    action,
    declineReason: reason,
    eventName: event.name || "Fight event",
    corner: inv.corner === "blue" ? "blue" : "red",
    editorUrl: ockockUrl(`/promoter/events/${eventId}`),
  })

  // Bell-ping the promoting gym too so the dashboard surfaces the
  // response in real time. Email lands in the inbox; the bell badge
  // ensures it's visible the next time they open /admin or /ockock/
  // promoter. Fire-and-forget — email already shipped above.
  const orgId = (inv as { invited_by_org_id?: string }).invited_by_org_id
  if (orgId) {
    notifyInvitationResponded({
      orgId,
      eventId,
      eventName: event.name || "Fight event",
      fighterName: fighter?.display_name || "Fighter",
      action,
      declineReason: reason,
    }).catch((err) => {
      console.warn("[invitations.respond] notification failed:", err)
    })
  }
}
