/**
 * LINE Messaging API webhook.
 *
 * Multi-tenant flow:
 *   1. Read the raw body
 *   2. Parse JSON to extract `destination` (the LINE OA's userId)
 *   3. Look up the org via mtp_chat_group_channels keyed on (line, destination)
 *   4. Load that org's per-gym creds (or env fallback if no DB row)
 *   5. Verify X-Line-Signature against those creds
 *   6. Hand normalized messages to the engine, fire-and-forget
 *
 * For invalid signatures, return 200 anyway so LINE doesn't retry, but
 * skip processing. Per-message processing runs asynchronously — we don't
 * await before responding so LINE's 1s SLO stays comfortable.
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { lineAdapter } from "@/lib/chat/adapters/line"
import { handleMessage } from "@/lib/chat/engine"
import { resolveOrgFromReceiver } from "@/lib/chat/resolve-org"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  // Try to extract destination cheaply so we can pick the right gym's
  // creds before signature verification. This is safe — JSON.parse is
  // pure and an attacker forging a destination still can't forge the
  // HMAC without the real secret.
  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: true, skipped: "invalid_json" })
  }

  const destination =
    typeof (parsed as { destination?: unknown })?.destination === "string"
      ? ((parsed as { destination: string }).destination)
      : undefined

  const supabase = getServiceClient()
  const resolved = supabase
    ? await resolveOrgFromReceiver(supabase, "line", destination)
    : null
  const credsForVerify = resolved?.credentials

  if (!lineAdapter.verifySignature(rawBody, request.headers, credsForVerify)) {
    console.warn("[webhooks/line] invalid signature", {
      destination,
      using: resolved ? "per-org creds" : "env fallback",
    })
    return NextResponse.json({ ok: true, skipped: "bad_signature" })
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
    multi_tenant: true,
  })
}
