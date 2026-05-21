import { NextResponse } from "next/server"
import Stripe from "stripe"
import { env, hasEnv } from "@/lib/env"
import { requirePlatformAdmin } from "@/lib/auth-helpers"

// Real money position from the Stripe API for the super admin: what's in our
// balance and what Stripe has actually paid out to our bank (and when).
// This is the source of truth for "have we been paid", distinct from the
// DB-recorded booking/subscription totals.
//
// NOTE: this is the *gross* platform balance. Because booking payments are
// collected into the platform account and later settled to gyms (manual
// payouts), the balance includes funds owed to gyms — it is not net profit.

export async function GET() {
  // Money surface — full platform admins only (partners excluded).
  const auth = await requirePlatformAdmin({ billing: true })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!hasEnv("STRIPE_SECRET_KEY")) {
    return NextResponse.json({ configured: false })
  }

  // Construct in-handler (not the shared singleton) so a missing key never
  // throws at module load — keeps the "not configured" path graceful.
  const stripe = new Stripe(env.stripe.secretKey(), {
    apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
  })

  try {
    const [balance, payoutList, account] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.payouts.list({ limit: 12 }),
      stripe.accounts.retrieve(),
    ])

    const currency = account.default_currency || balance.available[0]?.currency || "usd"
    const sumFor = (entries: { amount: number; currency: string }[]) =>
      entries.filter((e) => e.currency === currency).reduce((s, e) => s + e.amount, 0)

    const payouts = payoutList.data.map((p) => ({
      id: p.id,
      amountCents: p.amount,
      currency: p.currency,
      status: p.status,
      automatic: p.automatic,
      description: p.description,
      arrivalDate: p.arrival_date ? new Date(p.arrival_date * 1000).toISOString() : null,
      created: new Date(p.created * 1000).toISOString(),
    }))

    return NextResponse.json({
      configured: true,
      currency,
      availableCents: sumFor(balance.available),
      pendingCents: sumFor(balance.pending),
      payouts,
    })
  } catch (err) {
    console.error("[stripe-finance] Stripe API call failed:", err)
    return NextResponse.json({ error: "Failed to load Stripe finance" }, { status: 502 })
  }
}
