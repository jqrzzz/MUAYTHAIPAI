/**
 * WhatsApp Cloud API webhook.
 *
 * Setup flow:
 *   1. In Meta for Developers → WhatsApp → Configuration, set:
 *        Callback URL: https://<host>/api/webhooks/whatsapp
 *        Verify Token: <gym's saved verify_token>
 *   2. Meta calls GET with `hub.mode=subscribe`, `hub.verify_token=<X>`,
 *      `hub.challenge=<Y>`. We echo the challenge back as plain text iff
 *      the token matches any gym's saved verify_token (or the platform's
 *      env fallback for the demo gym).
 *   3. After verification, Meta POSTs message events signed with
 *      x-hub-signature-256 (HMAC-SHA256 over raw body with the gym's
 *      app_secret).
 *
 * Multi-tenant resolution:
 *   - Receiver id is the phone_number_id inside
 *     entry[].changes[].value.metadata.phone_number_id.
 *   - We resolve the org via mtp_chat_group_channels and load that gym's
 *     creds before verifying the signature. Falls back to env vars when
 *     no row is registered (demo gym).
 *
 * Retry behavior:
 *   Meta retries on non-2xx with exponential backoff for ~7 days. Return
 *   200 quickly — even on bad signature we still 200 so there's no retry
 *   amplification.
 */

import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { whatsappAdapter } from "@/lib/chat/adapters/whatsapp"
import { handleMessage } from "@/lib/chat/engine"
import { resolveOrgFromReceiver } from "@/lib/chat/resolve-org"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getServiceClient() {
  // Webhooks ack 200 without processing when the backend isn't configured —
  // preserve that null contract instead of letting the factory throw.
  try {
    return createServiceClient()
  } catch {
    return null
  }
}

function extractPhoneNumberId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = (payload as any).entry
  if (!Array.isArray(entries)) return undefined
  for (const entry of entries) {
    const changes = entry?.changes
    if (!Array.isArray(changes)) continue
    for (const c of changes) {
      const id = c?.value?.metadata?.phone_number_id
      if (typeof id === "string") return id
    }
  }
  return undefined
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: true, skipped: "invalid_json" })
  }

  const phoneNumberId = extractPhoneNumberId(parsed)
  const supabase = getServiceClient()
  const resolved = supabase
    ? await resolveOrgFromReceiver(supabase, "whatsapp", phoneNumberId)
    : null
  const credsForVerify = resolved?.credentials

  if (!whatsappAdapter.verifySignature(rawBody, request.headers, credsForVerify)) {
    console.warn("[webhooks/whatsapp] invalid signature", {
      phone_number_id: phoneNumberId,
      using: resolved ? "per-org creds" : "env fallback",
    })
    return NextResponse.json({ ok: true, skipped: "bad_signature" })
  }

  const messages = whatsappAdapter.parse(parsed)

  for (const msg of messages) {
    void handleMessage(msg, whatsappAdapter)
  }

  return NextResponse.json({ ok: true, received: messages.length })
}

/**
 * Meta's webhook verification handshake. Echoes hub.challenge if the
 * verify_token matches the platform env (demo) or any gym's saved
 * verify_token in mtp_channel_credentials.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get("hub.mode")
  const token = params.get("hub.verify_token")
  const challenge = params.get("hub.challenge")

  // Health check
  if (!mode && !token && !challenge) {
    return NextResponse.json({
      status: "ok",
      channel: "whatsapp",
      multi_tenant: true,
    })
  }

  if (mode !== "subscribe" || !token || !challenge) {
    return new Response("forbidden", { status: 403 })
  }

  // Env fallback (demo gym path)
  if (token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  }

  // Per-gym path: any saved verify_token matches → accept
  const supabase = getServiceClient()
  if (supabase) {
    const { data } = await supabase
      .from("mtp_channel_credentials")
      .select("id")
      .eq("channel", "whatsapp")
      .filter("credentials->>verify_token", "eq", token)
      .limit(1)
      .maybeSingle()
    if (data) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      })
    }
  }

  console.warn("[webhooks/whatsapp] verify rejected (no matching token)")
  return new Response("forbidden", { status: 403 })
}
