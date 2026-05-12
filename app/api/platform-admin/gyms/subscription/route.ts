import { getPlatformAdmin } from "@/lib/auth-helpers"
import { NextResponse } from "next/server"

// Manually toggle gym subscription status (for platform admin)
export async function POST(request: Request) {
  const { supabase, user, isPlatformAdmin, role } = await getPlatformAdmin()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isPlatformAdmin || role === "partner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
