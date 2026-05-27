import { getPlatformAdmin } from "@/lib/auth-helpers"
import { NextResponse } from "next/server"

// Allowed values for gym_subscriptions.status when set manually by a
// platform admin. Anything else gets a 400 — previously this endpoint
// accepted ANY string and wrote garbage into the column.
const ALLOWED_STATUSES = new Set([
  "trial",
  "active",
  "past_due",
  "cancelled",
  "paused",
])

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

  // Cancellation goes through the dedicated cancel endpoint so it
  // captures a reason, audits, and actually tells Stripe. This toggle
  // is for status flips that don't have a money side-effect.
  if (status === "cancelled" || status === "inactive") {
    return NextResponse.json(
      {
        error:
          "Use /api/platform-admin/subscriptions/cancel to cancel a subscription — that endpoint captures a reason, writes audit, and cancels the Stripe sub.",
      },
      { status: 400 },
    )
  }

  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json(
      {
        error: `Invalid status "${status}". Allowed: ${[...ALLOWED_STATUSES].join(", ")}.`,
      },
      { status: 400 },
    )
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
