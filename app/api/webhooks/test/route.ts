/**
 * Test webhook — synthetic channel for local dev + CI.
 *
 * POST body (single or array):
 *   {
 *     "externalChatId": "user-123",
 *     "externalSenderId": "user-123",
 *     "text": "hello gym",
 *     "isDirectMessage": true
 *   }
 *
 * Header:
 *   x-test-secret: <TEST_WEBHOOK_SECRET>
 *
 * Unlike LINE/Telegram, this route waits for handleMessage to finish
 * and returns the engine result — that's more useful for tests. It
 * also exposes peek/drain of the outbound buffer via GET ?action=peek
 * or GET ?action=drain.
 *
 * If TEST_WEBHOOK_SECRET is unset we fail closed. This adapter must
 * not be accidentally open in prod.
 */

import { type NextRequest, NextResponse } from "next/server"
import {
  drainTestOutbox,
  peekTestOutbox,
  testAdapter,
} from "@/lib/chat/adapters/test"
import { handleMessage } from "@/lib/chat/engine"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!testAdapter.verifySignature(rawBody, request.headers)) {
    return NextResponse.json(
      { ok: false, error: "bad_signature" },
      { status: 401 },
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    )
  }

  const messages = testAdapter.parse(parsed)
  const results = []
  for (const msg of messages) {
    results.push(await handleMessage(msg, testAdapter))
  }

  return NextResponse.json({ ok: true, received: messages.length, results })
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action")
  const secret = request.headers.get("x-test-secret")

  // Peek/drain require the secret too — don't leak conversation
  // contents to the world if someone accidentally deploys this.
  if (action === "peek" || action === "drain") {
    const expected = process.env.TEST_WEBHOOK_SECRET
    if (!expected || secret !== expected) {
      return NextResponse.json(
        { ok: false, error: "bad_signature" },
        { status: 401 },
      )
    }
    const outbox = action === "drain" ? drainTestOutbox() : peekTestOutbox()
    return NextResponse.json({ ok: true, outbox })
  }

  return NextResponse.json({
    status: "ok",
    channel: "test",
    configured: Boolean(process.env.TEST_WEBHOOK_SECRET),
  })
}
