import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import EventEditorClient from "../editor-client"

export const metadata = {
  title: "Create Event | Promoter Dashboard",
  robots: "noindex, nofollow",
}

export default async function NewEventPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/admin/login?redirect=/ock/promoter/events/new")
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin", "promoter"])
    .single()

  if (!membership) {
    redirect("/admin/login?error=no_promoter_access")
  }

  return <EventEditorClient mode="create" />
}
