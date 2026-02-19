import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check if user is platform admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: userData } = await supabase.from("users").select("is_platform_admin").eq("id", user.id).single()

  if (!userData?.is_platform_admin) {
    return NextResponse.json({ error: "Not a platform admin" }, { status: 403 })
  }

  const { name, slug, city, province, ownerEmail, ownerName } = await request.json()

  // Create the organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      city,
      province,
      country: "Thailand",
      timezone: "Asia/Bangkok",
      status: "active",
    })
    .select()
    .single()

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 400 })
  }

  // Create subscription (30 day trial)
  await supabase.from("gym_subscriptions").insert({
    org_id: org.id,
    status: "trial",
    price_thb: 999,
  })

  // Create org settings
  await supabase.from("org_settings").insert({
    org_id: org.id,
  })

  // Generate invite token
  const token = crypto.randomUUID()

  // Create invite for owner
  await supabase.from("invites").insert({
    org_id: org.id,
    email: ownerEmail,
    role: "owner",
    token,
    invited_by: user.id,
  })

  // Send invite email
  const inviteUrl = `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "https://pai-muay-thai.vercel.app"}/invite/${token}`

  try {
    await resend.emails.send({
      from: "Muay Thai Network <noreply@paimuaythai.com>",
      to: ownerEmail,
      subject: `You're invited to join ${name} on Muay Thai Network`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h1 style="color: #f97316;">Welcome to Muay Thai Network!</h1>
          <p>Hi ${ownerName || "there"},</p>
          <p>Your gym <strong>${name}</strong> has been added to the Muay Thai Network platform.</p>
          <p>Click the link below to set up your account and start managing your gym:</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Set Up Your Account
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            You'll have a 30-day free trial to explore all features.
          </p>
          <p>Chok dee! 🥊</p>
        </div>
      `,
    })
  } catch (emailError) {
    console.error("Failed to send invite email:", emailError)
  }

  return NextResponse.json({ success: true, org })
}
