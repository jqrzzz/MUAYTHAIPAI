import { NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { sendDiscoveryInvite } from "@/lib/discovery/invite-email"

function generateToken() {
  return randomBytes(24).toString("base64url")
}

function getBaseUrl(request: Request) {
  const env = process.env.NEXT_PUBLIC_SITE_URL
  if (env) return env.replace(/\/$/, "")
  const origin = new URL(request.url).origin
  return origin
}

export async function POST(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const id = body.id as string | undefined
  const email = (body.email as string | undefined)?.trim() || undefined
  const sendEmail = body.send_email !== false  // default: try to send
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const { data: gym, error: fetchErr } = await supabase
    .from("discovered_gyms")
    .select("id, name, email, city, province, invite_token, invited_at")
    .eq("id", id)
    .single()
  if (fetchErr || !gym) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  // Reuse existing token if one was generated previously
  const token = gym.invite_token || generateToken()
  const inviteEmail = email || gym.email || null

  const { error: updErr } = await supabase
    .from("discovered_gyms")
    .update({
      invite_token: token,
      invited_at: gym.invited_at || new Date().toISOString(),
      invite_email: inviteEmail,
      status: "invited",
    })
    .eq("id", id)

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  const baseUrl = getBaseUrl(request)
  const inviteUrl = `${baseUrl}/signup?invite=${encodeURIComponent(token)}`

  let emailResult: { sent: boolean; reason?: string; id?: string } = { sent: false, reason: "skipped" }
  if (sendEmail && inviteEmail) {
    emailResult = await sendDiscoveryInvite({
      to: inviteEmail,
      gymName: gym.name,
      inviteUrl,
      city: gym.city,
      province: gym.province,
    })
  }

  return NextResponse.json({
    token,
    invite_url: inviteUrl,
    email: inviteEmail,
    email_sent: emailResult.sent,
    email_reason: emailResult.reason,
    message: emailResult.sent
      ? `Invite emailed to ${inviteEmail}.`
      : inviteEmail
        ? `Invite ready (email not sent: ${emailResult.reason || "unknown"}). Share the link manually.`
        : "Invite ready. No email on file — share the link manually.",
  })
}
