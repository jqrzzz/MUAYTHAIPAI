import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch all services for the organization
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's organization
  const { data: membership } = await supabase.from("org_members").select("org_id, role").eq("user_id", user.id).single()

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 })
  }

  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("display_order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ services })
}

// POST - Create a new service
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's organization and verify they're owner/admin
  const { data: membership } = await supabase.from("org_members").select("org_id, role").eq("user_id", user.id).single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()

  const { data: service, error } = await supabase
    .from("services")
    .insert({
      org_id: membership.org_id,
      name: body.name,
      description: body.description || null,
      category: body.category || "training",
      price_thb: body.price_thb,
      duration_minutes: body.duration_minutes || null,
      requires_time_slot: body.requires_time_slot ?? true,
      is_active: body.is_active ?? true,
      is_featured: body.is_featured ?? false,
      display_order: body.display_order || 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ service })
}
