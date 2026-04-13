import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import EventEditorClient from "../editor-client"

export const metadata = {
  title: "Edit Event | Promoter Dashboard",
  robots: "noindex, nofollow",
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/admin/login?redirect=/ockock/promoter/events/${id}`)
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

  return <EventEditorClient mode="edit" eventId={id} />
}
