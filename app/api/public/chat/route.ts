/**
 * POST /api/public/chat
 *
 * Public chat endpoint for the OckOck website widget. No auth required —
 * visitors are anonymous, identified by a client-generated sessionId
 * stored in localStorage.
 *
 * Flow:
 *   1. Resolve org from slug
 *   2. Find or create a conversation (channel=web)
 *   3. Log the inbound message
 *   4. Load gym knowledge + conversation history
 *   5. Run concierge AI (with tools: services, schedule, FAQs, escalate)
 *   6. Log the outbound response
 *   7. Return the reply inline
 *
 * Conversations appear in the admin inbox like any other channel.
 */

import { createClient } from "@supabase/supabase-js"
import { loadGymKnowledge } from "@/lib/chat/knowledge"
import {
  runConciergeAI,
  type ConciergeHistoryEntry,
} from "@/lib/chat/ai/concierge"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY = 30

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase credentials")
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { orgSlug, sessionId, message } = body as {
    orgSlug?: string
    sessionId?: string
    message?: string
  }

  if (!orgSlug || !sessionId || !message?.trim()) {
    return NextResponse.json(
      { error: "orgSlug, sessionId, and message are required" },
      { status: 400 },
    )
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` },
      { status: 400 },
    )
  }

  const supabase = getServiceClient()

  // 1. Resolve org
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle()

  if (!org) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  // 2. Find the public_inbox group
  const { data: group } = await supabase
    .from("mtp_chat_groups")
    .select("id")
    .eq("org_id", org.id)
    .eq("purpose", "public_inbox")
    .eq("is_active", true)
    .maybeSingle()

  if (!group) {
    return NextResponse.json(
      { error: "Chat is not set up for this gym yet" },
      { status: 503 },
    )
  }

  // 3. Find or create conversation
  const threadId = `web:${sessionId}`

  let { data: convo } = await supabase
    .from("mtp_conversations")
    .select("id")
    .eq("org_id", org.id)
    .eq("channel", "web")
    .eq("external_thread_id", threadId)
    .maybeSingle()

  if (!convo) {
    const { data: created, error: createErr } = await supabase
      .from("mtp_conversations")
      .insert({
        org_id: org.id,
        group_id: group.id,
        channel: "web",
        external_thread_id: threadId,
        status: "open",
      })
      .select("id")
      .single()

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }
    convo = created
  }

  const now = new Date().toISOString()

  // 4. Log inbound message
  await supabase.from("mtp_communication_log").insert({
    org_id: org.id,
    conversation_id: convo.id,
    channel: "web",
    direction: "inbound",
    sender: sessionId,
    body: message.trim(),
    handled_by: null,
    draft_status: null,
    needs_review: false,
    created_at: now,
  })

  // 5. Load knowledge + history
  const [kb, historyRes] = await Promise.all([
    loadGymKnowledge(supabase, org.id),
    supabase
      .from("mtp_communication_log")
      .select("direction, body")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY),
  ])

  const history: ConciergeHistoryEntry[] = (historyRes.data ?? [])
    .slice()
    .reverse()
    .slice(0, -1) // exclude the message we just inserted
    .map((r: { direction: string; body: string }) => ({
      direction: r.direction as "inbound" | "outbound",
      body: r.body,
    }))

  const isFirstMessage = history.length === 0

  // 6. Run concierge AI
  let replyText = "Sawadee! Thanks for reaching out — let me look into that for you."
  let escalated = false

  if (kb) {
    try {
      const result = await runConciergeAI({
        kb,
        userMessage: message.trim(),
        history,
        isBoundUser: false,
        isFirstMessage,
      })

      if (result.replyText) replyText = result.replyText
      if (result.escalated) escalated = true
    } catch (err) {
      console.error("[public/chat] AI error:", err)
    }
  }

  // 7. Log outbound response
  await supabase.from("mtp_communication_log").insert({
    org_id: org.id,
    conversation_id: convo.id,
    channel: "web",
    direction: "outbound",
    recipient: sessionId,
    body: replyText,
    handled_by: "ai",
    draft_status: "approved",
    needs_review: false,
    created_at: new Date().toISOString(),
  })

  // 8. Update conversation
  await supabase
    .from("mtp_conversations")
    .update({
      status: escalated ? "awaiting_human" : "open",
      last_message_at: now,
      last_message_preview: replyText.slice(0, 120),
      updated_at: new Date().toISOString(),
    })
    .eq("id", convo.id)

  return NextResponse.json({
    reply: replyText,
    conversationId: convo.id,
    escalated,
  })
}
