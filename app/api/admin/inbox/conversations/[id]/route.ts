/**
 * GET /api/admin/inbox/conversations/[id]
 *
 * Returns the full thread for one conversation: all messages (inbound,
 * outbound, and pending/approved/rejected AI drafts) in chronological
 * order, plus the conversation header + participant summary.
 *
 * Message count is capped at 200 (oldest→newest of the most recent 200
 * rows) — enough for any live thread without blowing up the payload.
 *
 * POST /api/admin/inbox/conversations/[id]
 *
 * Body: { status?: 'open' | 'awaiting_human' | 'closed' }
 *
 * Allows owner/admin to transition conversation status (e.g. mark
 * resolved → 'closed', reopen → 'open'). RLS on mtp_conversations
 * only lets owner/admin update, so the API just forwards the update.
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteParams = { params: { id: string } }

const MAX_MESSAGES = 200
const ALLOWED_STATUSES = new Set(["open", "awaiting_human", "closed"])

export async function GET(_req: Request, { params }: RouteParams) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: "No organization" }, { status: 403 })
  }

  const conversationId = params.id
  if (!conversationId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const { data: convo, error: convoErr } = await supabase
    .from("mtp_conversations")
    .select(
      `id, channel, external_thread_id, status, assigned_to, language,
       last_message_at, last_message_preview, group_id, org_id,
       mtp_chat_groups!inner(id, name, purpose)`,
    )
    .eq("id", conversationId)
    .eq("org_id", membership.org_id)
    .maybeSingle()

  if (convoErr) {
    return NextResponse.json({ error: convoErr.message }, { status: 500 })
  }
  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Fetch most recent MAX_MESSAGES and reverse to chronological order.
  const { data: rows, error: msgErr } = await supabase
    .from("mtp_communication_log")
    .select(
      `id, channel, direction, sender, recipient, body, metadata,
       handled_by, needs_review, draft_status, external_message_id,
       created_at`,
    )
    .eq("org_id", membership.org_id)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MAX_MESSAGES)

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 })
  }

  const messages = (rows ?? []).slice().reverse()

  // Pull participant display names from mtp_chat_group_members so the UI
  // can render "Nun" instead of a bare LINE userId.
  const { data: members } = await supabase
    .from("mtp_chat_group_members")
    .select("channel_user_id, display_name, role, user_id")
    .eq("group_id", convo.group_id)
    .eq("channel", convo.channel)

  const group = Array.isArray(convo.mtp_chat_groups)
    ? convo.mtp_chat_groups[0]
    : convo.mtp_chat_groups

  return NextResponse.json({
    conversation: {
      id: convo.id,
      channel: convo.channel,
      externalThreadId: convo.external_thread_id,
      status: convo.status,
      assignedTo: convo.assigned_to,
      language: convo.language,
      lastMessageAt: convo.last_message_at,
      lastMessagePreview: convo.last_message_preview,
      group,
    },
    participants: members ?? [],
    messages,
  })
}

export async function POST(request: Request, { params }: RouteParams) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: "No organization" }, { status: 403 })
  }
  if (!["owner", "admin"].includes(String(membership.role))) {
    return NextResponse.json(
      { error: "Forbidden: owner or admin required" },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const { status } = body as { status?: string }

  if (!status || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 },
    )
  }

  const { data: updated, error } = await supabase
    .from("mtp_conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("org_id", membership.org_id)
    .select("id, status")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ conversation: updated })
}
