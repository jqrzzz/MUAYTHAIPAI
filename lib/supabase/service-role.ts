import { createClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client — bypasses row-level security.
 *
 * Use ONLY in server code that has ALREADY authorized the caller (e.g. behind
 * getPlatformAdmin / requirePlatformAdmin), and ONLY for NETWORK-WIDE reads
 * that RLS would otherwise silently scope to the caller's own org.
 *
 * Why this exists: the `bookings`, `users`, `certificates` and `skill_signoffs`
 * tables have no platform-admin SELECT policy (only "view own" + "staff view
 * org"). A platform operator is not an org_member of every gym, so through the
 * request-scoped client they see only their own gym's rows — which makes the
 * network money/stats surfaces under-report (the "operator only sees their own
 * gym" / "Total users: 0" class of bug) as soon as a second gym exists.
 *
 * NEVER expose the result of a service-role query to a partner/limited admin —
 * gate the caller first.
 */
export function serviceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
