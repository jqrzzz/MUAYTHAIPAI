/**
 * POST /api/promoter/events/[id]/cancel
 *
 * Cancels a fight event and processes refunds for every paid ticket
 * order. Real operational moment — weather, fighter injury, venue
 * issue. The promoter needs one button that does the right thing.
 *
 * Body (optional): { reason?: string }
 *
 * Steps:
 *   1. Flip fight_events.status to 'cancelled' + ticket_sales_open=false
 *   2. Find all paid orders for the event
 *   3. For each Stripe order: stripe.refunds.create with reason +
 *      metadata. The webhook (from Batch AI) does the actual state
 *      transition + quantity_sold decrement when it fires.
 *   4. For each cash/transfer order: mark payment_status='refunded' +
 *      status='refunded' directly in DB (no Stripe payment to reverse)
 *
 * Returns a summary: { stripe_refunds_initiated, cash_marked_cancelled,
 * failed, total }. Errors don't roll back successful refunds —
 * cancellation is best-effort and the summary tells the promoter what
 * worked vs what needs follow-up.
 *
 * Idempotency: if the event is already cancelled we skip the status
 * flip but still re-process any orders that are still 'paid' (covers
 * the case where the first attempt timed out mid-loop).
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"
import { stripe } from "@/lib/stripe"
import { hasEnv } from "@/lib/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Wide timeout cap — refunding 100 tickets sequentially through
// Stripe is real work. We chunk + fire-and-forget the slow path to
// stay under Vercel's 60s serverless limit.
const STRIPE_REFUND_CONCURRENCY = 4

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params

  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const reason =
    typeof body?.reason === "string" && body.reason.trim().length > 0
      ? body.reason.trim().slice(0, 500)
      : null

  // 1. Flip event status. Skip if already cancelled (idempotency).
  const { data: event } = await supabase
    .from("fight_events")
    .select("status, name")
    .eq("id", eventId)
    .maybeSingle()
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }
  const wasAlreadyCancelled = event.status === "cancelled"
  if (!wasAlreadyCancelled) {
    const { error: statusErr } = await supabase
      .from("fight_events")
      .update({
        status: "cancelled",
        ticket_sales_open: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .eq("org_id", auth.orgId)
    if (statusErr) {
      return NextResponse.json(
        { error: `Couldn't cancel event: ${statusErr.message}` },
        { status: 500 },
      )
    }
  }

  // 2. Load all still-paid orders. Refunded ones from a prior attempt
  // are excluded — we only re-process what's left.
  const { data: paidOrders } = await supabase
    .from("ticket_orders")
    .select(
      "id, order_reference, payment_method, payment_status, stripe_payment_intent_id, quantity, ticket_id",
    )
    .eq("event_id", eventId)
    .eq("payment_status", "paid")

  if (!paidOrders || paidOrders.length === 0) {
    return NextResponse.json({
      status: "cancelled",
      already_cancelled: wasAlreadyCancelled,
      summary: {
        stripe_refunds_initiated: 0,
        cash_marked_cancelled: 0,
        failed: 0,
        total: 0,
      },
    })
  }

  // 3 + 4. Split orders by payment method.
  const stripeOrders = paidOrders.filter(
    (o) => o.payment_method === "stripe" && o.stripe_payment_intent_id,
  )
  const cashOrders = paidOrders.filter(
    (o) => o.payment_method === "cash" || o.payment_method === "transfer",
  )

  // Stripe refunds — chunked through Stripe in small concurrent
  // batches so we don't blow out Vercel's serverless budget on big
  // shows. Webhook (from Batch AI) handles the per-order state flip.
  let stripeInitiated = 0
  let stripeFailed = 0
  if (stripeOrders.length > 0 && hasEnv("STRIPE_SECRET_KEY")) {
    for (let i = 0; i < stripeOrders.length; i += STRIPE_REFUND_CONCURRENCY) {
      const chunk = stripeOrders.slice(i, i + STRIPE_REFUND_CONCURRENCY)
      // eslint-disable-next-line no-await-in-loop
      const results = await Promise.allSettled(
        chunk.map((o) =>
          stripe.refunds.create({
            payment_intent: o.stripe_payment_intent_id!,
            // requested_by_customer is the closest standard reason for
            // a promoter-initiated cancellation; Stripe's other reasons
            // (duplicate, fraudulent) don't fit.
            reason: "requested_by_customer",
            metadata: {
              kind: "ticket",
              ticket_order_id: o.id,
              order_reference: o.order_reference ?? "",
              cancellation: "event_cancelled",
              cancellation_reason: reason ?? "",
              initiated_by_user_id: auth.userId,
              initiated_by_org_id: auth.orgId,
            },
          }),
        ),
      )
      for (const r of results) {
        if (r.status === "fulfilled") stripeInitiated++
        else stripeFailed++
      }
    }
  } else if (stripeOrders.length > 0) {
    // Stripe not configured — count them all as failed so the promoter
    // sees a clear summary line.
    stripeFailed += stripeOrders.length
  }

  // Cash + transfer: no payment to reverse, just mark refunded.
  let cashMarked = 0
  let cashFailed = 0
  if (cashOrders.length > 0) {
    const ids = cashOrders.map((o) => o.id)
    const { error: cashErr } = await supabase
      .from("ticket_orders")
      .update({
        payment_status: "refunded",
        status: "refunded",
      })
      .in("id", ids)
    if (cashErr) {
      console.error("[event.cancel] cash refund mark failed:", cashErr)
      cashFailed = cashOrders.length
    } else {
      cashMarked = cashOrders.length
      // Release the seats — same read-then-write pattern the Stripe
      // webhook uses. Group by ticket_id so we sum correctly per tier.
      const seatReleases = new Map<string, number>()
      for (const o of cashOrders) {
        seatReleases.set(o.ticket_id, (seatReleases.get(o.ticket_id) ?? 0) + o.quantity)
      }
      for (const [ticketId, qty] of seatReleases) {
        // eslint-disable-next-line no-await-in-loop
        const { data: tier } = await supabase
          .from("event_tickets")
          .select("quantity_sold")
          .eq("id", ticketId)
          .maybeSingle()
        if (tier) {
          // eslint-disable-next-line no-await-in-loop
          await supabase
            .from("event_tickets")
            .update({
              quantity_sold: Math.max(0, (tier.quantity_sold ?? 0) - qty),
            })
            .eq("id", ticketId)
        }
      }
    }
  }

  return NextResponse.json({
    status: "cancelled",
    already_cancelled: wasAlreadyCancelled,
    summary: {
      stripe_refunds_initiated: stripeInitiated,
      cash_marked_cancelled: cashMarked,
      failed: stripeFailed + cashFailed,
      total: paidOrders.length,
    },
  })
}
