import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Use service role for webhooks (no user context)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * Stripe SDK 18.x types reflect API version 2025-04-30.basil, which
 * relocated some fields (subscription.current_period_*, invoice.subscription,
 * invoice.charge) off the root object. Our integration is pinned to
 * 2024-06-20 in @/lib/stripe so the API still returns them at the root.
 *
 * Type aliases below let us access the legacy shape without per-call
 * `as any` casts littered throughout the file.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacySub = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacyInvoice = any

/**
 * Pull the monthly price out of a Stripe subscription, in USD cents.
 * Handles the common case (single line item, monthly billing). Returns
 * null for setups we don't understand so we don't lie about MRR.
 *
 * Typed as `any` because this repo doesn't carry the Stripe namespace
 * types — the singleton from `@/lib/stripe` is enough at runtime.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMonthlyUsdCents(subscription: any): number | null {
  const items = subscription?.items?.data ?? []
  if (items.length === 0) return null
  // Sum across all line items so multi-product subscriptions still work
  let total = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const item of items as any[]) {
    const price = item.price
    if (!price || price.currency !== "usd") return null
    if (!price.unit_amount) continue
    // Normalize to monthly
    if (price.recurring?.interval === "month") {
      total += price.unit_amount * (item.quantity ?? 1)
    } else if (price.recurring?.interval === "year") {
      total += Math.round((price.unit_amount * (item.quantity ?? 1)) / 12)
    } else {
      // weekly / daily — not used today, skip rather than guess
      continue
    }
  }
  return total > 0 ? total : null
}

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
        const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as LegacySub
        const monthlyUsdCents = extractMonthlyUsdCents(subscription)

        // Preserve the original activation timestamp on Stripe retries —
        // without this, every redelivery bumps activated_at forward and
        // we lose the real moment the gym went live.
        const { data: existing } = await supabase
          .from("gym_subscriptions")
          .select("activated_at")
          .eq("org_id", orgId)
          .maybeSingle()

        await supabase
          .from("gym_subscriptions")
          .update({
            stripe_subscription_id: subscriptionId,
            status: "active",
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            activated_at: existing?.activated_at ?? new Date().toISOString(),
            cancelled_at: null,
            monthly_price_usd_cents: monthlyUsdCents,
          })
          .eq("org_id", orgId)

        console.log(`Subscription activated for org ${orgId} at $${monthlyUsdCents ? (monthlyUsdCents / 100).toFixed(2) : "?"}/mo`)
      }
      break
    }

    case "invoice.paid": {
      const invoice = event.data.object as LegacyInvoice
      if (invoice.subscription) {
        // Find org by subscription ID
        const { data: sub } = await supabase
          .from("gym_subscriptions")
          .select("id, org_id, activated_at")
          .eq("stripe_subscription_id", invoice.subscription)
          .single()

        if (sub) {
          // Keep gym_subscriptions in sync — back to active if it was past_due
          await supabase
            .from("gym_subscriptions")
            .update({
              status: "active",
              // First successful invoice also counts as activation
              // (handles the case where checkout.session.completed didn't fire)
              activated_at: sub.activated_at ?? new Date().toISOString(),
            })
            .eq("org_id", sub.org_id)

          // Log the invoice for historical MRR tracking. Try to grab the
          // fee/net snapshot from the charge so the dashboard knows our
          // real take after Stripe's cut.
          let stripeFee: number | null = null
          let stripeNet: number | null = null
          let balanceTxId: string | null = null
          let chargeId: string | null = null
          let piId: string | null = null
          try {
            const invoiceChargeId = invoice.charge as string | null | undefined
            if (invoiceChargeId) {
              chargeId = invoiceChargeId
              const charge = await stripe.charges.retrieve(chargeId)
              piId = typeof charge.payment_intent === "string" ? charge.payment_intent : null
              balanceTxId =
                typeof charge.balance_transaction === "string"
                  ? charge.balance_transaction
                  : null
              if (balanceTxId) {
                const tx = await stripe.balanceTransactions.retrieve(balanceTxId)
                stripeFee = tx.fee ?? null
                stripeNet = tx.net ?? null
              }
            }
          } catch (err) {
            console.error("[webhook] Failed to fetch invoice fee snapshot:", err)
          }

          // upsert by stripe_invoice_id so retries don't double-insert
          await supabase
            .from("gym_subscription_invoices")
            .upsert(
              {
                org_id: sub.org_id,
                gym_subscription_id: sub.id,
                stripe_invoice_id: invoice.id,
                stripe_charge_id: chargeId,
                stripe_payment_intent_id: piId,
                stripe_balance_transaction_id: balanceTxId,
                amount_paid_usd_cents: invoice.amount_paid ?? 0,
                amount_due_usd_cents: invoice.amount_due ?? null,
                fee_usd_cents: stripeFee,
                net_usd_cents: stripeNet,
                status: "paid",
                period_start: invoice.period_start
                  ? new Date(invoice.period_start * 1000).toISOString()
                  : null,
                period_end: invoice.period_end
                  ? new Date(invoice.period_end * 1000).toISOString()
                  : null,
                paid_at: invoice.status_transitions?.paid_at
                  ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
                  : new Date().toISOString(),
              },
              { onConflict: "stripe_invoice_id" },
            )

          console.log(
            `Invoice paid for org ${sub.org_id}: $${((invoice.amount_paid ?? 0) / 100).toFixed(2)}` +
              (stripeFee != null ? ` (fee $${(stripeFee / 100).toFixed(2)})` : ""),
          )
        }
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as LegacyInvoice
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
      const subscription = event.data.object as LegacySub
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
            cancelled_at: new Date().toISOString(),
            stripe_subscription_id: null,
          })
          .eq("org_id", sub.org_id)
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as LegacySub
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

        const monthlyUsdCents = extractMonthlyUsdCents(subscription)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: Record<string, any> = {
          status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }
        if (monthlyUsdCents != null) {
          updates.monthly_price_usd_cents = monthlyUsdCents
        }
        if (status === "cancelled") {
          updates.cancelled_at = new Date().toISOString()
        }

        await supabase
          .from("gym_subscriptions")
          .update(updates)
          .eq("org_id", sub.org_id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
