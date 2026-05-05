/**
 * LINE Messaging API adapter.
 *
 * Docs: https://developers.line.biz/en/reference/messaging-api/
 *
 * Credentials (preferred per-gym via mtp_channel_credentials, fall back
 * to env vars for the legacy single-tenant demo path):
 *   channel_secret        ← LINE_CHANNEL_SECRET        — verifies X-Line-Signature
 *   channel_access_token  ← LINE_CHANNEL_ACCESS_TOKEN  — Bearer for push API
 */

import crypto from "node:crypto"
import type {
  ChannelAdapter,
  ChannelCredentials,
  IncomingAttachment,
  IncomingMessage,
  OutgoingMessage,
  SendResult,
} from "../types"

const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push"

export const lineAdapter: ChannelAdapter = {
  channel: "line",

  parse(raw: unknown): IncomingMessage[] {
    if (!raw || typeof raw !== "object") return []
    const payload = raw as { events?: unknown[]; destination?: string }
    if (!Array.isArray(payload.events)) return []

    // LINE delivers all events in one webhook for the same destination
    // (the gym's LINE OA userId). We stamp it on each message so the
    // engine can resolve an unknown sender → the right chat_group.
    const receiverAccountId =
      typeof payload.destination === "string" ? payload.destination : undefined

    const messages: IncomingMessage[] = []

    for (const event of payload.events) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = event as any
      if (e?.type !== "message" || !e.message) continue

      const source = e.source ?? {}
      const sourceType: string = source.type ?? "user"
      const userId: string | undefined = source.userId
      if (!userId) continue

      let externalChatId = ""
      let isDM = false

      if (sourceType === "user") {
        externalChatId = userId
        isDM = true
      } else if (sourceType === "group") {
        externalChatId = source.groupId ?? ""
      } else if (sourceType === "room") {
        externalChatId = source.roomId ?? ""
      } else {
        continue
      }
      if (!externalChatId) continue

      const msgType: string = e.message.type
      let text = ""
      const attachments: IncomingAttachment[] = []

      if (msgType === "text") {
        text = e.message.text ?? ""
      } else if (msgType === "image") {
        attachments.push({
          type: "image",
          data: { line_message_id: e.message.id },
        })
      } else if (msgType === "sticker") {
        attachments.push({
          type: "sticker",
          data: {
            packageId: e.message.packageId,
            stickerId: e.message.stickerId,
          },
        })
      } else if (msgType === "location") {
        attachments.push({
          type: "location",
          data: {
            title: e.message.title,
            address: e.message.address,
            latitude: e.message.latitude,
            longitude: e.message.longitude,
          },
        })
      } else if (msgType === "audio" || msgType === "video" || msgType === "file") {
        attachments.push({
          type: msgType,
          data: { line_message_id: e.message.id },
        })
      } else {
        attachments.push({ type: "other", data: { msgType } })
      }

      messages.push({
        platform: "line",
        externalChatId,
        externalSenderId: userId,
        text,
        attachments: attachments.length > 0 ? attachments : undefined,
        isDirectMessage: isDM,
        externalMessageId: e.message.id,
        receiverAccountId,
        rawUpdate: event,
        receivedAt: e.timestamp
          ? new Date(e.timestamp).toISOString()
          : new Date().toISOString(),
      })
    }

    return messages
  },

  verifySignature(
    rawBody: string,
    headers: Headers,
    credentials?: ChannelCredentials,
  ): boolean {
    const secret =
      credentials?.channel_secret ?? process.env.LINE_CHANNEL_SECRET
    if (!secret) return false

    const sig = headers.get("x-line-signature")
    if (!sig) return false

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64")

    try {
      const a = Buffer.from(expected)
      const b = Buffer.from(sig)
      return a.length === b.length && crypto.timingSafeEqual(a, b)
    } catch {
      return false
    }
  },

  async send(
    externalChatId: string,
    message: OutgoingMessage,
    credentials?: ChannelCredentials,
  ): Promise<SendResult> {
    const token =
      credentials?.channel_access_token ?? process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!token) {
      return { ok: false, error: "LINE channel access token not configured" }
    }

    try {
      const response = await fetch(LINE_PUSH_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: externalChatId,
          messages: [{ type: "text", text: message.text }],
        }),
      })

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        return {
          ok: false,
          error: `LINE push ${response.status}: ${body.slice(0, 200)}`,
        }
      }

      // LINE's push API does not return a message ID.
      return { ok: true }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  },
}
