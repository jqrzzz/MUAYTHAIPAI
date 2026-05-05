/**
 * Per-gym channel credentials.
 *
 * Each gym brings their own LINE OA, WhatsApp Business, IG Business, etc.
 * tokens. This module is the single read/write surface for those tokens
 * so adapters never reach into the env directly (with one exception: a
 * legacy fallback for the demo gym, see ENV_FALLBACK below).
 *
 * Read path:
 *   loadChannelCredentials(supabase, orgId, channel)
 *     → DB row exists  → return row.credentials
 *     → DB row missing → return env-var fallback if any (legacy / demo)
 *     → neither        → return null (caller decides how strict)
 *
 * Write path:
 *   upsertChannelCredentials(supabase, orgId, channel, partial)
 *     → merges partial into the existing row's credentials JSONB
 *     → resets is_verified to false on any change (safer to re-test)
 *
 * The shape of `credentials` is per-channel — see CHANNEL_FIELDS for the
 * canonical keys. Callers are expected to know what's in there.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export type ChannelName = "line" | "telegram" | "whatsapp" | "ig" | "fb" | "test"

export type ChannelCredentials = Record<string, string | undefined>

/**
 * Canonical credential field names per channel. Used by the UI to render
 * the right paste-form fields and by the masked-read API to know what to
 * surface vs hide.
 */
export const CHANNEL_FIELDS: Record<
  ChannelName,
  ReadonlyArray<{ key: string; label: string; secret: boolean; help?: string }>
> = {
  line: [
    {
      key: "channel_secret",
      label: "Channel secret",
      secret: true,
      help: "Used to verify the X-Line-Signature on inbound webhooks.",
    },
    {
      key: "channel_access_token",
      label: "Channel access token",
      secret: true,
      help: "Long-lived token from the LINE Developers Console.",
    },
  ],
  telegram: [
    {
      key: "bot_token",
      label: "Bot token",
      secret: true,
      help: "From @BotFather. Format: 123456:ABC-DEF.",
    },
    {
      key: "webhook_secret",
      label: "Webhook secret",
      secret: true,
      help:
        "You pick this. We echo it in X-Telegram-Bot-Api-Secret-Token to verify inbound payloads.",
    },
    {
      key: "bot_id",
      label: "Bot id",
      secret: false,
      help: "The numeric prefix of your bot token (the part before the colon).",
    },
  ],
  whatsapp: [
    {
      key: "app_secret",
      label: "App secret",
      secret: true,
      help: "From Meta App dashboard → Settings → Basic.",
    },
    {
      key: "verify_token",
      label: "Verify token",
      secret: true,
      help:
        "You pick this. Meta's webhook verification handshake echoes it back.",
    },
    {
      key: "access_token",
      label: "Access token",
      secret: true,
      help: "System-user permanent access token with whatsapp_business_messaging scope.",
    },
    {
      key: "phone_number_id",
      label: "Phone number id",
      secret: false,
      help: "From Meta App dashboard → WhatsApp → API Setup.",
    },
  ],
  ig: [
    {
      key: "page_access_token",
      label: "Page access token",
      secret: true,
      help: "Long-lived page token from the Meta Graph API.",
    },
    {
      key: "page_id",
      label: "Page id",
      secret: false,
      help: "Instagram Business account id linked to a Facebook Page.",
    },
  ],
  fb: [
    {
      key: "page_access_token",
      label: "Page access token",
      secret: true,
      help: "Long-lived page token from the Meta Graph API.",
    },
    {
      key: "page_id",
      label: "Page id",
      secret: false,
      help: "Facebook Page id.",
    },
  ],
  test: [
    {
      key: "shared_secret",
      label: "Shared secret",
      secret: true,
      help: "Arbitrary value used by the test adapter for HMAC checks.",
    },
  ],
}

/**
 * Legacy environment variable mapping. Lets the demo gym (Wisarut) keep
 * working without re-entering credentials in the UI. New gyms should
 * always store via the DB.
 */
