import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InviteAcceptClient from "./client"
import PlatformInviteAccept from "@/components/invite/platform-invite-accept"

function ExpiredOrInvalid({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}

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

  // 1. Gym invite (org-scoped) — the original path.
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
    .maybeSingle()

  if (invite) {
    if (invite.status === "accepted") redirect("/admin")
    if (invite.status === "expired" || invite.status === "cancelled") {
      return <ExpiredOrInvalid title="Invite Expired" body="This invite has expired. Please ask for a new invitation." />
    }
    if (new Date(invite.expires_at) < new Date()) {
      return <ExpiredOrInvalid title="Invite Expired" body="This invite has expired. Please ask for a new invitation." />
    }
    return (
      <InviteAcceptClient
        invite={invite}
        organization={invite.organizations}
        isLoggedIn={!!user}
        userEmail={user?.email}
        defaultName={
          // Pre-fill from the name they entered on /signup (stored in
          // Supabase user_metadata at invite-creation time). Saves a
          // duplicate input on the invite page.
          (user?.user_metadata?.full_name as string | undefined) ?? null
        }
      />
    )
  }

  // 2. Platform-admin invite (org-less) — the partner-access path.
  const { data: pInvite } = await supabase
    .from("platform_invites")
    .select("id, email, name, role, token, status, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (pInvite) {
    if (pInvite.status === "accepted") redirect("/platform-admin")
    if (pInvite.status === "expired" || pInvite.status === "cancelled") {
      return <ExpiredOrInvalid title="Invite Expired" body="This invite has expired. Ask the platform admin for a new one." />
    }
    if (new Date(pInvite.expires_at) < new Date()) {
      return <ExpiredOrInvalid title="Invite Expired" body="This invite has expired. Ask the platform admin for a new one." />
    }
    return (
      <PlatformInviteAccept
        invite={{
          id: pInvite.id,
          email: pInvite.email,
          name: pInvite.name,
          role: pInvite.role === "full" ? "full" : "partner",
          token: pInvite.token,
          expires_at: pInvite.expires_at,
        }}
        isLoggedIn={!!user}
        userEmail={user?.email}
      />
    )
  }

  return <ExpiredOrInvalid title="Invalid Invite" body="This invite link is invalid or has expired." />
}
