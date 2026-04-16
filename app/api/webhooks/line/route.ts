/**
 * LINE Messaging API webhook.
 *
 * Contract with LINE:
 *   - Verify X-Line-Signature (HMAC-SHA256 over raw body with channel secret)
 *   - Respond 200 within ~1s; LINE retries aggressively on non-200
 *   - Even for invalid signatures we return 200 so LINE doesn't hammer
 *     the endpoint, but we skip processing
 *
 * Per-message processing runs fire-and-forget — the adapter's send()
 * happens on the same request but we don't await before responding.
 * That keeps the 200 fast; the engine swallows its own errors.
 */

import { type NextRequest, NextResponse } from "next/server"
import { lineAdapter } from "@/lib/chat/adapters/line"
import { handleMessage } from "@/lib/chat/engine"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!lineAdapter.verifySignature(rawBody, request.headers)) {
    console.warn("[webhooks/line] invalid signature")
    return NextResponse.json({ ok: true, skipped: "bad_signature" })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: true, skipped: "invalid_json" })
  }

  const messages = lineAdapter.parse(parsed)

  // Fire-and-forget: don't await. handleMessage is contractually non-throwing.
  for (const msg of messages) {
    void handleMessage(msg, lineAdapter)
  }

  return NextResponse.json({ ok: true, received: messages.length })
}

// LINE sends a verification call during webhook setup; return 200 on GET
// so the developer console's "Verify" button is happy.
export async function GET() {
  return NextResponse.json({
    status: "ok",
    channel: "line",
    configured: Boolean(process.env.LINE_CHANNEL_SECRET),
  })
}
