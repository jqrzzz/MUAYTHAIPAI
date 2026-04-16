/**
 * Action registry.
 *
 * Maps mtp_action_tokens.action_type → handler. The POST /api/actions/[token]
 * route consumes the token (atomic) then looks up the handler here and
 * executes with the frozen params.
 *
 * To add a new action:
 *   1. Implement an ActionHandler with a unique `type` string
 *   2. Register it in `registerAction()` below
 *   3. Have the owner AI (or concierge) create a token with that type
 *      via createActionToken(...)
 *   4. Build a confirm-page preview builder in the AI tool (the preview
 *      text is frozen at token creation time)
 */

import type { ActionHandler } from "./types"
import { sendPendingDraftHandler } from "./handlers/send-pending-draft"

const handlers = new Map<string, ActionHandler>()

function registerAction(handler: ActionHandler): void {
  if (handlers.has(handler.type)) {
    throw new Error(`Duplicate action type registered: ${handler.type}`)
  }
  handlers.set(handler.type, handler)
}

// --- Registered actions ---------------------------------------------------
registerAction(sendPendingDraftHandler)

export function getActionHandler(type: string): ActionHandler | undefined {
  return handlers.get(type)
}

export function listActionTypes(): string[] {
  return Array.from(handlers.keys())
}
