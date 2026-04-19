/**
 * WhatsApp Cloud API adapter (direct Meta, no Twilio/MessageBird/etc).
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Env vars (all optional until a WhatsApp Business phone is connected):
 *   WHATSAPP_APP_SECRET         — for x-hub-signature-256 verification
 *   WHATSAPP_VERIFY_TOKEN       — for the GET /api/webhooks/whatsapp hub
 *                                 challenge (handled in the route handler,
 *                                 not here — adapter has no GET dance)
 *   WHATSAPP_ACCESS_TOKEN       — permanent system-user token for Graph API
 *   WHATSAPP_PHONE_NUMBER_ID    — default "from" phone number id. Used when
 *                                 we send. Per-org override lands in Wave 9b
 *                                 when we wire the per-gym settings UI.
 *
 * Signature verification:
 *   Meta signs the raw POST body with HMAC-SHA256 using the App Secret and
 *   passes it as `x-hub-signature-256: sha256=<hex>`. Constant-time compare.
 *
 * Payload shape:
 *   Webhook calls deliver an array of entries, each with changes, each with
 *   a `value.messages[]`. Multiple messages per webhook call are normal
 *   (batched delivery). We flatten all of them into IncomingMessage[].
 *
 * Identity mapping:
 *   - externalSenderId = message.from (e164 phone without +)
 *   - externalChatId   = message.from (WhatsApp is 1:1, no group chats
 *                        available via Cloud API as of 2026)
 *   - externalMessageId = message.id (starts with "wamid.")
 */

import crypto from "node:crypto"
import type {
  ChannelAdapter,
  IncomingAttachment,
  IncomingMessage,
  OutgoingMessage,
  SendResult,
} from "../types"

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0"

