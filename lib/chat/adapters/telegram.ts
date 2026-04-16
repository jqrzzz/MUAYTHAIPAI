/**
 * Telegram Bot API adapter.
 *
 * Docs: https://core.telegram.org/bots/api
 *
 * Env vars (all optional until a Telegram bot is connected):
 *   TELEGRAM_BOT_TOKEN          — used for sendMessage auth
 *   TELEGRAM_WEBHOOK_SECRET     — echoed back in X-Telegram-Bot-Api-Secret-Token
 *                                 header; set via setWebhook(secret_token=...).
 *   TELEGRAM_BOT_ID             — numeric bot id (first segment of the bot
 *                                 token, before the colon). Used as the
 *                                 adapter's receiverAccountId so the
 *                                 engine can route unknown senders to
 *                                 the right gym via mtp_chat_group_channels.
 *                                 For multi-bot deployments switch to a
 *                                 per-bot webhook path later.
 *
 * Telegram's signature story is simpler than LINE's: you register a
 * secret string when you call setWebhook, and Telegram sends it back
 * unhashed in a header on every delivery. We compare it with a
 * constant-time check.
 */

import crypto from "node:crypto"
import type {
  ChannelAdapter,
  IncomingAttachment,
  IncomingMessage,
  OutgoingMessage,
  SendResult,
} from "../types"

const TELEGRAM_API_BASE = "https://api.telegram.org"

export const telegramAdapter: ChannelAdapter = {
  channel: "telegram",

  parse(raw: unknown): IncomingMessage[] {
    if (!raw || typeof raw !== "object") return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = raw as any

    // We only handle message / edited_message / channel_post for now.
    // Callback queries, inline queries, etc. ignored — engine doesn't
    // have to care about bot-specific event types yet.
    const msg = update.message ?? update.edited_message ?? update.channel_post
    if (!msg || typeof msg !== "object") return []

    const chat = msg.chat ?? {}
    const from = msg.from ?? {}

    const externalChatId =
      chat.id !== undefined && chat.id !== null ? String(chat.id) : ""
    if (!externalChatId) return []

    // `from` is absent on anonymous channel_post. Fall back to chat id.
    const externalSenderId =
      from.id !== undefined && from.id !== null
        ? String(from.id)
        : externalChatId
    if (!externalSenderId) return []

    const chatType: string = chat.type ?? "private"
    const isDM = chatType === "private"

    const senderDisplayName =
      [from.first_name, from.last_name].filter(Boolean).join(" ") ||
      from.username ||
      undefined

    let text: string = typeof msg.text === "string" ? msg.text : ""
    const attachments: IncomingAttachment[] = []

    if (Array.isArray(msg.photo) && msg.photo.length > 0) {
      // Telegram sends an array of thumbnails + original; last = largest.
      const largest = msg.photo[msg.photo.length - 1]
      attachments.push({
        type: "image",
        data: { telegram_file_id: largest?.file_id },
      })
      if (!text && typeof msg.caption === "string") text = msg.caption
    } else if (msg.sticker) {
      attachments.push({
        type: "sticker",
        data: {
          emoji: msg.sticker.emoji,
          file_id: msg.sticker.file_id,
          set_name: msg.sticker.set_name,
        },
      })
    } else if (msg.voice || msg.audio) {
      const a = msg.voice ?? msg.audio
      attachments.push({
        type: "audio",
        mime: a.mime_type,
        data: { telegram_file_id: a.file_id, duration: a.duration },
      })
      if (!text && typeof msg.caption === "string") text = msg.caption
    } else if (msg.video || msg.video_note) {
      const v = msg.video ?? msg.video_note
      attachments.push({
        type: "video",
        mime: v.mime_type,
        data: { telegram_file_id: v.file_id, duration: v.duration },
      })
      if (!text && typeof msg.caption === "string") text = msg.caption
    } else if (msg.document) {
      attachments.push({
        type: "file",
        mime: msg.document.mime_type,
        name: msg.document.file_name,
        data: { telegram_file_id: msg.document.file_id },
      })
      if (!text && typeof msg.caption === "string") text = msg.caption
    } else if (msg.location) {
      attachments.push({
        type: "location",
        data: {
          latitude: msg.location.latitude,
          longitude: msg.location.longitude,
        },
      })
    }

    const receivedAt = msg.date
      ? new Date(msg.date * 1000).toISOString()
      : new Date().toISOString()

    // Telegram doesn't send a receiver id in the webhook payload itself —
    // the bot identity is implicit in the fact that Telegram delivered
    // this update to our webhook URL. For single-bot deployments we read
    // TELEGRAM_BOT_ID from env and stamp it here so the engine can route
    // first-contact visitors through mtp_chat_group_channels. Multi-bot
    // deployments will switch to per-bot webhook paths and derive the id
    // from the path at the webhook layer.
    const receiverAccountId = process.env.TELEGRAM_BOT_ID || undefined

    return [
      {
        platform: "telegram",
        externalChatId,
        externalSenderId,
        senderDisplayName,
        text,
        attachments: attachments.length > 0 ? attachments : undefined,
        isDirectMessage: isDM,
        externalMessageId:
          msg.message_id !== undefined ? String(msg.message_id) : undefined,
        receiverAccountId,
        rawUpdate: update,
        receivedAt,
      },
    ]
  },

  verifySignature(_rawBody: string, headers: Headers): boolean {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET
    if (!expected) return false

    const got = headers.get("x-telegram-bot-api-secret-token")
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
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      return { ok: false, error: "TELEGRAM_BOT_TOKEN not configured" }
    }

    try {
      const response = await fetch(
        `${TELEGRAM_API_BASE}/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: externalChatId,
            text: message.text,
            reply_to_message_id: message.replyToExternalMessageId
              ? Number(message.replyToExternalMessageId)
              : undefined,
            allow_sending_without_reply: true,
          }),
        },
      )

      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        result?: { message_id?: number }
        description?: string
      }

      if (!response.ok || !body.ok) {
        return {
          ok: false,
          error: `Telegram sendMessage ${response.status}: ${
            body.description ?? "unknown error"
          }`,
        }
      }

      return {
        ok: true,
        externalMessageId: body.result?.message_id
          ? String(body.result.message_id)
          : undefined,
      }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  },

  async sendTyping(externalChatId: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) return
    try {
      await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendChatAction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: externalChatId, action: "typing" }),
      })
    } catch {
      // best-effort — typing indicators are cosmetic.
    }
  },
}
