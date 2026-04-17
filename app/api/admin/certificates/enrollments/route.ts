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

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership) {
    return NextResponse.json({ error: "No organization access" }, { status: 403 })
  }

  const { data: enrollments, error } = await supabase
    .from("certification_enrollments")
    .select(`
      id, level, status, enrolled_at, payment_status, payment_amount_thb,
      users:user_id (full_name, email)
    `)
    .eq("org_id", membership.org_id)
    .order("enrolled_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ enrollments: enrollments || [] })
}
