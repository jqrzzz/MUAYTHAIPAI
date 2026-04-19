/**
 * WhatsApp Cloud API webhook.
 *
 * Setup flow:
 *   1. In Meta for Developers → WhatsApp → Configuration, set:
 *        Callback URL: https://<host>/api/webhooks/whatsapp
 *        Verify Token: <WHATSAPP_VERIFY_TOKEN>
 *   2. Meta calls GET with `hub.mode=subscribe`, `hub.verify_token=<X>`,
 *      `hub.challenge=<Y>`. We echo the challenge back as plain text iff
 *      the token matches.
 *   3. After verification, Meta POSTs message events signed with
 *      x-hub-signature-256 (HMAC-SHA256 over raw body using App Secret).
 *
 * Retry behavior:
 *   Meta retries on non-2xx with exponential backoff for ~7 days. Return
 *   200 quickly — even on bad signature we still 200 so there's no retry
 *   amplification (and we log the bad-sig so ops can see brute-forcing).
 *
 * Fire-and-forget processing mirrors LINE + Telegram routes.
 */

import { type NextRequest, NextResponse } from "next/server"
import { whatsappAdapter } from "@/lib/chat/adapters/whatsapp"
import { handleMessage } from "@/lib/chat/engine"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!whatsappAdapter.verifySignature(rawBody, request.headers)) {
    console.warn("[webhooks/whatsapp] invalid signature")
    return NextResponse.json({ ok: true, skipped: "bad_signature" })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: true, skipped: "invalid_json" })
  }

  const messages = whatsappAdapter.parse(parsed)

  for (const msg of messages) {
    void handleMessage(msg, whatsappAdapter)
  }

  return NextResponse.json({ ok: true, received: messages.length })
}

// Meta's webhook verification handshake. On subscribe they GET us with
// `hub.mode=subscribe`, `hub.verify_token=<our secret>`, `hub.challenge=<X>`.
// We must reply with the plain challenge string (not JSON) and status 200.
// Anything else fails the subscribe.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get("hub.mode")
  const token = params.get("hub.verify_token")
  const challenge = params.get("hub.challenge")

  const expected = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === "subscribe" && expected && token === expected && challenge) {
    // Plain-text body is what Meta requires — NextResponse.json would
    // wrap it in quotes and break verification.
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  }

  // Health check (hits without the hub.* params). Don't leak whether
  // the verify token is set — just show that the endpoint is live.
  if (!mode && !token && !challenge) {
    return NextResponse.json({
      status: "ok",
      channel: "whatsapp",
      configured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
    })
  }

  console.warn("[webhooks/whatsapp] verify rejected", { mode, hasToken: !!token })
  return new Response("forbidden", { status: 403 })
}
