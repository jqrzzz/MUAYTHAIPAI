import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import PromoterDashboardClient from "./client"

export const metadata = {
  title: "Promoter Dashboard | OckOck",
  description: "Manage your fight events, bout cards, and ticket sales.",
  robots: "noindex, nofollow",
}

export default async function PromoterDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/admin/login?redirect=/ock/promoter")
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select(`
      org_id,
      role,
      organizations (name, slug)
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin", "promoter"])
    .single()

  if (!membership) {
    redirect("/admin/login?error=no_promoter_access")
  }

  return (
    <PromoterDashboardClient
      orgName={(membership.organizations as unknown as { name: string })?.name || "Your Gym"}
    />
  )
}
