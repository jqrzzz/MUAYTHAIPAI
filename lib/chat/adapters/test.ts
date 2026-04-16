/**
 * In-memory test adapter.
 *
 * Lets us exercise the chat engine end-to-end without touching any real
 * external channel. Outbound messages land in an in-process ring buffer
 * that tests (and the /api/webhooks/test route) can drain.
 *
 * Auth model:
 *   - verifySignature() checks a shared TEST_WEBHOOK_SECRET in the
 *     `x-test-secret` header. If the env var is unset, signature is
 *     rejected (fail closed) — we never want this adapter accidentally
 *     open to the public in production.
 *
 * NOT for production use. This adapter only exists to smoke-test the
 * engine + AI pipeline locally and in CI.
 */

import crypto from "node:crypto"
import type {
  ChannelAdapter,
  IncomingMessage,
  OutgoingMessage,
  SendResult,
} from "../types"

type TestOutbound = {
  externalChatId: string
  message: OutgoingMessage
  sentAt: string
}

// Module-scope ring buffer. Last 100 sends kept for inspection.
const MAX_BUFFER = 100
const outboundBuffer: TestOutbound[] = []

export function drainTestOutbox(): TestOutbound[] {
  const copy = outboundBuffer.slice()
  outboundBuffer.length = 0
  return copy
}

export function peekTestOutbox(): TestOutbound[] {
  return outboundBuffer.slice()
}

export const testAdapter: ChannelAdapter = {
  channel: "test",

  /**
   * Expected shape:
   *   {
   *     externalChatId: string,
   *     externalSenderId: string,
   *     text: string,
   *     isDirectMessage?: boolean,
   *     externalMessageId?: string,
   *     senderDisplayName?: string,
   *     receiverAccountId?: string,  // for testing auto-bind routing
   *   }
   *
   * Or an array of the above for batch-testing.
   */
  parse(raw: unknown): IncomingMessage[] {
    if (!raw) return []
    const items = Array.isArray(raw) ? raw : [raw]
    const messages: IncomingMessage[] = []

    for (const item of items) {
      if (!item || typeof item !== "object") continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = item as any
      if (typeof r.externalChatId !== "string" || !r.externalChatId) continue
      if (typeof r.externalSenderId !== "string" || !r.externalSenderId) {
        continue
      }
      if (typeof r.text !== "string") continue

      messages.push({
        platform: "test",
        externalChatId: r.externalChatId,
        externalSenderId: r.externalSenderId,
        senderDisplayName: r.senderDisplayName,
        text: r.text,
        isDirectMessage:
          typeof r.isDirectMessage === "boolean" ? r.isDirectMessage : true,
        externalMessageId:
          typeof r.externalMessageId === "string"
            ? r.externalMessageId
            : `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        receiverAccountId:
          typeof r.receiverAccountId === "string"
            ? r.receiverAccountId
            : undefined,
        rawUpdate: r,
        receivedAt: new Date().toISOString(),
      })
    }

    return messages
  },

  verifySignature(_rawBody: string, headers: Headers): boolean {
    const expected = process.env.TEST_WEBHOOK_SECRET
    if (!expected) return false
    const got = headers.get("x-test-secret")
    if (!got) return false
    try {
      const a = Buffer.from(expected)
      const b = Buffer.from(got)
      return a.length === b.length && crypto.timingSafeEqual(a, b)
    } catch {
      return false
    }
  },

  async send(
    externalChatId: string,
    message: OutgoingMessage,
  ): Promise<SendResult> {
    outboundBuffer.push({
      externalChatId,
      message,
      sentAt: new Date().toISOString(),
    })
    while (outboundBuffer.length > MAX_BUFFER) outboundBuffer.shift()

    return {
      ok: true,
      externalMessageId: `test-out-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    }
  },
}
