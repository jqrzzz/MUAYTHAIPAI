import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// Generate a secure random token
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let token = ""
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// GET - List pending invites for org
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is owner or admin
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const { data: invites, error } = await supabase
    .from("invites")
    .select("*")
    .eq("org_id", membership.org_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invites })
}

// POST - Create and send invite
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is owner or admin
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can invite trainers" }, { status: 403 })
  }

  const body = await request.json()
  const { email, role = "trainer", trainerName } = body

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  // Get org info for email
  const { data: org } = await supabase.from("organizations").select("name, slug").eq("id", membership.org_id).single()

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 })
  }

  // Check if already has pending invite
  const { data: existingInvite } = await supabase
    .from("invites")
    .select("id")
    .eq("org_id", membership.org_id)
    .eq("email", email.toLowerCase().trim())
    .eq("status", "pending")
    .single()

  if (existingInvite) {
    return NextResponse.json({ error: "An invite is already pending for this email" }, { status: 400 })
  }

  // Check if already a member
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .single()

  if (existingUser) {
    const { data: existingMember } = await supabase
      .from("org_members")
      .select("id")
      .eq("org_id", membership.org_id)
      .eq("user_id", existingUser.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: "This person is already a member of your gym" }, { status: 400 })
    }
  }

  // Create invite
  const token = generateToken()
  const { data: invite, error: inviteError } = await supabase
    .from("invites")
    .insert({
      org_id: membership.org_id,
      email: email.toLowerCase().trim(),
      role,
      token,
      invited_by: user.id,
    })
    .select()
    .single()

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  // Send invite email
  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.paimuaythai.com"}/invite/${token}`

  try {
    await resend.emails.send({
      from: "Pai Muay Thai <noreply@paimuaythai.com>",
      to: email.toLowerCase().trim(),
      subject: `You're invited to join ${org.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; padding: 32px; border: 1px solid #333;">
            <h1 style="color: #f97316; margin: 0 0 24px 0; font-size: 24px;">You're Invited!</h1>
            
            <p style="color: #d4d4d4; line-height: 1.6; margin: 0 0 16px 0;">
              ${trainerName ? `Hi ${trainerName},` : "Hi,"}
            </p>
            
            <p style="color: #d4d4d4; line-height: 1.6; margin: 0 0 24px 0;">
              You've been invited to join <strong style="color: #ffffff;">${org.name}</strong> as a ${role}. 
              Click the button below to accept and set up your account.
            </p>
            
            <a href="${inviteUrl}" style="display: inline-block; background-color: #f97316; color: #000000; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-bottom: 24px;">
              Accept Invitation
            </a>
            
            <p style="color: #737373; font-size: 14px; margin: 24px 0 0 0;">
              This invite expires in 7 days. If you didn't expect this invite, you can ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (emailError) {
    console.error("Failed to send invite email:", emailError)
    // Don't fail the request - invite is created, just email failed
  }

  return NextResponse.json({ invite, inviteUrl }, { status: 201 })
}
