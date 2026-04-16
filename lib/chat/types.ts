/**
 * Shared types for the multi-channel chat engine.
 *
 * The engine is channel-agnostic. Each channel (LINE, Telegram, WhatsApp,
 * IG, FB, Web, Test) implements `ChannelAdapter` to convert its native
 * webhook payload into `IncomingMessage` and to send outgoing replies.
 */

export type Channel =
  | "line"
  | "telegram"
  | "whatsapp"
  | "ig"
  | "fb"
  | "web"
  | "test"

/**
 * Normalized inbound message. Every channel parser produces this shape so
 * the engine never has to think about channel-specific payloads.
 */
export type IncomingMessage = {
  platform: Channel
  /** Channel-native chat / group / room ID. For LINE: userId or groupId. */
  externalChatId: string
  /** Channel-native sender ID. */
  externalSenderId: string
  senderDisplayName?: string
  /** Message text. Empty string for non-text events (sticker, image-only). */
  text: string
  attachments?: IncomingAttachment[]
  /** True = DM (1:1). False = group/room chat. Affects routing. */
  isDirectMessage: boolean
  /** Channel-native message ID, used for dedup + reply threading. */
  externalMessageId?: string
  /** Full original payload. Preserved in communication_log.metadata for debugging. */
  rawUpdate: unknown
  /** ISO timestamp of when the channel reports the message was sent. */
  receivedAt: string
}

export type IncomingAttachment = {
  type: "image" | "audio" | "video" | "file" | "location" | "sticker" | "other"
  url?: string
  mime?: string
  name?: string
  /** Channel-specific extra data (LINE sticker IDs, Telegram file_id, etc.) */
  data?: unknown
}

/**
 * What the engine hands to an adapter to send out on a channel.
 */
export type OutgoingMessage = {
  text: string
  replyToExternalMessageId?: string
  attachments?: OutgoingAttachment[]
}

export type OutgoingAttachment = {
  type: "image" | "file"
  url: string
  name?: string
}

/**
 * Result of an outgoing send. Adapters should return ok=false with an
 * error string rather than throwing — webhook handlers must stay 200-OK-fast.
 */
export type SendResult = {
  ok: boolean
  externalMessageId?: string
  error?: string
}

/**
 * Per-channel adapter contract.
 *
 * Adapters MUST be pure in `parse()` and `verifySignature()` — no I/O, no
 * DB writes — so webhook handlers can verify and normalize synchronously
 * before kicking off fire-and-forget processing.
 */
export type ChannelAdapter = {
  channel: Channel

  /**
   * Parse a raw webhook payload into zero-or-more normalized messages.
   * Returns [] for payloads that are not user messages (status updates,
   * read receipts, etc.) — we ignore these gracefully.
   */
  parse(raw: unknown): IncomingMessage[]

  /**
   * Verify the webhook signature against the raw body + headers.
   * Returns false for invalid signatures — webhook handler should still
   * return 200 to prevent retries, but skip processing.
   */
  verifySignature(rawBody: string, headers: Headers): boolean

  /**
   * Send an outgoing message. Must not throw on channel errors —
   * return SendResult with ok:false instead.
   */
  send(externalChatId: string, message: OutgoingMessage): Promise<SendResult>

  /**
   * Optional typing indicator for channels that support it.
   * No-op for channels that don't (LINE).
   */
  sendTyping?(externalChatId: string): Promise<void>
}

/**
 * Result summary from the engine handling one inbound message.
 * Exposed for observability — webhook handlers log it, they don't act on it.
 */
export type HandleMessageResult = {
  conversationId: string
  messageLogId: string
  aiHandled: boolean
  escalated: boolean
  error?: string
}

/**
 * Purposes a chat_group can serve. Mirrors the CHECK constraint on
 * chat_groups.purpose in 015-create-chat-comms-tables.sql.
 */
export type ChatGroupPurpose = "public_inbox" | "owner_assist" | "staff"
