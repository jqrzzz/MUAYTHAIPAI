import { createClient } from "@/lib/supabase/server"

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
