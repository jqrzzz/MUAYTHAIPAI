/**
 * POST /api/platform-admin/invites
 *
 * Create a platform-admin invite (the "partner" tier — sees the operator
 * console except billing). Only "full" platform admins can invite. Sends a
 * branded email with the accept link; if email send fails, the invite URL
 * is also returned so the inviter can share it manually.
 */
import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { NETWORK } from "@/lib/network-identity"
import { requirePlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < 32; i++) token += chars.charAt(Math.floor(Math.random() * chars.length))
  return token
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export async function POST(request: NextRequest) {
  // Only "full" platform admins can issue partner invites — partners can't
  // promote others.
  const auth = await requirePlatformAdmin({ billing: true })
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, user } = auth

  const body = (await request.json().catch(() => ({}))) as { email?: unknown; name?: unknown; role?: unknown }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) || null : null
  const role = body.role === "full" ? "full" : "partner"

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  // Already a platform admin?
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, is_platform_admin")
    .eq("email", email)
    .maybeSingle()
  if (existingUser?.is_platform_admin) {
    return NextResponse.json({ error: "That email is already a platform admin." }, { status: 400 })
  }

  // Existing pending invite? (The partial unique index also enforces this
  // at the DB level; this check just gives a friendly error.)
  const { data: existingInvite } = await supabase
    .from("platform_invites")
    .select("id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle()
  if (existingInvite) {
    return NextResponse.json(
      { error: "An invite is already pending for this email. Cancel it before sending another." },
      { status: 400 },
    )
  }

  const token = generateToken()
  const { data: invite, error: insertErr } = await supabase
    .from("platform_invites")
    .insert({ email, name, role, token, invited_by: user.id })
    .select("id, token, email")
    .single()
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"
  const inviteUrl = `${siteUrl}/invite/${invite.token}`

  let emailSent = false
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: NETWORK.from,
      to: email,
      subject: "You've been invited to OckOck — partner access",
      html: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#09090b;color:#fafafa;padding:40px 20px;margin:0;">
  <div style="max-width:520px;margin:0 auto;background:#18181b;border-radius:14px;padding:32px;border:1px solid #27272a;">
    <div style="font-size:28px;margin-bottom:8px;">🐃</div>
    <h1 style="color:#fff;margin:0 0 18px 0;font-size:22px;font-weight:600;">You've been invited as a partner</h1>
    <p style="color:#d4d4d8;line-height:1.6;margin:0 0 14px 0;">
      ${name ? `Hi ${name.replace(/[<>]/g, "")},` : "Hi,"}
    </p>
    <p style="color:#d4d4d8;line-height:1.6;margin:0 0 22px 0;">
      You've been invited to OckOck as a <strong style="color:#fff;">platform partner</strong> — full access to the operator console except billing. Click below to accept.
    </p>
    <a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;margin:0 0 22px 0;">
      Accept invitation
    </a>
    <p style="color:#71717a;font-size:13px;margin:18px 0 0 0;">
      This invite expires in 14 days. If you didn't expect this email, you can ignore it.
    </p>
  </div>
</body></html>`,
    })
    emailSent = true
  } catch (err) {
    console.error("[platform-admin/invites] email send failed:", err)
  }

  return NextResponse.json({
    ok: true,
    invite: { id: invite.id, email: invite.email, inviteUrl },
    emailSent,
  })
}
