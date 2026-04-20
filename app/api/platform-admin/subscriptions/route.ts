import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"
import { PAYMENT_CONFIG } from "@/lib/payment-config"

// Create a Stripe checkout session for gym subscription
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { orgId, returnUrl } = await request.json()

  // Get org and subscription info
  const { data: org } = await supabase.from("organizations").select("id, name, slug, email").eq("id", orgId).single()

  if (!org) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  const { data: subscription } = await supabase.from("gym_subscriptions").select("*").eq("org_id", orgId).single()

  // Create or retrieve Stripe customer
  let customerId = subscription?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org.email || user.email,
      name: org.name,
      metadata: {
        org_id: org.id,
        org_slug: org.slug,
      },
    })
    customerId = customer.id

    // Save customer ID
    await supabase.from("gym_subscriptions").update({ stripe_customer_id: customerId }).eq("org_id", orgId)
  }

  // Create checkout session for subscription
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Muay Thai Network - Gym Platform",
            description: "Monthly subscription for gym management platform",
          },
          unit_amount: PAYMENT_CONFIG.platform.gymSubscriptionUsd * 100,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?subscription=success`,
    cancel_url: `${returnUrl}?subscription=cancelled`,
    metadata: {
      org_id: org.id,
    },
  })

  return NextResponse.json({ url: session.url })
}

// Get subscription status
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get("orgId")

  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 })
  }

  const { data: subscription } = await supabase.from("gym_subscriptions").select("*").eq("org_id", orgId).single()

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
  }

  // If there's a Stripe subscription, get latest status
  if (subscription.stripe_subscription_id) {
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)

      // Update local status if different
      const newStatus =
        stripeSubscription.status === "active"
          ? "active"
          : stripeSubscription.status === "past_due"
            ? "past_due"
            : stripeSubscription.status

      if (subscription.status !== newStatus) {
        await supabase
          .from("gym_subscriptions")
          .update({
            status: newStatus,
            current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          })
          .eq("org_id", orgId)
      }

      return NextResponse.json({
        ...subscription,
        status: newStatus,
        stripe_status: stripeSubscription.status,
      })
    } catch (error) {
      console.error("Error fetching Stripe subscription:", error)
    }
  }

  return NextResponse.json(subscription)
}
