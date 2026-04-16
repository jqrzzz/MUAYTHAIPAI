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
    let member = await resolveMember(supabase, msg)

    if (!member) {
      // No existing binding. Try to auto-bind this sender as a visitor
      // to a gym's public_inbox group, using the channel routing table
      // (mtp_chat_group_channels). Owner_assist and staff groups are
      // never auto-bound — strangers posting into those would be a
      // privacy leak — so we drop unless we resolve to a public_inbox.
      const bound = await autoBindVisitor(supabase, msg)
      if (!bound) {
        console.warn("[chat/engine] Unrecognized sender, no route", {
          platform: msg.platform,
          externalSenderId: msg.externalSenderId,
          externalChatId: msg.externalChatId,
          receiverAccountId: msg.receiverAccountId,
        })
        return { ...empty, error: "unrecognized_sender" }
      }
      member = bound
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

// ---------------------------------------------------------------------------
// Member resolution + auto-bind helpers (Wave 9b)
// ---------------------------------------------------------------------------

/**
 * Shape returned by the member lookup. Extracted so the auto-bind path
 * can return the same shape as the primary lookup without drift.
 */
type ResolvedMember = {
  id: string
  group_id: string
  user_id: string | null
  role: string
  mtp_chat_groups:
    | { org_id: string; purpose: string; is_active: boolean }
    | Array<{ org_id: string; purpose: string; is_active: boolean }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveMember(supabase: any, msg: IncomingMessage) {
  const { data } = await supabase
    .from("mtp_chat_group_members")
    .select(
      "id, group_id, user_id, role, mtp_chat_groups!inner(org_id, purpose, is_active)",
    )
    .eq("channel", msg.platform)
    .eq("channel_user_id", msg.externalSenderId)
    .eq("channel_chat_id", msg.externalChatId)
    .maybeSingle()
  return data as ResolvedMember | null
}

/**
 * First-contact routing. Given an unrecognized sender, find the
 * public_inbox chat_group that owns the channel account they wrote to,
 * then persist a visitor member row so future messages resolve directly.
 *
 * Lookup order:
 *   1. (channel, receiverAccountId) exact match on mtp_chat_group_channels
 *   2. Fallback: if receiverAccountId is missing AND exactly one active
 *      public_inbox channel row exists for this channel deployment-wide,
 *      use it. This is the single-gym bootstrap path — the moment a
 *      second gym registers, ambiguity is caught and we drop instead.
 *
 * Returns null if:
 *   - no routing row matches
 *   - the matched group is not public_inbox
 *   - the matched group is inactive
 *   - visitor insert fails
 */
async function autoBindVisitor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  msg: IncomingMessage,
): Promise<ResolvedMember | null> {
  // Step 1: find the channel routing row.
  const channelSelect =
    "group_id, external_account_id, is_active, mtp_chat_groups!inner(org_id, purpose, is_active)"

  let channelRow:
    | {
        group_id: string
        external_account_id: string
        is_active: boolean
        mtp_chat_groups:
          | { org_id: string; purpose: string; is_active: boolean }
          | Array<{ org_id: string; purpose: string; is_active: boolean }>
      }
    | null = null

  if (msg.receiverAccountId) {
    const { data } = await supabase
      .from("mtp_chat_group_channels")
      .select(channelSelect)
      .eq("channel", msg.platform)
      .eq("external_account_id", msg.receiverAccountId)
      .eq("is_active", true)
      .maybeSingle()
    channelRow = data ?? null
  } else {
    // Single-gym bootstrap fallback. Only binds when unambiguous.
    const { data: rows } = await supabase
      .from("mtp_chat_group_channels")
      .select(channelSelect)
      .eq("channel", msg.platform)
      .eq("is_active", true)
      .limit(2)

    if (Array.isArray(rows) && rows.length === 1) {
      // Filter to public_inbox purpose to avoid single-gym bootstrap
      // silently routing into an owner_assist group.
      const only = rows[0]
      const g = Array.isArray(only.mtp_chat_groups)
        ? only.mtp_chat_groups[0]
        : only.mtp_chat_groups
      if (g?.purpose === "public_inbox") {
        channelRow = only
      }
    }
  }

  if (!channelRow) return null

  const group = Array.isArray(channelRow.mtp_chat_groups)
    ? channelRow.mtp_chat_groups[0]
    : channelRow.mtp_chat_groups
  if (!group || !group.is_active) return null
  if (group.purpose !== "public_inbox") return null

  // Step 2: insert a visitor member. UNIQUE (channel, channel_user_id,
  // channel_chat_id) protects against races — if two inbounds arrive
  // concurrently and both try to insert, the second returns a conflict
  // and we re-resolve via resolveMember().
  const { data: inserted, error: insertErr } = await supabase
    .from("mtp_chat_group_members")
    .insert({
      group_id: channelRow.group_id,
      channel: msg.platform,
      channel_user_id: msg.externalSenderId,
      channel_chat_id: msg.externalChatId,
      user_id: null,
      role: "visitor",
      display_name: msg.senderDisplayName ?? null,
    })
    .select("id, group_id, user_id, role")
    .single()

  if (insertErr || !inserted) {
    // Likely a unique-constraint race. Re-resolve to pick up the row
    // the other request just inserted.
    const retry = await resolveMember(supabase, msg)
    if (retry) return retry
    console.error("[chat/engine] autoBindVisitor insert failed:", insertErr?.message)
    return null
  }

  // Best-effort: bump last_inbound_at on the channel row so the
  // admin inbox can surface fresh channels. Non-blocking.
  supabase
    .from("mtp_chat_group_channels")
    .update({ last_inbound_at: msg.receivedAt })
    .eq("channel", msg.platform)
    .eq("external_account_id", channelRow.external_account_id)
    .then(
      () => undefined,
      (e: unknown) => {
        console.warn(
          "[chat/engine] last_inbound_at bump failed:",
          e instanceof Error ? e.message : String(e),
        )
      },
    )

  return {
    id: inserted.id,
    group_id: inserted.group_id,
    user_id: inserted.user_id,
    role: inserted.role,
    mtp_chat_groups: group,
  }
}
