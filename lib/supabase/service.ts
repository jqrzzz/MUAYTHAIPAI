/**
 * THE service-role Supabase client — the single audited chokepoint for
 * bypassing Row Level Security.
 *
 * Use this only when the caller genuinely needs cross-tenant or unauthenticated
 * admin access: Stripe/chat webhooks, the public concierge loading any gym's
 * knowledge base, cron jobs, operator queries. Anything acting AS the logged-in
 * user belongs on the RLS client from `lib/supabase/server` instead — see
 * CLAUDE.md "Auth & data access".
 *
 * Previously ~78 files hand-rolled this client with assorted options; every
 * construction now flows through here so the bypass surface is one grep away:
 *   grep -rn "createServiceClient" app lib
 *
 * The client is memoized per process: it's stateless for REST calls (no session
 * persistence), and the per-module singletons it replaces shared the same
 * lifecycle. `server-only` makes any accidental client-bundle import a build
 * error rather than a leaked secret.
 */
import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cached: SupabaseClient | null = null

export function createServiceClient(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      "Missing Supabase service credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
    )
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
