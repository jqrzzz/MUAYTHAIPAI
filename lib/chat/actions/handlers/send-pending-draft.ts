/**
 * send_pending_draft handler.
 *
 * Takes a pending draft (communication_log row with draft_status='pending')
 * that the owner AI composed, and sends it for real via the channel
 * adapter.
 *
 * params shape: { draft_id: string }
 *
 * On success:
 *   - draft row: draft_status='approved', external_message_id populated
 *   - conversations.status may transition open→open (unchanged) or
 *     awaiting_human→open when a human/AI reply has gone out
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { lineAdapter } from "../../adapters/line"
import { telegramAdapter } from "../../adapters/telegram"
import { testAdapter } from "../../adapters/test"
import type { ChannelAdapter } from "../../types"
import type { ActionHandler, ActionHandlerResult } from "../types"

// Adapter registry. Add new channels here as they're implemented.
// Channels without adapters (whatsapp, ig, fb, web as of wave 8d)
// will return a clear error so the owner knows why it didn't send.
const adapters: Partial<Record<string, ChannelAdapter>> = {
  line: lineAdapter,
  telegram: telegramAdapter,
  test: testAdapter,
}

export const sendPendingDraftHandler: ActionHandler = {
  type: "send_pending_draft",
  label: "Send drafted reply",

  async execute(
    supabase: SupabaseClient,
    params: Record<string, unknown>,
    context: { orgId: string; userId: string },
  ): Promise<ActionHandlerResult> {
    const draftId = params.draft_id
    if (typeof draftId !== "string" || !draftId) {
      return { ok: false, error: "missing_draft_id" }
    }

    // Load the draft. Scope to context.orgId — tokens are org-bound,
    // so the draft must belong to the same org.
    const { data: draft } = await supabase
      .from("communication_log")
      .select(
        "id, org_id, conversation_id, channel, body, direction, draft_status, recipient",
      )
      .eq("id", draftId)
      .eq("org_id", context.orgId)
      .maybeSingle()

    if (!draft) return { ok: false, error: "draft_not_found" }
    if (draft.direction !== "outbound") {
      return { ok: false, error: "draft_wrong_direction" }
    }
    if (draft.draft_status !== "pending") {
      return {
        ok: false,
        error: `draft_not_pending (status=${draft.draft_status ?? "null"})`,
      }
    }

    // Look up the conversation to get the external thread id.
    const { data: convo } = await supabase
      .from("conversations")
      .select("id, channel, external_thread_id")
      .eq("id", draft.conversation_id)
      .eq("org_id", context.orgId)
      .maybeSingle()

    if (!convo) return { ok: false, error: "conversation_not_found" }

    const adapter = adapters[convo.channel]
    if (!adapter) {
      return {
        ok: false,
        error: `channel_adapter_unavailable:${convo.channel}`,
      }
    }

    const sendResult = await adapter.send(convo.external_thread_id, {
      text: draft.body,
    })

    if (!sendResult.ok) {
      // Leave the draft in pending so the owner can retry.
      return {
        ok: false,
        error: `send_failed: ${sendResult.error ?? "unknown"}`,
      }
    }

    // Approve + stamp the external message id. Also clear needs_review.
    await supabase
      .from("communication_log")
      .update({
        draft_status: "approved",
        needs_review: false,
        handled_by: "human",
        external_message_id: sendResult.externalMessageId ?? null,
      })
      .eq("id", draft.id)

    // If the conversation was waiting on a human, mark it open again.
    await supabase
      .from("conversations")
      .update({
        status: "open",
        last_message_at: new Date().toISOString(),
        last_message_preview: String(draft.body).slice(0, 200),
        updated_at: new Date().toISOString(),
      })
      .eq("id", convo.id)
      .eq("org_id", context.orgId)

    return {
      ok: true,
      result: {
        draft_id: draft.id,
        conversation_id: convo.id,
        channel: convo.channel,
        external_message_id: sendResult.externalMessageId ?? null,
        approved_by: context.userId,
      },
    }
  },
}
