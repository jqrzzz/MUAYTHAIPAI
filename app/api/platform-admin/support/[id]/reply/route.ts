/**
 * POST /api/platform-admin/support/[id]/reply
 *   body: { body, mark_status?: 'in_progress'|'resolved' }
 *
 * Operator approves/edits the AI draft (or writes from scratch). We:
 *   - Mark any existing pending draft on this conversation as 'approved'
 *     (so the gym admin's "draft pending" indicator disappears)
 *   - Insert the operator's outbound message as a normal log entry
 *   - Update the ticket status (default → in_progress, or resolved if asked)
 *
 * Note: this v1 doesn't actually email the gym admin. The reply lands in
 * their /admin support inbox (which we'll surface in a future commit).
 * For now they see it via the ticket status flipping + we can email
 * separately if Resend/SendGrid is wired up.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { getPlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BodySchema = z.object({
  body: z.string().trim().min(1).max(8000),
  mark_status: z.enum(["in_progress", "waiting_customer", "resolved"]).optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { supabase, isPlatformAdmin, user } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { body, mark_status = "in_progress" } = parsed.data

  // Pull the ticket so we know which conversation to write to + who to recipient
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select(`
      id, org_id, conversation_id, user_id, status,
      users:user_id (email)
    `)
    .eq("id", id)
    .single()

  if (!ticket || !ticket.conversation_id) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recipientEmail = ((ticket as any).users?.email ?? null) as string | null

  // Mark any pending AI draft on this thread as approved — removes the
  // "draft pending" indicator without leaving an orphan record.
  await supabase
    .from("mtp_communication_log")
    .update({ draft_status: "approved" })
    .eq("conversation_id", ticket.conversation_id)
    .eq("draft_status", "pending")

  // Insert the operator's reply
  const now = new Date().toISOString()
  await supabase.from("mtp_communication_log").insert({
    org_id: ticket.org_id,
    conversation_id: ticket.conversation_id,
    channel: "web",
    direction: "outbound",
    recipient: recipientEmail,
    body,
    handled_by: "human",
    draft_status: "approved",
    needs_review: false,
    metadata: {
      support_ticket: true,
      ticket_id: id,
      replied_by: user?.id,
    },
    created_at: now,
  })

  // Update ticket workflow + conversation last-message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ticketUpdate: Record<string, any> = { status: mark_status }
  if (mark_status === "resolved") {
    ticketUpdate.resolved_at = now
    ticketUpdate.resolved_by = user?.id ?? null
  }
  await supabase.from("support_tickets").update(ticketUpdate).eq("id", id)

  await supabase
    .from("mtp_conversations")
    .update({
      last_message_at: now,
      last_message_preview: body.slice(0, 120),
      status: mark_status === "resolved" ? "closed" : "open",
    })
    .eq("id", ticket.conversation_id)

  return NextResponse.json({ ok: true })
}
