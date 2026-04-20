import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .single()

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: members, error } = await supabase
    .from("org_members")
    .select("id, user_id, role, status, can_manage_bookings, can_manage_services, can_manage_members, can_view_payments, joined_at, users(full_name, email, phone)")
    .eq("org_id", membership.org_id)
    .order("joined_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    members: (members || []).map((m) => {
      const u = m.users as unknown as { full_name: string | null; email: string; phone: string | null } | null
      return {
        id: m.id,
        userId: m.user_id,
        name: u?.full_name || u?.email || "Unknown",
        email: u?.email || "",
        phone: u?.phone || null,
        role: m.role,
        status: m.status,
        permissions: {
          canManageBookings: m.can_manage_bookings,
          canManageServices: m.can_manage_services,
          canManageMembers: m.can_manage_members,
          canViewPayments: m.can_view_payments,
        },
        joinedAt: m.joined_at,
      }
    }),
    currentUserId: user.id,
  })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .single()

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { memberId, role, permissions } = await request.json()

  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 })
  }

  const { data: target } = await supabase
    .from("org_members")
    .select("id, user_id, role, org_id")
    .eq("id", memberId)
    .eq("org_id", membership.org_id)
    .single()

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  if (target.role === "owner" && membership.role !== "owner") {
    return NextResponse.json({ error: "Only owners can modify other owners" }, { status: 403 })
  }

  if (target.user_id === user.id) {
    return NextResponse.json({ error: "Cannot modify your own role" }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (role && ["admin", "trainer", "student", "promoter"].includes(role)) {
    updates.role = role
  }

  if (permissions) {
    if (typeof permissions.canManageBookings === "boolean") updates.can_manage_bookings = permissions.canManageBookings
    if (typeof permissions.canManageServices === "boolean") updates.can_manage_services = permissions.canManageServices
    if (typeof permissions.canManageMembers === "boolean") updates.can_manage_members = permissions.canManageMembers
    if (typeof permissions.canViewPayments === "boolean") updates.can_view_payments = permissions.canViewPayments
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const { error } = await supabase
    .from("org_members")
    .update(updates)
    .eq("id", memberId)
    .eq("org_id", membership.org_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .single()

  if (!membership) {
    return NextResponse.json({ error: "Only owners can remove members" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get("id")

  if (!memberId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const { data: target } = await supabase
    .from("org_members")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("org_id", membership.org_id)
    .single()

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  if (target.user_id === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
  }

  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot remove another owner" }, { status: 400 })
  }

  const { error } = await supabase
    .from("org_members")
    .delete()
    .eq("id", memberId)
    .eq("org_id", membership.org_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
