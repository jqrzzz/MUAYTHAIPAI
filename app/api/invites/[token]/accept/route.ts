import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Please sign in first" }, { status: 401 })
  }

  // Get invite
  const { data: invite } = await supabase
    .from("invites")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single()

  if (!invite) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 })
  }

  // Check if expired
  if (new Date(invite.expires_at) < new Date()) {
    await supabase.from("invites").update({ status: "expired" }).eq("id", invite.id)
    return NextResponse.json({ error: "This invite has expired" }, { status: 400 })
  }

  const body = await request.json()
  const { name } = body

  // Start transaction-like operations
  // 1. Create or update user profile
  const { data: existingProfile } = await supabase.from("users").select("id").eq("id", user.id).single()

  if (!existingProfile) {
    await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      full_name: name?.trim() || null,
      display_name: name?.trim() || null,
    })
  } else if (name?.trim()) {
    await supabase
      .from("users")
      .update({
        full_name: name.trim(),
        display_name: name.trim(),
      })
      .eq("id", user.id)
  }

  // 2. Add as org member
  const { error: memberError } = await supabase.from("org_members").insert({
    org_id: invite.org_id,
    user_id: user.id,
    role: invite.role,
    status: "active",
    can_manage_bookings: invite.role !== "student",
    can_manage_services: invite.role === "admin",
    can_manage_members: invite.role === "admin",
    can_view_payments: invite.role !== "student",
  })

  if (memberError) {
    // Might already be a member
    if (!memberError.message.includes("duplicate")) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }
  }

  // 3. If trainer, create trainer profile
  if (invite.role === "trainer") {
    const { data: existingTrainer } = await supabase
      .from("trainer_profiles")
      .select("id")
      .eq("org_id", invite.org_id)
      .eq("user_id", user.id)
      .single()

    if (!existingTrainer) {
      await supabase.from("trainer_profiles").insert({
        org_id: invite.org_id,
        user_id: user.id,
        display_name: name?.trim() || user.email?.split("@")[0] || "Trainer",
        is_available: true,
        is_featured: false,
      })
    }
  }

  // 4. Mark invite as accepted
  await supabase
    .from("invites")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id)

  return NextResponse.json({ success: true })
}
