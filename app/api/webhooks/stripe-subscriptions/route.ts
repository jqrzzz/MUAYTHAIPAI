import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Use service role for webhooks (no user context)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("Webhook signature verification failed:", errorMessage)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Handle subscription events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      if (session.mode === "subscription" && session.metadata?.org_id) {
        const orgId = session.metadata.org_id
        const subscriptionId = session.subscription as string

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Update gym subscription
        await supabase
          .from("gym_subscriptions")
          .update({
            stripe_subscription_id: subscriptionId,
            status: "active",
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("org_id", orgId)

        console.log(`Subscription activated for org ${orgId}`)
      }
      break
    }

    case "invoice.paid": {
      const invoice = event.data.object
      if (invoice.subscription) {
        // Find org by subscription ID
        const { data: sub } = await supabase
          .from("gym_subscriptions")
          .select("org_id")
          .eq("stripe_subscription_id", invoice.subscription)
          .single()

        if (sub) {
          await supabase.from("gym_subscriptions").update({ status: "active" }).eq("org_id", sub.org_id)
        }
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object
      if (invoice.subscription) {
        const { data: sub } = await supabase
          .from("gym_subscriptions")
          .select("org_id")
          .eq("stripe_subscription_id", invoice.subscription)
          .single()

        if (sub) {
          await supabase.from("gym_subscriptions").update({ status: "past_due" }).eq("org_id", sub.org_id)
        }
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object
      const { data: sub } = await supabase
        .from("gym_subscriptions")
        .select("org_id")
        .eq("stripe_subscription_id", subscription.id)
        .single()

      if (sub) {
        await supabase
          .from("gym_subscriptions")
          .update({
            status: "cancelled",
            stripe_subscription_id: null,
          })
          .eq("org_id", sub.org_id)
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object
      const { data: sub } = await supabase
        .from("gym_subscriptions")
        .select("org_id")
        .eq("stripe_subscription_id", subscription.id)
        .single()

      if (sub) {
        const status =
          subscription.status === "active"
            ? "active"
            : subscription.status === "past_due"
              ? "past_due"
              : subscription.status === "canceled"
                ? "cancelled"
                : subscription.status

        await supabase
          .from("gym_subscriptions")
          .update({
            status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("org_id", sub.org_id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
