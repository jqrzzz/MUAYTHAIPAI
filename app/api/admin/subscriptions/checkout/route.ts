import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { requireGymOwner } from "@/lib/auth-helpers"
import { PLAN } from "@/lib/ockock/product"

// Whitelist of post-checkout destinations. Mirrors safeRedirect() in
// app/admin/login/client.tsx. Without this, a crafted returnUrl like
// "http://evil.com" would slip through the old `absolute()` helper —
// money still goes to our Stripe account (price + customer + org_id
// are server-pinned), but the user lands on an attacker page after
// payment, perfect for a fake "subscription confirmed, log in again"
// phishing flow. Restrict to same-origin paths under the surfaces
// that legitimately punt people through Stripe and back.
function safeReturnPath(raw: unknown): string {
  if (typeof raw !== "string") return "/admin"
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin"
  const allowed = ["/admin", "/onboarding"]
  if (
    allowed.some(
      (p) => raw === p || raw.startsWith(`${p}/`) || raw.startsWith(`${p}?`),
    )
  ) {
    return raw
  }
  return "/admin"
}

/**
 * POST /api/admin/subscriptions/checkout
 *
 * Self-serve Stripe checkout for the authenticated gym owner. Mirrors
 * /api/platform-admin/subscriptions/route.ts (which is platform-admin
 * only) but auth'd as the gym owner — subscription billing belongs to
 * whoever owns the gym, not to platform-admin alone.
 *
 * One product, one price (PLAN.priceUSDCents). Future: if/when there
 * are tiers, add a `plan` param and look up the price from PLAN. For
 * now the single canonical plan is the only thing on offer.
 *
 * Defensive: refuses if the gym already has an active stripe
 * subscription (no double-charge). Portal-management for existing subs
 * is a separate Tier 2 piece; this endpoint is purely for the FIRST
 * self-serve charge that converts a trial to paid.
 */
export async function POST(request: Request) {
  const auth = await requireGymOwner()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, user, orgId } = auth

  // returnUrl defaults to /admin so the gym always lands back somewhere
  // sane after Stripe. Allowlisted via safeReturnPath above.
  const body = await request.json().catch(() => ({} as { returnUrl?: string }))
  const returnUrl = safeReturnPath(body?.returnUrl)

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, email")
    .eq("id", orgId)
    .single()

  if (!org) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  const { data: subscription } = await supabase
    .from("gym_subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("org_id", orgId)
    .single()

  // Already-active subscription guard. Prevents accidental double-checkout
  // if a user hits the trial CTA after they've already upgraded.
  if (subscription?.stripe_subscription_id) {
    return NextResponse.json(
      {
        error:
          "Subscription is already active. Manage billing from the customer portal.",
      },
      { status: 409 },
    )
  }

  // Reuse an existing Stripe customer if we created one before (e.g. a
  // failed earlier checkout); otherwise create + save.
  let customerId = subscription?.stripe_customer_id ?? null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org.email || user.email || undefined,
      name: org.name,
      metadata: {
        org_id: org.id,
        org_slug: org.slug,
      },
    })
    customerId = customer.id

    await supabase
      .from("gym_subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("org_id", orgId)
  }

  // Build absolute return URLs so Stripe sends users to the right host
  // regardless of where the request originated (preview, prod, local).
  // safeReturnPath guarantees returnUrl is same-origin starting with "/",
  // so a simple concat is safe — no need to re-check for absolute URLs.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "OckOck — Muay Thai gym platform",
            description: "Monthly subscription. Cancel anytime.",
          },
          unit_amount: PLAN.priceUSDCents,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}${returnUrl}?subscription=success`,
    cancel_url: `${baseUrl}${returnUrl}?subscription=cancelled`,
    metadata: {
      org_id: org.id,
    },
  })

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe didn't return a checkout URL. Please try again." },
      { status: 500 },
    )
  }

  return NextResponse.json({ url: session.url })
}
