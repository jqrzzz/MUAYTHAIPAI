/**
 * POST /api/actions/[token]
 *
 * Consumes an AI-issued action token. The authenticated user MUST
 * match mtp_action_tokens.user_id. We use a service-role client ONLY
 * inside the handler to execute the action — all auth checks happen
 * through the SSR client first.
 *
 * Atomicity: claimActionToken does an UPDATE ... WHERE consumed_at IS
 * NULL RETURNING row, so double-submits are safe — only the first
 * request wins and executes.
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getActionHandler } from "@/lib/chat/actions/registry"
import {
  claimActionToken,
  storeActionResult,
} from "@/lib/chat/actions/tokens"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteParams = { params: { token: string } }

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase service credentials")
  }
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const tokenId = params.token
  if (!tokenId || typeof tokenId !== "string") {
    return NextResponse.json(
      { ok: false, error: "token_invalid" },
      { status: 400 },
    )
  }

  // 1. Must be authenticated.
  const ssr = await createServerClient()
  const {
    data: { user },
  } = await ssr.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    )
  }

  // 2. Atomically claim the token for this user. Service role for
  //    unambiguous UPDATE semantics (RLS on mtp_action_tokens would also
  //    let user_id=auth.uid() do it, but service role avoids any
  //    JWT-refresh edge cases during confirmation).
  let service
  try {
    service = getServiceClient()
  } catch (err) {
    console.error("[api/actions] service client unavailable:", err)
    return NextResponse.json(
      { ok: false, error: "service_unavailable" },
      { status: 500 },
    )
  }

  const claimed = await claimActionToken({
    supabase: service,
    tokenId,
    userId: user.id,
  })

  if (!claimed) {
    // Could be: wrong user, already consumed, expired, nonexistent.
    return NextResponse.json(
      { ok: false, error: "token_invalid" },
      { status: 409 },
    )
  }

  // 3. Dispatch to the handler.
  const handler = getActionHandler(claimed.actionType)
  if (!handler) {
    const result = { ok: false, error: "handler_missing" } as const
    await storeActionResult(service, tokenId, { ...result })
    return NextResponse.json(result, { status: 500 })
  }

  try {
    const result = await handler.execute(service, claimed.params, {
      orgId: claimed.orgId,
      userId: claimed.userId,
    })
    await storeActionResult(service, tokenId, { ...result })

    if (!result.ok) {
      return NextResponse.json(result, { status: 500 })
    }
    return NextResponse.json(result)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error("[api/actions] handler threw:", errMsg)
    await storeActionResult(service, tokenId, {
      ok: false,
      error: `execute_failed: ${errMsg}`,
    })
    return NextResponse.json(
      { ok: false, error: "execute_failed" },
      { status: 500 },
    )
  }
}
