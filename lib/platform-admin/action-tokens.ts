/**
 * Action tokens — HMAC-signed payloads for AI-proposed actions that
 * the operator must confirm before they execute.
 *
 * The tool's execute() returns {proposed: true, action_token, preview}.
 * The chat UI renders a Confirm chip. Clicking sends the token back
 * to /api/platform-admin/ai/confirm which verifies + runs the real
 * action.
 *
 * No DB writes for unconfirmed actions — the token IS the state.
 */

import { createHmac, timingSafeEqual } from "node:crypto"

export type ActionName =
  | "invite_gym"
  | "update_gym_status"

export interface ActionPayload {
  name: ActionName
  args: Record<string, unknown>
  exp: number
  iat: number
}

const TTL_SECONDS = 30 * 60 // 30 minutes — generous for an operator deliberating

function getSecret(): string {
  return (
    process.env.ACTION_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-only-action-token-secret"
  )
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url")
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, "base64url")
}

export function signActionToken(name: ActionName, args: Record<string, unknown>): {
  token: string
  payload: ActionPayload
} {
  const now = Math.floor(Date.now() / 1000)
  const payload: ActionPayload = {
    name,
    args,
    iat: now,
    exp: now + TTL_SECONDS,
  }
  const body = b64url(JSON.stringify(payload))
  const sig = createHmac("sha256", getSecret()).update(body).digest()
  const token = `${body}.${b64url(sig)}`
  return { token, payload }
}

export function verifyActionToken(token: string): ActionPayload | null {
  if (!token || typeof token !== "string") return null
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [body, sigB64] = parts

  const expected = createHmac("sha256", getSecret()).update(body).digest()
  let actual: Buffer
  try {
    actual = fromB64url(sigB64)
  } catch {
    return null
  }
  if (expected.length !== actual.length) return null
  if (!timingSafeEqual(expected, actual)) return null

  let payload: ActionPayload
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8"))
  } catch {
    return null
  }
  const now = Math.floor(Date.now() / 1000)
  if (!payload.exp || payload.exp < now) return null
  return payload
}
