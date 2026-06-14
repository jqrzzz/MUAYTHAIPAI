/**
 * Gym admin's view of a single support ticket — full conversation
 * thread including operator replies.
 *
 * GET /api/admin/support/[id]
 *
 * Returns: { ticket, messages }
 *
 * Messages are filtered to hide pending AI drafts (those are for the
 * operator's review, not the gym admin's eyes).
 */
import { NextResponse } from "next/server"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth
  const { id } = await params

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select(`
      id, subject, initial_body, category, priority, status, sla_due_at,
      ai_summary, created_at, resolved_at, conversation_id
    `)
    .eq("id", id)
    .eq("org_id", orgId)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  // Fetch conversation messages — hide pending drafts (those are
  // operator-only state); show approved replies (the operator's
  // responses) + the inbound messages (their own + their replies).
  let messages: Array<{
    id: string
    direction: string
    body: string
    handled_by: string | null
    created_at: string | null
  }> = []
  if (ticket.conversation_id) {
    const { data: msgs } = await supabase
      .from("mtp_communication_log")
      .select("id, direction, body, handled_by, draft_status, created_at")
      .eq("conversation_id", ticket.conversation_id)
      .order("created_at", { ascending: true })
    messages = (msgs ?? [])
      .filter(
        (m) =>
          // Hide outbound AI drafts pending operator approval — gym admin
          // shouldn't see these
          !(m.direction === "outbound" && m.draft_status === "pending"),
      )
      .map((m) => ({
        id: m.id,
        direction: m.direction,
        body: m.body,
        handled_by: m.handled_by,
        created_at: m.created_at,
      }))
  }

  return NextResponse.json({ ticket, messages })
}
