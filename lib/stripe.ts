import "server-only"
import Stripe from "stripe"

// Pinned to 2024-06-20. Several integration points — notably the
// subscription webhook — read fields that newer API versions relocated off
// the root object (subscription.current_period_*, invoice.subscription,
// invoice.charge). Pinning in code (rather than relying on the account's
// dashboard default) keeps that shape stable across environments.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
})
