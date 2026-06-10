/**
 * Gym admin replies on an existing support ticket — continues the
 * thread without creating a new ticket.
 *
 * POST /api/admin/support/[id]/reply
 *   body: { body }
 *
 * Inserts an inbound message + flips ticket back to 'open' (the
 * operator now has a new turn). Bumps SLA by the priority's window so
 * the operator has fresh time to respond.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SLA_HOURS: Record<string, number> = {
  urgent: 1, high: 6, normal: 24, low: 72,
}

const BodySchema = z.object({
  body: z.string().trim().min(1).max(4000),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId, user } = auth
  const { id } = await params

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Verify the ticket belongs to this gym
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, conversation_id, status, priority")
    .eq("id", id)
    .eq("org_id", orgId)
    .single()

  if (!ticket || !ticket.conversation_id) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  const now = new Date().toISOString()

  // Insert inbound message
  await supabase.from("mtp_communication_log").insert({
    org_id: orgId,
    conversation_id: ticket.conversation_id,
    channel: "web",
    direction: "inbound",
    sender: user.email ?? user.id,
    body: parsed.data.body,
    handled_by: null,
    draft_status: null,
    needs_review: true,
    metadata: { support_ticket: true, ticket_id: id, follow_up: true },
    created_at: now,
  })

  // Flip back to open + bump SLA so operator has a fresh window
  const slaHours = SLA_HOURS[ticket.priority ?? ""] ?? 24
  await supabase
    .from("support_tickets")
    .update({
      status: "open",
      sla_due_at: new Date(Date.now() + slaHours * 3600 * 1000).toISOString(),
    })
    .eq("id", id)

  await supabase
    .from("mtp_conversations")
    .update({
      last_message_at: now,
      last_message_preview: parsed.data.body.slice(0, 120),
      status: "awaiting_human",
    })
    .eq("id", ticket.conversation_id)

  return NextResponse.json({ ok: true })
}
