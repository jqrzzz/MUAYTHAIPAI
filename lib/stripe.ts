import "server-only"
import Stripe from "stripe"

// Pinned to 2024-06-20. Several integration points — notably the
// subscription webhook — read fields that newer API versions relocated off
// the root object (subscription.current_period_*, invoice.subscription,
// invoice.charge). Pinning in code (rather than relying on the account's
// dashboard default) keeps that shape stable across environments.
const API_VERSION: Stripe.LatestApiVersion = "2024-06-20" as Stripe.LatestApiVersion

// Lazy so a missing STRIPE_SECRET_KEY doesn't crash `next build` page-data
// collection when route modules are imported for static analysis. The
// Proxy keeps the existing `import { stripe }` call sites unchanged; the
// real client is only constructed on first property access.
let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: API_VERSION })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver)
  },
})
