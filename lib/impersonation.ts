/**
 * Platform-admin impersonation cookie.
 *
 * Lets a super admin "view as gym admin / trainer / student" without
 * juggling browser sessions. The cookie is set from /platform-admin and
 * respected by /admin, /trainer, /student page gates *only when* the
 * underlying user is_platform_admin = TRUE — so a regular user sneaking
 * the cookie in gains nothing.
 */
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export const IMPERSONATION_COOKIE = "mtp_impersonate"

export type ImpersonationType = "gym_admin" | "trainer" | "student"

export interface ImpersonationState {
  type: ImpersonationType
  orgId?: string | null
  userId?: string | null
  label: string
}

/**
 * Read the impersonation cookie if present AND the current user is a
 * platform admin. Returns null otherwise — non-admins get no impersonation
 * even if they manage to set the cookie themselves.
 */
export async function getActiveImpersonation(): Promise<ImpersonationState | null> {
  const jar = await cookies()
  const raw = jar.get(IMPERSONATION_COOKIE)?.value
  if (!raw) return null

  let parsed: ImpersonationState | null = null
  try {
    parsed = JSON.parse(raw) as ImpersonationState
  } catch {
    return null
  }
  if (!parsed?.type) return null

  // Verify the actor is a platform admin — this is the security boundary.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: row } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()
  if (!row?.is_platform_admin) return null

  return parsed
}
