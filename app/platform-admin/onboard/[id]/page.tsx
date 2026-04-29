import { redirect } from "next/navigation"
import { randomBytes } from "node:crypto"
import { createClient } from "@/lib/supabase/server"
import OnboardClient from "./client"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OnboardPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  const { data: u } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()
  if (!u?.is_platform_admin) redirect("/admin")

  const { data: gym, error } = await supabase
    .from("discovered_gyms")
    .select(
      "id, name, name_th, city, province, country, website, email, phone, " +
        "google_rating, google_review_count, ai_summary, ai_tags, " +
        "status, invite_token, invited_at, invite_email, claimed_at, linked_org_id"
    )
    .eq("id", id)
    .single()

  if (error || !gym) {
    redirect("/platform-admin")
  }

  // Auto-generate invite token if missing — the page is meant to be the
  // operator's "ready to scan" surface, no extra clicks
  let token = gym.invite_token
  let invitedAt = gym.invited_at
  let status = gym.status
  if (!token) {
    token = randomBytes(24).toString("base64url")
    invitedAt = new Date().toISOString()
    status = status === "pending" || status === "reviewed" ? "invited" : status
    await supabase
      .from("discovered_gyms")
      .update({
        invite_token: token,
        invited_at: invitedAt,
        status,
      })
      .eq("id", id)
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://muaythaipai.com"
  const inviteUrl = `${baseUrl}/signup?invite=${encodeURIComponent(token)}`

  return (
    <OnboardClient
      gym={{
        ...gym,
        invite_token: token,
        invited_at: invitedAt,
        status,
      }}
      inviteUrl={inviteUrl}
    />
  )
}
