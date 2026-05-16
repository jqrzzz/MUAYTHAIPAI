/**
 * POST /api/admin/subscription/portal
 *
 * Mints a Stripe Customer Portal session URL for the current gym's
 * subscription. The portal lets the gym owner update card, view
 * invoices, change plan, or cancel — without us having to build any of
 * those flows in the dashboard.
 *
 * Returns { url } on success. Client redirects to it.
 *
 * Failure modes:
 *  - 404 missing_customer: gym has no gym_subscriptions row or no
 *    stripe_customer_id (e.g. trial-only gym, never paid). Surface as
 *    "Contact us to start a paid subscription."
 *  - 503 stripe_unconfigured: STRIPE_SECRET_KEY env var missing.
 */
import { NextResponse } from "next/server"
import { requireGymAdmin } from "@/lib/auth-helpers"
import { hasEnv } from "@/lib/env"
import { stripe } from "@/lib/stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  if (!hasEnv("STRIPE_SECRET_KEY")) {
    return NextResponse.json(
      { error: "Stripe is not configured. Contact support." },
      { status: 503 },
    )
  }
  const { supabase, orgId } = auth

  const { data: sub } = await supabase
    .from("gym_subscriptions")
    .select("stripe_customer_id")
    .eq("org_id", orgId)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      {
        error:
          "No paid subscription yet. Email hello@muaythaipai.com to start billing.",
      },
      { status: 404 },
    )
  }

  // Derive the return_url from the request so the portal redirects back
  // to the same dashboard the owner came from (settings page).
  const origin = new URL(request.url).origin
  const returnUrl = `${origin}/admin?tab=settings`

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: returnUrl,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[stripe.portal] failed to create portal session:", err)
    return NextResponse.json(
      { error: "Couldn't open billing portal. Try again or contact support." },
      { status: 500 },
    )
  }
}
