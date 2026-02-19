import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InviteAcceptClient from "./client"

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get invite details
  const { data: invite } = await supabase
    .from("invites")
    .select(`
      *,
      organizations (
        id,
        name,
        slug,
        logo_url,
        city,
        province
      )
    `)
    .eq("token", token)
    .single()

  if (!invite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Invite</h1>
          <p className="text-muted-foreground">This invite link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  if (invite.status === "accepted") {
    redirect("/admin")
  }

  if (invite.status === "expired" || invite.status === "cancelled") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Invite Expired</h1>
          <p className="text-muted-foreground">This invite has expired. Please ask for a new invitation.</p>
        </div>
      </div>
    )
  }

  // Check if expired by date
  if (new Date(invite.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Invite Expired</h1>
          <p className="text-muted-foreground">This invite has expired. Please ask for a new invitation.</p>
        </div>
      </div>
    )
  }

  return (
    <InviteAcceptClient
      invite={invite}
      organization={invite.organizations}
      isLoggedIn={!!user}
      userEmail={user?.email}
    />
  )
}
