import { NextResponse } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth-helpers"
import { THB_TO_USD_RATE } from "@/lib/payment-config"

// "What does OckOck actually keep?" — net reconciliation across the two
// income streams, in USD (the settlement currency):
//
//   platform net = subscription revenue (net of Stripe fees)
//                + booking commission (net of Stripe fees)
//
// Booking funds owed to gyms are a pass-through liability, settled via
// Payouts — reported separately, NOT counted as platform income.
//
// Defensive by design: the Stripe-fee columns (migration 039) and the
// subscription-invoice table (migration 040) may not be applied yet. If a
// source is missing we mark it unavailable instead of erroring, so the
// card works today and gets richer once those migrations land.

interface BookingRow {
  commission_amount_usd: number | null
  payment_amount_usd: number | null
}

export async function GET() {
  const auth = await requirePlatformAdmin({ billing: true })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase } = auth

  // Commission + gym liability — uses columns that always exist.
  const { data: bookings, error: bErr } = await supabase
    .from("bookings")
    .select("commission_amount_usd, payment_amount_usd")
    .eq("payment_status", "paid")
  if (bErr) {
    return NextResponse.json({ error: bErr.message }, { status: 500 })
  }

  let commissionUsd = 0
  let bookingGrossUsd = 0
  let owedToGymsUsd = 0
  for (const b of (bookings as BookingRow[]) || []) {
    const commission = Number(b.commission_amount_usd) || 0
    const gross = Number(b.payment_amount_usd) || 0
    commissionUsd += commission
    bookingGrossUsd += gross
    owedToGymsUsd += Math.max(0, gross - commission)
  }

  // Booking Stripe fees — migration 039. Unavailable if not yet applied.
  let bookingFeesUsd = 0
  let feesAvailable = true
  {
    const { data, error } = await supabase
      .from("bookings")
      .select("stripe_fee_cents")
      .eq("payment_status", "paid")
    if (error) {
      feesAvailable = false
    } else {
      bookingFeesUsd =
        (data as { stripe_fee_cents: number | null }[] | null)?.reduce(
          (s, r) => s + (r.stripe_fee_cents || 0),
          0,
        ) ?? 0
      bookingFeesUsd = bookingFeesUsd / 100
    }
  }

  // Subscription revenue (net) — migration 040 (gym_subscription_invoices).
  let saasNetUsd = 0
  let saasGrossUsd = 0
  let saasAvailable = true
  {
    const { data, error } = await supabase
      .from("gym_subscription_invoices")
      .select("net_usd_cents, amount_paid_usd_cents")
      .eq("status", "paid")
    if (error) {
      saasAvailable = false
    } else {
      for (const r of (data as { net_usd_cents: number | null; amount_paid_usd_cents: number | null }[] | null) || []) {
        saasNetUsd += (r.net_usd_cents || 0) / 100
        saasGrossUsd += (r.amount_paid_usd_cents || 0) / 100
      }
    }
  }

  const bookingNetUsd = commissionUsd - bookingFeesUsd
  const platformNetUsd = saasNetUsd + bookingNetUsd

  return NextResponse.json({
    rate: THB_TO_USD_RATE,
    saas: { netUsd: saasNetUsd, grossUsd: saasGrossUsd, available: saasAvailable },
    bookings: {
      commissionUsd,
      feesUsd: bookingFeesUsd,
      netUsd: bookingNetUsd,
      grossUsd: bookingGrossUsd,
      feesAvailable,
    },
    owedToGymsUsd,
    platformNetUsd,
  })
}
