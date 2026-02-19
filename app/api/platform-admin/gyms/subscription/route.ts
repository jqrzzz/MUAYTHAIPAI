import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Manually toggle gym subscription status (for platform admin)
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if platform admin
  const { data: userData } = await supabase.from("users").select("is_platform_admin").eq("id", user.id).single()

  if (!userData?.is_platform_admin) {
    return NextResponse.json({ error: "Not a platform admin" }, { status: 403 })
  }

  const { gymId, status } = await request.json()

  if (!gymId || !status) {
    return NextResponse.json({ error: "Missing gymId or status" }, { status: 400 })
  }

  // Update subscription status
  const { error } = await supabase
    .from("gym_subscriptions")
    .update({
      status: status,
      current_period_start: status === "active" ? new Date().toISOString() : undefined,
      current_period_end:
        status === "active" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    })
    .eq("org_id", gymId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
