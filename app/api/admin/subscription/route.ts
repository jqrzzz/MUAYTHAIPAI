/**
 * Current gym's subscription state — drives the trial countdown widget
 * on the admin Today tab and any future billing-status surfaces.
 *
 *   GET — returns status (trial/active/cancelled/missing), trial end
 *         date (if applicable), days remaining, period end (if active).
 *
 * "missing" means there's no gym_subscriptions row at all — usually a
 * pre-Stripe gym that was set up manually. We don't want to nag those.
 */
import { NextResponse } from "next/server"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const { data: sub } = await supabase
    .from("gym_subscriptions")
    .select("status, trial_ends_at, current_period_end, activated_at, cancelled_at, monthly_price_usd_cents, stripe_customer_id")
    .eq("org_id", orgId)
    .maybeSingle()

  if (!sub) {
    return NextResponse.json({
      status: "missing",
      trial_ends_at: null,
      current_period_end: null,
      days_remaining: null,
    })
  }

  const now = Date.now()
  let daysRemaining: number | null = null
  if (sub.status === "trial" && sub.trial_ends_at) {
    daysRemaining = Math.ceil(
      (new Date(sub.trial_ends_at).getTime() - now) / (24 * 60 * 60 * 1000),
    )
  } else if (sub.status === "active" && sub.current_period_end) {
    daysRemaining = Math.ceil(
      (new Date(sub.current_period_end).getTime() - now) / (24 * 60 * 60 * 1000),
    )
  }

  return NextResponse.json({
    status: sub.status,
    trial_ends_at: sub.trial_ends_at,
    current_period_end: sub.current_period_end,
    activated_at: sub.activated_at,
    cancelled_at: sub.cancelled_at,
    monthly_price_usd_cents: sub.monthly_price_usd_cents,
    days_remaining: daysRemaining,
    // We never leak the Stripe customer ID to the client; just whether
    // the gym has one (drives the "Manage subscription" CTA gate).
    has_stripe_customer: Boolean(sub.stripe_customer_id),
  })
}
