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

  // Handle subscription events for both gym and student subscriptions
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      if (session.mode !== "subscription") break

      const subscriptionId = session.subscription as string
      const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as {
        current_period_start: number
        current_period_end: number
      }
      const periodStart = new Date(subscription.current_period_start * 1000).toISOString()
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

      if (session.metadata?.type === "student_subscription" && session.metadata?.user_id) {
        const userId = session.metadata.user_id
        await supabase
          .from("student_subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer as string,
              status: "active",
              current_period_start: periodStart,
              current_period_end: periodEnd,
            },
            { onConflict: "user_id" }
          )
        console.log(`Student subscription activated for user ${userId}`)
      } else if (session.metadata?.org_id) {
        await supabase
          .from("gym_subscriptions")
          .update({
            stripe_subscription_id: subscriptionId,
            status: "active",
            current_period_start: periodStart,
            current_period_end: periodEnd,
          })
          .eq("org_id", session.metadata.org_id)
        console.log(`Gym subscription activated for org ${session.metadata.org_id}`)
      }
      break
    }

    case "invoice.paid": {
      const invoice = event.data.object as unknown as { subscription?: string }
      if (!invoice.subscription) break

      const subId = invoice.subscription
      const { data: gymSub } = await supabase
        .from("gym_subscriptions")
        .select("org_id")
        .eq("stripe_subscription_id", subId)
        .single()

      if (gymSub) {
        await supabase.from("gym_subscriptions").update({ status: "active" }).eq("org_id", gymSub.org_id)
      } else {
        const { data: studentSub } = await supabase
          .from("student_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subId)
          .single()
        if (studentSub) {
          await supabase.from("student_subscriptions").update({ status: "active" }).eq("user_id", studentSub.user_id)
        }
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as unknown as { subscription?: string }
      if (!invoice.subscription) break

      const subId = invoice.subscription
      const { data: gymSub } = await supabase
        .from("gym_subscriptions")
        .select("org_id")
        .eq("stripe_subscription_id", subId)
        .single()

      if (gymSub) {
        await supabase.from("gym_subscriptions").update({ status: "past_due" }).eq("org_id", gymSub.org_id)
      } else {
        const { data: studentSub } = await supabase
          .from("student_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subId)
          .single()
        if (studentSub) {
          await supabase.from("student_subscriptions").update({ status: "past_due" }).eq("user_id", studentSub.user_id)
        }
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object
      const { data: gymSub } = await supabase
        .from("gym_subscriptions")
        .select("org_id")
        .eq("stripe_subscription_id", subscription.id)
        .single()

      if (gymSub) {
        await supabase
          .from("gym_subscriptions")
          .update({ status: "cancelled", stripe_subscription_id: null })
          .eq("org_id", gymSub.org_id)
      } else {
        const { data: studentSub } = await supabase
          .from("student_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single()
        if (studentSub) {
          await supabase
            .from("student_subscriptions")
            .update({
              status: "cancelled",
              stripe_subscription_id: null,
              cancelled_at: new Date().toISOString(),
            })
            .eq("user_id", studentSub.user_id)
        }
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as unknown as {
        id: string
        status: string
        current_period_end: number
      }
      const newStatus =
        subscription.status === "active"
          ? "active"
          : subscription.status === "past_due"
            ? "past_due"
            : subscription.status === "canceled"
              ? "cancelled"
              : subscription.status
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

      const { data: gymSub } = await supabase
        .from("gym_subscriptions")
        .select("org_id")
        .eq("stripe_subscription_id", subscription.id)
        .single()

      if (gymSub) {
        await supabase
          .from("gym_subscriptions")
          .update({ status: newStatus, current_period_end: periodEnd })
          .eq("org_id", gymSub.org_id)
      } else {
        const { data: studentSub } = await supabase
          .from("student_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single()
        if (studentSub) {
          await supabase
            .from("student_subscriptions")
            .update({ status: newStatus, current_period_end: periodEnd })
            .eq("user_id", studentSub.user_id)
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
