import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's org membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership) {
    return NextResponse.json({ error: "No organization access" }, { status: 403 })
  }

  // Get organization details
  const { data: organization } = await supabase.from("organizations").select("*").eq("id", membership.org_id).single()

  // Get org settings
  const { data: settings } = await supabase.from("org_settings").select("*").eq("org_id", membership.org_id).single()

  return NextResponse.json({ organization, settings })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's org membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership) {
    return NextResponse.json({ error: "No organization access" }, { status: 403 })
  }

  // Only owners and admins can update settings
  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await request.json()
  const { organization: orgUpdates, settings: settingsUpdates } = body

  // Update organization if provided
  if (orgUpdates) {
    const { error: orgError } = await supabase
      .from("organizations")
      .update({
        name: orgUpdates.name,
        description: orgUpdates.description,
        email: orgUpdates.email,
        phone: orgUpdates.phone,
        whatsapp: orgUpdates.whatsapp,
        address: orgUpdates.address,
        city: orgUpdates.city,
        province: orgUpdates.province,
        instagram: orgUpdates.instagram,
        facebook: orgUpdates.facebook,
        website: orgUpdates.website,
        updated_at: new Date().toISOString(),
      })
      .eq("id", membership.org_id)

    if (orgError) {
      return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
    }
  }

  // Update settings if provided
  if (settingsUpdates) {
    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from("org_settings")
      .select("id")
      .eq("org_id", membership.org_id)
      .single()

    if (existingSettings) {
      // Build update payload from allowed fields only
      const allowed: Record<string, unknown> = {}
      const fields = [
        "booking_advance_days", "booking_max_days_ahead", "allow_guest_bookings",
        "require_payment_upfront", "notify_on_booking_email", "notify_on_cancellation",
        "notify_on_payment", "notification_email", "notification_emails",
        "show_prices", "show_trainer_selection", "operating_hours",
      ] as const
      for (const key of fields) {
        if (settingsUpdates[key] !== undefined) {
          allowed[key] = settingsUpdates[key]
        }
      }
      allowed.updated_at = new Date().toISOString()

      const { error: settingsError } = await supabase
        .from("org_settings")
        .update(allowed)
        .eq("org_id", membership.org_id)

      if (settingsError) {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
      }
    } else {
      // Create settings if they don't exist
      const { error: insertError } = await supabase.from("org_settings").insert({
        org_id: membership.org_id,
        ...settingsUpdates,
      })

      if (insertError) {
        return NextResponse.json({ error: "Failed to create settings" }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ success: true })
}