export const whatsappAdapter: ChannelAdapter = {
  channel: "whatsapp",

  parse(raw: unknown): IncomingMessage[] {
    if (!raw || typeof raw !== "object") return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = raw as any

    // Status-only webhooks (delivery receipts, read receipts) have no
    // messages array. They're legitimate but not user input — ignore.
    if (payload.object !== "whatsapp_business_account") return []
    if (!Array.isArray(payload.entry)) return []

    const messages: IncomingMessage[] = []

    for (const entry of payload.entry) {
      if (!entry || !Array.isArray(entry.changes)) continue
      for (const change of entry.changes) {
        if (!change || change.field !== "messages") continue
        const value = change.value
        if (!value || !Array.isArray(value.messages)) continue

        const phoneNumberId: string | undefined = value.metadata?.phone_number_id
        const contactsByWaId = new Map<string, string>()
        if (Array.isArray(value.contacts)) {
          for (const c of value.contacts) {
            if (c?.wa_id && c.profile?.name) {
              contactsByWaId.set(String(c.wa_id), String(c.profile.name))
            }
          }
        }

        for (const msg of value.messages) {
          if (!msg || typeof msg !== "object") continue
          const from: string | undefined = msg.from
          if (!from) continue

          const senderDisplayName = contactsByWaId.get(String(from))
          const msgType: string = msg.type ?? "unknown"

          let text = ""
          const attachments: IncomingAttachment[] = []

          if (msgType === "text") {
            text = msg.text?.body ?? ""
          } else if (msgType === "image") {
            attachments.push({
              type: "image",
              mime: msg.image?.mime_type,
              data: {
                whatsapp_media_id: msg.image?.id,
                sha256: msg.image?.sha256,
              },
            })
            if (!text && typeof msg.image?.caption === "string") {
              text = msg.image.caption
            }
          } else if (msgType === "audio" || msgType === "voice") {
            attachments.push({
              type: "audio",
              mime: msg.audio?.mime_type,
              data: {
                whatsapp_media_id: msg.audio?.id,
                voice: !!msg.audio?.voice,
              },
            })
          } else if (msgType === "video") {
            attachments.push({
              type: "video",
              mime: msg.video?.mime_type,
              data: { whatsapp_media_id: msg.video?.id },
            })
            if (!text && typeof msg.video?.caption === "string") {
              text = msg.video.caption
            }
          } else if (msgType === "document") {
            attachments.push({
              type: "file",
              mime: msg.document?.mime_type,
              name: msg.document?.filename,
              data: { whatsapp_media_id: msg.document?.id },
            })
            if (!text && typeof msg.document?.caption === "string") {
              text = msg.document.caption
            }
          } else if (msgType === "sticker") {
            attachments.push({
              type: "sticker",
              mime: msg.sticker?.mime_type,
              data: {
                whatsapp_media_id: msg.sticker?.id,
                animated: !!msg.sticker?.animated,
              },
            })
          } else if (msgType === "location") {
            attachments.push({
              type: "location",
              data: {
                latitude: msg.location?.latitude,
                longitude: msg.location?.longitude,
                name: msg.location?.name,
                address: msg.location?.address,
              },
            })
          } else if (msgType === "button") {
            // Quick-reply / template button tap. Treat payload text as body.
            text = msg.button?.text ?? msg.button?.payload ?? ""
          } else if (msgType === "interactive") {
            // List/reply buttons — body is in the selected reply.
            text =
              msg.interactive?.button_reply?.title ??
              msg.interactive?.list_reply?.title ??
              msg.interactive?.nfm_reply?.response_json ??
              ""
          } else {
            attachments.push({ type: "other", data: { msgType } })
          }

          const receivedAt = msg.timestamp
            ? new Date(Number(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString()

          messages.push({
            platform: "whatsapp",
            externalChatId: String(from),
            externalSenderId: String(from),
            senderDisplayName,
            text,
            attachments: attachments.length > 0 ? attachments : undefined,
            isDirectMessage: true, // Cloud API does not surface group chats.
            externalMessageId: msg.id ? String(msg.id) : undefined,
            receiverAccountId: phoneNumberId,
            rawUpdate: {
              entry_id: entry.id,
              phone_number_id: phoneNumberId,
              message: msg,
            },
            receivedAt,
          })
        }
      }
    }

    return messages
  },

  verifySignature(rawBody: string, headers: Headers): boolean {
    const secret = process.env.WHATSAPP_APP_SECRET
    if (!secret) return false

    const header = headers.get("x-hub-signature-256")
    if (!header || !header.startsWith("sha256=")) return false
    const gotHex = header.slice("sha256=".length)

    const expectedHex = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex")

    try {
      const a = Buffer.from(expectedHex, "hex")
      const b = Buffer.from(gotHex, "hex")
      return a.length === b.length && crypto.timingSafeEqual(a, b)
    } catch {
      return false
    }
  },

  async send(
    externalChatId: string,
    message: OutgoingMessage,
  ): Promise<SendResult> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!token) {
      return { ok: false, error: "WHATSAPP_ACCESS_TOKEN not configured" }
    }
    if (!phoneNumberId) {
      return { ok: false, error: "WHATSAPP_PHONE_NUMBER_ID not configured" }
    }

    try {
      const body: Record<string, unknown> = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: externalChatId,
        type: "text",
        text: {
          body: message.text,
          preview_url: false,
        },
      }
      if (message.replyToExternalMessageId) {
        body.context = { message_id: message.replyToExternalMessageId }
      }

      const response = await fetch(
        `${GRAPH_API_BASE}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      )

      const data = (await response.json().catch(() => ({}))) as {
        messages?: Array<{ id?: string }>
        error?: { message?: string; code?: number; error_subcode?: number }
      }

      if (!response.ok) {
        return {
          ok: false,
          error: `WhatsApp send ${response.status}: ${
            data.error?.message ?? "unknown error"
          }`,
        }
      }

      return {
        ok: true,
        externalMessageId: data.messages?.[0]?.id,
      }
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  },

  // No sendTyping: Meta's typing indicator requires the id of the
  // message we're replying to plus a "mark as read + typing" POST. That
  // requires state we don't carry here. Cosmetic — skip until needed.
}
