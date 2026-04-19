/**
 * POST /api/admin/inbox/conversations/[id]/reply
 *
 * Sends a human-composed reply on behalf of the gym owner/admin. The
 * message is written to mtp_communication_log as a `handled_by='human'`
 * outbound row, then dispatched via the channel adapter. On success,
 * the external_message_id is stamped and the conversation's
 * last_message_* fields are bumped.
 *
 * This is the counterpart to the draft approve endpoint — same shape,
 * but for messages the owner types themselves.
 *
 * Auth: owner or admin. Trainers can read but not send on the gym's
 * behalf — same constraint as draft approval.
 */

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { lineAdapter } from "@/lib/chat/adapters/line"
import { telegramAdapter } from "@/lib/chat/adapters/telegram"
import { testAdapter } from "@/lib/chat/adapters/test"
import { whatsappAdapter } from "@/lib/chat/adapters/whatsapp"
import type { ChannelAdapter } from "@/lib/chat/types"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteParams = { params: { id: string } }

const adapters: Partial<Record<string, ChannelAdapter>> = {
  line: lineAdapter,
  telegram: telegramAdapter,
  whatsapp: whatsappAdapter,
  test: testAdapter,
}

const MAX_REPLY_LEN = 4000

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase service credentials")
  }
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(request: Request, { params }: RouteParams) {
  const ssr = await createServerClient()

  const {
    data: { user },
  } = await ssr.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await ssr
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

  const conversationId = params.id
  if (!conversationId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const text = typeof body?.text === "string" ? body.text.trim() : ""
  if (!text) {
    return NextResponse.json({ error: "Empty reply" }, { status: 400 })
  }
  if (text.length > MAX_REPLY_LEN) {
    return NextResponse.json(
      { error: `Reply exceeds ${MAX_REPLY_LEN} chars` },
      { status: 400 },
    )
  }

  let service
  try {
    service = getServiceClient()
  } catch (err) {
    console.error("[api/admin/inbox] service client unavailable:", err)
    return NextResponse.json(
      { error: "service_unavailable" },
      { status: 500 },
    )
  }

  const { data: convo } = await service
    .from("mtp_conversations")
    .select("id, org_id, channel, external_thread_id")
    .eq("id", conversationId)
    .eq("org_id", membership.org_id)
    .maybeSingle()

  if (!convo) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  const adapter = adapters[convo.channel]
  if (!adapter) {
    return NextResponse.json(
      { error: `Channel adapter unavailable: ${convo.channel}` },
      { status: 400 },
    )
  }

  // Insert the outbound row first (pessimistic — we want the attempt
  // logged even if the adapter send fails, so the owner can retry).
  const { data: outboundRow, error: insertErr } = await service
    .from("mtp_communication_log")
    .insert({
      org_id: membership.org_id,
      conversation_id: convo.id,
      channel: convo.channel,
      direction: "outbound",
      recipient: convo.external_thread_id,
      body: text,
      handled_by: "human",
      needs_review: false,
      metadata: { sent_by_user_id: user.id },
    })
    .select("id")
    .single()

  if (insertErr || !outboundRow) {
    return NextResponse.json(
      { error: insertErr?.message ?? "log_insert_failed" },
      { status: 500 },
    )
  }

  const sendResult = await adapter.send(convo.external_thread_id, { text })

  if (!sendResult.ok) {
    // Mark the row for review so the owner sees it failed.
    await service
      .from("mtp_communication_log")
      .update({ needs_review: true, metadata: { send_error: sendResult.error } })
      .eq("id", outboundRow.id)

    return NextResponse.json(
      { error: sendResult.error ?? "send_failed", log_id: outboundRow.id },
      { status: 502 },
    )
  }

  if (sendResult.externalMessageId) {
    await service
      .from("mtp_communication_log")
      .update({ external_message_id: sendResult.externalMessageId })
      .eq("id", outboundRow.id)
  }

  // Bump conversation last_message_* + reopen if it was awaiting_human.
  await service
    .from("mtp_conversations")
    .update({
      status: "open",
      last_message_at: new Date().toISOString(),
      last_message_preview: text.slice(0, 200),
      updated_at: new Date().toISOString(),
    })
    .eq("id", convo.id)
    .eq("org_id", membership.org_id)

  return NextResponse.json({
    ok: true,
    log_id: outboundRow.id,
    external_message_id: sendResult.externalMessageId ?? null,
  })
}