const ENV_FALLBACK: Record<ChannelName, Record<string, string>> = {
  line: {
    channel_secret: "LINE_CHANNEL_SECRET",
    channel_access_token: "LINE_CHANNEL_ACCESS_TOKEN",
  },
  telegram: {
    bot_token: "TELEGRAM_BOT_TOKEN",
    webhook_secret: "TELEGRAM_WEBHOOK_SECRET",
    bot_id: "TELEGRAM_BOT_ID",
  },
  whatsapp: {
    app_secret: "WHATSAPP_APP_SECRET",
    verify_token: "WHATSAPP_VERIFY_TOKEN",
    access_token: "WHATSAPP_ACCESS_TOKEN",
    phone_number_id: "WHATSAPP_PHONE_NUMBER_ID",
  },
  ig: {},
  fb: {},
  test: {
    shared_secret: "TEST_WEBHOOK_SECRET",
  },
}

function readEnvFallback(channel: ChannelName): ChannelCredentials | null {
  const map = ENV_FALLBACK[channel]
  const out: ChannelCredentials = {}
  let any = false
  for (const [key, envVar] of Object.entries(map)) {
    const v = process.env[envVar]
    if (v) {
      out[key] = v
      any = true
    }
  }
  return any ? out : null
}

/**
 * Load credentials for one (org, channel). Returns null when neither the
 * DB nor env has any usable values.
 *
 * Caller decides what counts as "complete" — some channels need every
 * field, some can do limited operations with a subset.
 */
export async function loadChannelCredentials(
  supabase: SupabaseClient,
  orgId: string,
  channel: ChannelName,
): Promise<ChannelCredentials | null> {
  const { data: row } = await supabase
    .from("mtp_channel_credentials")
    .select("credentials, is_active")
    .eq("org_id", orgId)
    .eq("channel", channel)
    .maybeSingle()

  if (row && row.is_active && row.credentials) {
    const merged: ChannelCredentials = { ...(row.credentials as ChannelCredentials) }
    // Backfill anything missing from env so a partial DB entry can still
    // make outbound calls work.
    const fallback = readEnvFallback(channel)
    if (fallback) {
      for (const [k, v] of Object.entries(fallback)) {
        if (merged[k] == null && v) merged[k] = v
      }
    }
    return merged
  }

  return readEnvFallback(channel)
}

/**
 * Insert or merge a partial credential update for an org/channel. Any
 * change resets is_verified to false — the caller (UI or test action)
 * should re-verify before claiming the channel is live.
 */
export async function upsertChannelCredentials(
  supabase: SupabaseClient,
  orgId: string,
  channel: ChannelName,
  partial: ChannelCredentials,
): Promise<{ ok: boolean; error?: string }> {
  // Strip empty strings — the UI sends "" for fields the user didn't
  // touch, and we don't want to wipe an existing token with that.
  const cleaned: ChannelCredentials = {}
  for (const [k, v] of Object.entries(partial)) {
    if (typeof v === "string" && v.trim().length > 0) cleaned[k] = v.trim()
  }

  const { data: existing } = await supabase
    .from("mtp_channel_credentials")
    .select("id, credentials")
    .eq("org_id", orgId)
    .eq("channel", channel)
    .maybeSingle()

  if (existing) {
    const merged = {
      ...(existing.credentials as ChannelCredentials),
      ...cleaned,
    }
    const { error } = await supabase
      .from("mtp_channel_credentials")
      .update({
        credentials: merged,
        is_verified: false,
        last_error: null,
      })
      .eq("id", existing.id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  const { error } = await supabase.from("mtp_channel_credentials").insert({
    org_id: orgId,
    channel,
    credentials: cleaned,
    is_active: true,
    is_verified: false,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Mask a credential value for safe display in API responses. Shows last
 * four characters only; "" for empty.
 */
export function maskCredential(value: string | undefined | null): string {
  if (!value) return ""
  if (value.length <= 4) return "••••"
  return "••••" + value.slice(-4)
}

/**
 * Whether OckOck should auto-send concierge AI replies on this channel
 * without owner approval. Default FALSE for every channel except web —
 * the web widget's UX depends on real-time replies, while DM channels
 * carry more weight and start in draft-mode by default.
 *
 * Owners flip this to TRUE per channel once they trust the AI's
 * judgment (typically after approving 5+ drafts in the inbox without
 * editing).
 */
export async function loadChannelAutoSendEnabled(
  supabase: SupabaseClient,
  orgId: string,
  channel: ChannelName,
): Promise<boolean> {
  const { data: row } = await supabase
    .from("mtp_channel_credentials")
    .select("auto_send_enabled, is_active")
    .eq("org_id", orgId)
    .eq("channel", channel)
    .maybeSingle()
  return Boolean(row?.is_active && row?.auto_send_enabled)
}
