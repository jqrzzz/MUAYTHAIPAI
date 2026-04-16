/**
 * Telegram Bot API webhook.
 *
 * Register with:
 *   POST https://api.telegram.org/bot<TOKEN>/setWebhook
 *     { url: "https://<host>/api/webhooks/telegram",
 *       secret_token: "<TELEGRAM_WEBHOOK_SECRET>" }
 *
 * Telegram retries on non-200 (up to 90s) but much less aggressively
 * than LINE. Still: return 200 quickly and do work fire-and-forget.
 */

import { type NextRequest, NextResponse } from "next/server"
import { telegramAdapter } from "@/lib/chat/adapters/telegram"
import { handleMessage } from "@/lib/chat/engine"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!telegramAdapter.verifySignature(rawBody, request.headers)) {
    console.warn("[webhooks/telegram] invalid signature")
    return NextResponse.json({ ok: true, skipped: "bad_signature" })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: true, skipped: "invalid_json" })
  }

  const messages = telegramAdapter.parse(parsed)

  for (const msg of messages) {
    void handleMessage(msg, telegramAdapter)
  }

  return NextResponse.json({ ok: true, received: messages.length })
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    channel: "telegram",
    configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  })
}
