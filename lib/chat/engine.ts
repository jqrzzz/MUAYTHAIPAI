/**
 * Channel-agnostic chat engine.
 *
 * Webhook handlers call `handleMessage(normalized, adapter)` fire-and-forget
 * after returning 200 OK to the channel. This function:
 *
 *   1. Dedups on external_message_id
 *   2. Resolves tenant (org_id) via mtp_chat_group_members binding
 *   3. Upserts the conversation
 *   4. Persists the inbound message to mtp_communication_log
 *   5. Runs the AI pipeline (concierge 8b; owner AI 8c; staff = no AI)
 *   6. Persists the outbound message + sends via adapter
 *   7. Updates conversation status on escalation
 *
 * Contract: MUST NOT throw. Errors are caught, logged, and returned
 * as `HandleMessageResult.error` so fire-and-forget callers don't
 * silently drop exceptions.
 */

import { createClient } from "@supabase/supabase-js"
import { runConciergeAI, type ConciergeHistoryEntry } from "./ai/concierge"
import { runOwnerAI, type OwnerAIHistoryEntry } from "./ai/owner"
import { loadGymKnowledge } from "./knowledge"
import type {
  ChannelAdapter,
  HandleMessageResult,
  IncomingMessage,
} from "./types"

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      "[chat/engine] Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
    )
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function handleMessage(
  msg: IncomingMessage,
  adapter: ChannelAdapter,
): Promise<HandleMessageResult> {
  const empty: HandleMessageResult = {
    conversationId: "",
    messageLogId: "",
    aiHandled: false,
    escalated: false,
  }

  try {
    const supabase = getServiceClient()

    // 1. Dedup by external_message_id (channels retry on non-200)
    if (msg.externalMessageId) {
      const { data: existing } = await supabase
        .from("mtp_communication_log")
        .select("id, conversation_id")
        .eq("channel", msg.platform)
        .eq("external_message_id", msg.externalMessageId)
        .eq("direction", "inbound")
        .maybeSingle()

      if (existing) {
        return {
          ...empty,
          conversationId: existing.conversation_id,
          messageLogId: existing.id,
          error: "duplicate",
        }
      }
    }

    // 2. Resolve sender → member → group → org
    const { data: member } = await supabase
      .from("mtp_chat_group_members")
      .select(
        "id, group_id, user_id, role, mtp_chat_groups!inner(org_id, purpose, is_active)",
      )
      .eq("channel", msg.platform)
      .eq("channel_user_id", msg.externalSenderId)
      .eq("channel_chat_id", msg.externalChatId)
      .maybeSingle()

    if (!member) {
      // No binding yet. Auto-binding anonymous visitors to a gym's
      // public_inbox group on first contact happens in the webhook
      // layer (Wave 8e) once we know which group owns which LINE OA
      // channel credential. Until then, unrecognized senders are
      // logged and dropped so we never leak one gym's data into
      // another's conversation.
      console.warn("[chat/engine] Unrecognized sender", {
        platform: msg.platform,
        externalSenderId: msg.externalSenderId,
        externalChatId: msg.externalChatId,
      })
      return { ...empty, error: "unrecognized_sender" }
    }

    const group = Array.isArray(member.mtp_chat_groups)
      ? member.mtp_chat_groups[0]
      : member.mtp_chat_groups
    if (!group || !group.is_active) {
      return { ...empty, error: "inactive_group" }
    }

    const orgId = group.org_id as string
    const purpose = group.purpose as string

    // 3. Upsert conversation
    let conversationId: string
    const { data: existingConvo } = await supabase
      .from("mtp_conversations")
      .select("id")
      .eq("channel", msg.platform)
      .eq("external_thread_id", msg.externalChatId)
      .maybeSingle()

    if (existingConvo) {
      conversationId = existingConvo.id
    } else {
      const { data: newConvo, error: convoErr } = await supabase
        .from("mtp_conversations")
        .insert({
          org_id: orgId,
          group_id: member.group_id,
          channel: msg.platform,
          external_thread_id: msg.externalChatId,
          status: "open",
          last_message_at: msg.receivedAt,
          last_message_preview: msg.text.slice(0, 200),
        })
        .select("id")
        .single()

      if (convoErr || !newConvo) {
        throw new Error(`create conversation failed: ${convoErr?.message}`)
      }
      conversationId = newConvo.id
    }

    // 4. Persist inbound
    const { data: logRow, error: logErr } = await supabase
      .from("mtp_communication_log")
      .insert({
        org_id: orgId,
        conversation_id: conversationId,
        channel: msg.platform,
        direction: "inbound",
        sender: msg.externalSenderId,
        body: msg.text,
        metadata: {
          raw: msg.rawUpdate,
          attachments: msg.attachments ?? [],
          sender_display_name: msg.senderDisplayName,
          is_direct_message: msg.isDirectMessage,
        },
        external_message_id: msg.externalMessageId,
      })
      .select("id")
      .single()

    if (logErr || !logRow) {
      throw new Error(`log inbound failed: ${logErr?.message}`)
    }

    const messageLogId = logRow.id

    // Refresh conversation last_message_* (skip for first insert, already set)
    if (existingConvo) {
      await supabase
        .from("mtp_conversations")
        .update({
          last_message_at: msg.receivedAt,
          last_message_preview: msg.text.slice(0, 200),
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
    }

    // 5. Run AI
    //    - public_inbox → concierge (Wave 8b)
    //    - owner_assist → owner AI, but only for bound owner/admin
    //                      members (Wave 8c)
    //    - staff        → no AI (human-only channel)
    let aiResult: AIOutput
    if (purpose === "public_inbox") {
      aiResult = await runConciergeForConversation({
        supabase,
        orgId,
        conversationId,
        userMessage: msg.text,
        isBoundUser: !!member.user_id,
        isFirstMessage: !existingConvo,
      })
    } else if (purpose === "owner_assist") {
      // Safety: owner AI only answers bound owner/admin members.
      // Strangers posting into an owner_assist group are logged and
      // dropped — never answered.
      if (
        !member.user_id ||
        !["owner", "admin"].includes(String(member.role))
      ) {
        console.warn(
          "[chat/engine] owner_assist message from non-owner/admin; dropping",
          { memberRole: member.role, bound: !!member.user_id },
        )
        aiResult = {}
      } else {
        aiResult = await runOwnerAIForConversation({
          supabase,
          orgId,
          conversationId,
          userId: member.user_id as string,
          userMessage: msg.text,
        })
      }
    } else {
      // staff channel: no AI, just log the message
      aiResult = {}
    }

    // 6. Persist outbound + send via adapter
    if (aiResult.replyText) {
      const { data: outboundRow } = await supabase
        .from("mtp_communication_log")
        .insert({
          org_id: orgId,
          conversation_id: conversationId,
          channel: msg.platform,
          direction: "outbound",
          recipient: msg.externalSenderId,
          body: aiResult.replyText,
          metadata: { ai_meta: aiResult.meta ?? {} },
          handled_by: "ai",
          needs_review: aiResult.needsReview ?? false,
        })
        .select("id")
        .single()

      const sendResult = await adapter.send(msg.externalChatId, {
        text: aiResult.replyText,
        replyToExternalMessageId: msg.externalMessageId,
      })

      if (sendResult.ok && sendResult.externalMessageId && outboundRow) {
        await supabase
          .from("mtp_communication_log")
          .update({ external_message_id: sendResult.externalMessageId })
          .eq("id", outboundRow.id)
      } else if (!sendResult.ok) {
        console.error("[chat/engine] adapter send failed:", sendResult.error)
      }
    }

    // 7. Escalation bookkeeping
    if (aiResult.escalated) {
      await supabase
        .from("mtp_conversations")
        .update({ status: "awaiting_human" })
        .eq("id", conversationId)
    }

    return {
      conversationId,
      messageLogId,
      aiHandled: !!aiResult.replyText && !aiResult.escalated,
      escalated: !!aiResult.escalated,
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error("[chat/engine] handleMessage error:", errMsg)
    return { ...empty, error: errMsg }
  }
}

// ---------------------------------------------------------------------------
// AI routing helpers
// ---------------------------------------------------------------------------

type AIOutput = {
  replyText?: string
  escalated?: boolean
  needsReview?: boolean
  meta?: Record<string, unknown>
}

const HISTORY_TURN_LIMIT = 20

async function runConciergeForConversation(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
  orgId: string
  conversationId: string
  userMessage: string
  isBoundUser: boolean
  isFirstMessage: boolean
}): Promise<AIOutput> {
  const { supabase, orgId, conversationId, userMessage } = params

  // Load KB + history in parallel.
  const [kb, historyRes] = await Promise.all([
    loadGymKnowledge(supabase, orgId),
    supabase
      .from("mtp_communication_log")
      .select("direction, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_TURN_LIMIT),
  ])

  if (!kb) {
    console.warn("[chat/engine] KB load returned null for org", orgId)
    return { replyText: undefined }
  }

  // Reverse so history is oldest → newest. Includes the inbound we
  // just persisted, which is what the AI needs as the final turn.
  const history: ConciergeHistoryEntry[] = ((historyRes.data ?? []) as Array<{
    direction: "inbound" | "outbound"
    body: string
  }>)
    .slice()
    .reverse()
    .map((r) => ({ direction: r.direction, body: r.body }))

  return runConciergeAI({
    kb,
    userMessage,
    history,
    isBoundUser: params.isBoundUser,
    isFirstMessage: params.isFirstMessage,
  })
}

async function runOwnerAIForConversation(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
  orgId: string
  conversationId: string
  userId: string
  userMessage: string
}): Promise<AIOutput> {
  const { supabase, orgId, conversationId, userId, userMessage } = params

  // Look up org name + the owner's display name + recent thread.
  const [{ data: org }, { data: profile }, historyRes] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", orgId).maybeSingle(),
    supabase
      .from("users")
      .select("display_name, full_name")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("mtp_communication_log")
      .select("direction, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_TURN_LIMIT),
  ])

  const history: OwnerAIHistoryEntry[] = ((historyRes.data ?? []) as Array<{
    direction: "inbound" | "outbound"
    body: string
  }>)
    .slice()
    .reverse()
    .map((r) => ({ direction: r.direction, body: r.body }))

  return runOwnerAI({
    supabase,
    orgId,
    orgName: org?.name ?? "the gym",
    userId,
    ownerDisplayName: profile?.display_name ?? profile?.full_name ?? null,
    ownerConversationId: conversationId,
    userMessage,
    history,
  })
}
