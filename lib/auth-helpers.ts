import { createClient } from "@/lib/supabase/server"

/**
 * Role model overview (see docs/roles-and-access.md for the full matrix):
 *
 *   - users.is_platform_admin = TRUE  → super admin (network-wide)
 *   - org_members.role = 'owner'      → gym subscriber, full gym access
 *   - org_members.role = 'admin'      → invited gym staff, same as owner
 *                                       except can't transfer ownership
 *   - org_members.role = 'trainer'    → invited trainer, /trainer dashboard
 *   - (no row in org_members)         → student / public visitor
 *
 * Helpers below return a clear `{ ok, ... }` shape so route handlers
 * don't have to write the same null-checks over and over.
 */

export type GymRole = "owner" | "admin" | "trainer"

const GYM_ADMIN_ROLES = ["owner", "admin"] as const
const GYM_STAFF_ROLES = ["owner", "admin", "trainer"] as const

/**
 * Look up the active org membership for the current user.
 * Returns `{ supabase, user, membership }` — `user` is null if not signed in,
 * `membership` is null if the user has no active org membership.
 * Callers apply their own role gate.
 *
 * Prefer the `requireGymAdmin` / `requireGymStaff` helpers below when
 * the route only needs to gate on role — they centralize the check.
 */
export async function getOrgMember() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, membership: null }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  return { supabase, user, membership }
}

/**
 * Gate for routes that should only be hit by gym owner/admin (NOT trainer
 * or platform admin). Returns `{ ok: true, ...ctx }` or `{ ok: false,
 * status, error }` — caller spreads into NextResponse.json.
 *
 * Used for: services CRUD, settings, channel credentials, course
 * authoring inside a gym's library, member invites, etc.
 */
export async function requireGymAdmin() {
  const { supabase, user, membership } = await getOrgMember()
  if (!user) {
    return { ok: false as const, status: 401, error: "Unauthorized" }
  }
  if (!membership) {
    return { ok: false as const, status: 403, error: "No gym membership" }
  }
  const role = String(membership.role)
  if (!GYM_ADMIN_ROLES.includes(role as (typeof GYM_ADMIN_ROLES)[number])) {
    return { ok: false as const, status: 403, error: "Owner or admin only" }
  }
  return {
    ok: true as const,
    supabase,
    user,
    orgId: membership.org_id as string,
    role: role as "owner" | "admin",
  }
}

/**
 * Gate for routes that any gym staff can hit (owner / admin / trainer).
 * Used for: skill signoffs, certificate issuance (with extra level
 * caps for trainers), reading the inbox, etc.
 */
export async function requireGymStaff() {
  const { supabase, user, membership } = await getOrgMember()
  if (!user) {
    return { ok: false as const, status: 401, error: "Unauthorized" }
  }
  if (!membership) {
    return { ok: false as const, status: 403, error: "No gym membership" }
  }
  const role = String(membership.role)
  if (!GYM_STAFF_ROLES.includes(role as (typeof GYM_STAFF_ROLES)[number])) {
    return { ok: false as const, status: 403, error: "Gym staff only" }
  }
  return {
    ok: true as const,
    supabase,
    user,
    orgId: membership.org_id as string,
    role: role as GymRole,
  }
}

/**
 * Gate for routes that only the gym owner can hit (transfer ownership,
 * delete the gym, top-level subscription changes). Tighter than
 * requireGymAdmin since admins can't do these.
 */
export async function requireGymOwner() {
  const { supabase, user, membership } = await getOrgMember()
  if (!user) {
    return { ok: false as const, status: 401, error: "Unauthorized" }
  }
  if (!membership || String(membership.role) !== "owner") {
    return { ok: false as const, status: 403, error: "Owner only" }
  }
  return {
    ok: true as const,
    supabase,
    user,
    orgId: membership.org_id as string,
  }
}

/**
 * Check if the current user has promoter-level access (owner, admin, or promoter role).
 * Returns org info or null if unauthorized.
 */
export async function getPromoterAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin", "promoter"])
    .single()

  if (!membership) return null
  return { userId: user.id, orgId: membership.org_id, role: membership.role }
}

/**
 * Returns the current user along with their platform-admin status.
 * Used by /platform-admin endpoints to gate access to platform-wide
 * resources (e.g. the Naga–Garuda cert ladder, network-wide stats).
 */
export async function getPlatformAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, isPlatformAdmin: false }

  const { data } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()

  return {
    supabase,
    user,
    isPlatformAdmin: !!data?.is_platform_admin,
  }
}

/**
 * Allow access if the user is either a platform admin OR a gym
 * owner/admin. Used by stateless AI authoring endpoints that don't
 * write to a specific scope — saving still goes through the scoped
 * course CRUD endpoints which enforce their own boundaries.
 */
export async function getCourseAuthorAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, allowed: false, role: null }

  const { data: u } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()
  if (u?.is_platform_admin) {
    return { supabase, user, allowed: true, role: "platform_admin" as const }
  }

  const { data: m } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .maybeSingle()
  if (m) {
    return { supabase, user, allowed: true, role: m.role as "owner" | "admin" }
  }

  return { supabase, user, allowed: false, role: null }
}

/**
 * Verify that a fight_event belongs to the given org.
 */
export async function verifyEventOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  orgId: string
) {
  const { data } = await supabase
    .from("fight_events")
    .select("id")
    .eq("id", eventId)
    .eq("org_id", orgId)
    .single()
  return !!data
}
