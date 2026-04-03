import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import OnboardingClient from "./client"

export const metadata = {
  title: "Set Up Your Gym | MUAYTHAIPAI",
  robots: "noindex, nofollow",
}

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login?redirect=/onboarding")
  }

  // Must be an owner or admin
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role, organizations (id, name, slug, description, email, phone, whatsapp, address, city, province, logo_url)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin"])
    .single()

  if (!membership) {
    redirect("/admin")
  }

  // Check if gym already has services (skip onboarding if already set up)
  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("org_id", membership.org_id)

  if (count && count > 0) {
    redirect("/admin")
  }

  const org = membership.organizations as unknown as {
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

  return <OnboardingClient orgId={membership.org_id} organization={org} />
}
