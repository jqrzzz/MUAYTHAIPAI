/**
 * Database-backed sliding-hour rate limiter.
 *
 * Used by AI + public endpoints to cap per-user / per-IP request rates
 * without needing Redis or external infra. Each (key, hour-bucket) is
 * a single row in `rate_limit_buckets`; we increment on every request
 * and reject when the bucket exceeds `max`.
 *
 * Implementation detail: we use a service-role client so the limiter
 * works on anonymous requests (where the user-scoped supabase client
 * can't write). Caller doesn't need to thread state.
 *
 * Usage:
 *   const gate = await checkLimit({ key: `lead:${ip}`, max: 5, windowSeconds: 3600 })
 *   if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 429, headers: gate.headers })
 */
import { createClient } from "@supabase/supabase-js"

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

interface CheckArgs {
  /** Stable identifier — user id, IP, "scope:id" string, etc. */
  key: string
  /** Allowed requests per window. */
  max: number
  /** Window length in seconds. Truncated to hour boundaries internally. */
  windowSeconds?: number
}

interface CheckOk {
  ok: true
  remaining: number
  resetAt: Date
}

interface CheckBlocked {
  ok: false
  error: string
  retryAfter: number // seconds
  headers: Record<string, string>
}

export async function checkLimit(args: CheckArgs): Promise<CheckOk | CheckBlocked> {
  const { key, max } = args
  const now = new Date()
  // Bucket by the hour. Simple and predictable; ~always-on cron isn't
  // needed because old rows are just dead weight.
  const windowStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      0,
      0,
      0,
    ),
  )
  const expiresAt = new Date(windowStart.getTime() + 60 * 60 * 1000)

  // Atomic UPSERT with increment. ON CONFLICT clause runs only on the
  // (key, window_start) collision and adds 1 to the existing count.
  // The RETURNING gives us the post-increment value.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb as any).rpc("increment_rate_limit", {
    p_key: key,
    p_window_start: windowStart.toISOString(),
    p_expires_at: expiresAt.toISOString(),
  })

  let count: number
  if (error) {
    // RPC missing — fall back to a manual insert/update. This keeps the
    // limiter working even if migration 053 (the RPC) isn't applied
    // yet. Two roundtrips instead of one; acceptable.
    const { data: existing } = await sb
      .from("rate_limit_buckets")
      .select("count")
      .eq("key", key)
      .eq("window_start", windowStart.toISOString())
      .maybeSingle()
    const newCount = (existing?.count ?? 0) + 1
    await sb
      .from("rate_limit_buckets")
      .upsert(
        {
          key,
          window_start: windowStart.toISOString(),
          count: newCount,
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "key,window_start" },
      )
    count = newCount
  } else {
    count = (data as number) ?? 1
  }

  if (count > max) {
    const retryAfter = Math.max(
      1,
      Math.ceil((expiresAt.getTime() - now.getTime()) / 1000),
    )
    return {
      ok: false,
      error: "Rate limit exceeded — try again later",
      retryAfter,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(max),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": expiresAt.toISOString(),
      },
    }
  }

  return {
    ok: true,
    remaining: max - count,
    resetAt: expiresAt,
  }
}

/**
 * Pull a stable per-request IP for anonymous rate limiting.
 * Falls back to "unknown" if no proxy headers — caps abuse from a
 * single visitor without proxy headers (rare in practice on Vercel).
 */
export function ipFromRequest(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}
