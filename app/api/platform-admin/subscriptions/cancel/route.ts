/**
 * POST /api/platform-admin/subscriptions/cancel
 *
 * Real subscription cancel with Stripe write-back, reason capture, and
 * audit log. Replaces the binary "Unsubscribe" toggle that flipped
 * gym_subscriptions.status directly and left Stripe happily charging
 * the gym afterwards.
 *
 * - Platform admin only (full, not partner — billing surface).
 * - A non-empty `reason` is required (captured in the audit log).
 * - Stripe sub is cancelled IMMEDIATELY (not at_period_end) — this is
 *   the admin override path; gym-owner-driven "cancel at period end"
 *   belongs in a future customer-portal flow.
 * - Audit is written BEFORE Stripe is called, so even if Stripe errors
 *   we still have a record the admin attempted the cancel.
 * - On Stripe error → 502 (upstream gateway), DB not touched.
 * - Idempotent: cancelling an already-cancelled sub is a 200 no-op.
 * - Trial gyms (no stripe_subscription_id) get the DB update only;
 *   nothing to cancel upstream.
 */
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { logAudit } from "@/lib/audit-log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const { supabase, user, isPlatformAdmin, role } = await getPlatformAdmin()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!isPlatformAdmin || role === "partner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const gymId = typeof body?.gymId === "string" ? body.gymId : null
  const reason = typeof body?.reason === "string" ? body.reason.trim() : ""

  if (!gymId) {
    return NextResponse.json({ error: "Missing gymId" }, { status: 400 })
  }
  if (!reason) {
    return NextResponse.json(
      { error: "A non-empty reason is required for cancellation." },
      { status: 400 },
    )
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", gymId)
    .single()

  if (!org) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  const { data: sub } = await supabase
    .from("gym_subscriptions")
    .select("status, stripe_subscription_id")
    .eq("org_id", gymId)
    .single()

  if (!sub) {
    return NextResponse.json(
      { error: "No subscription record found for this gym." },
      { status: 404 },
    )
  }

  // Already cancelled → idempotent no-op (still safe to call multiple
  // times from a panicked admin).
  if (sub.status === "cancelled") {
    return NextResponse.json({ ok: true, alreadyCancelled: true })
  }

  // Audit FIRST so we have a record even if Stripe errors below.
  await logAudit(supabase, {
    action: "subscription.cancel",
    actorUserId: user.id,
    actorEmail: user.email,
    targetType: "organization",
    targetId: org.id,
    targetLabel: org.name,
    metadata: {
      org_slug: org.slug,
      reason,
      stripe_subscription_id: sub.stripe_subscription_id ?? null,
      previous_status: sub.status,
    },
    request,
  })

  if (sub.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown Stripe error"
      return NextResponse.json(
        { error: `Stripe couldn't cancel the subscription: ${message}` },
        { status: 502 },
      )
    }
  }

  await supabase
    .from("gym_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("org_id", gymId)

  return NextResponse.json({ ok: true })
}
