/**
 * Action token + handler types.
 *
 * An action token is a signed, time-limited, single-use authorization for
 * the AI to propose a write action. The owner confirms it via a deeplink
 * rendered in the authenticated web console. This keeps the AI writing
 * nothing autonomously while still feeling like one-tap approval in chat.
 *
 * Flow:
 *   1. Owner AI tool creates the token (server-side, service role).
 *   2. Tool returns the deeplink URL in its response.
 *   3. AI includes the deeplink in its chat reply to the owner.
 *   4. Owner opens the link in a browser, authenticates (existing session),
 *      reviews the frozen preview, taps Confirm.
 *   5. POST /api/actions/[token] consumes the token and dispatches to
 *      the registered handler. Result is stored on the token row.
 *
 * Invariants:
 *   - params are frozen at create time. The confirm step must never
 *     re-read any AI reasoning.
 *   - The authenticated user on the confirm request MUST equal the
 *     token's user_id. Otherwise reject.
 *   - Double-submit safety: consumed_at is set atomically via UPDATE
 *     ... WHERE consumed_at IS NULL.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export type ActionHandlerResult =
  | { ok: true; result?: Record<string, unknown> }
  | { ok: false; error: string }

export type ActionHandler = {
  /** mtp_action_tokens.action_type value. Must be unique. */
  type: string
  /** Human-readable label for audit logs + UI fallback. */
  label: string
  /**
   * Runs on confirm (POST /api/actions/[token]). Receives the
   * service-role client and the frozen params. Must be idempotent-safe:
   * even though consumeActionToken gates re-entry, transient failures
   * could leave partial state.
   */
  execute(
    supabase: SupabaseClient,
    params: Record<string, unknown>,
    context: { orgId: string; userId: string },
  ): Promise<ActionHandlerResult>
}
