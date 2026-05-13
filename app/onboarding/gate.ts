import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export interface OnboardingGym {
  id: string
  name: string
  slug: string
  description: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  city: string | null
  province: string | null
  logo_url: string | null
}

/**
 * Shared gate for the onboarding routes (/onboarding — the conversation,
 * /onboarding/form — the step-by-step form). The visitor must be a signed-in
 * gym owner/admin whose gym has no services yet; otherwise we redirect. On
 * success, returns the gym row.
 */
export async function loadOnboardingGym(
  selfPath: string,
): Promise<{ orgId: string; organization: OnboardingGym }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/admin/login?redirect=${encodeURIComponent(selfPath)}`)

  const { data: membership } = await supabase
    .from("org_members")
    .select(
      "org_id, role, organizations (id, name, slug, description, email, phone, whatsapp, address, city, province, logo_url)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .single()
  if (!membership) redirect("/admin")

  // Already set up? Skip onboarding.
  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("org_id", membership.org_id)
  if (count && count > 0) redirect("/admin")

  return {
    orgId: membership.org_id as string,
    organization: membership.organizations as unknown as OnboardingGym,
  }
}
