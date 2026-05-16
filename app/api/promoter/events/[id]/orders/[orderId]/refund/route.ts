/**
 * POST /api/promoter/events/[id]/orders/[orderId]/refund
 *
 * Promoter-initiated ticket refund. Validates the order belongs to
 * the promoter's event, calls Stripe's refunds.create with the order's
 * payment intent, and returns the refund ID. The actual state
 * transition (payment_status → 'refunded', quantity_sold decrement)
 * happens inside the charge.refunded webhook so we keep a single
 * source of truth and stay consistent with refunds initiated directly
 * from the Stripe Dashboard.
 *
 * Body (optional): { reason?: 'requested_by_customer' | 'duplicate' |
 *                              'fraudulent' }
 *
 * Returns: { refund_id }
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"
import { stripe } from "@/lib/stripe"
import { hasEnv } from "@/lib/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VALID_REASONS = new Set([
  "requested_by_customer",
  "duplicate",
  "fraudulent",
])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; orderId: string }> },
) {
  const { id: eventId, orderId } = await params

  if (!hasEnv("STRIPE_SECRET_KEY")) {
    return NextResponse.json(
      { error: "Stripe isn't configured — refund can't be issued from here." },
      { status: 503 },
    )
  }

  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const reason = typeof body?.reason === "string" && VALID_REASONS.has(body.reason)
    ? (body.reason as "requested_by_customer" | "duplicate" | "fraudulent")
    : "requested_by_customer"

  const { data: order } = await supabase
    .from("ticket_orders")
    .select("id, event_id, payment_status, status, stripe_payment_intent_id, total_price_thb, order_reference")
    .eq("id", orderId)
    .maybeSingle()

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }
  if (order.event_id !== eventId) {
    return NextResponse.json({ error: "Order doesn't belong to this event" }, { status: 400 })
  }
  if (order.payment_status === "refunded" || order.status === "refunded") {
    return NextResponse.json(
      { error: "This order is already refunded." },
      { status: 409 },
    )
  }
  if (order.payment_status !== "paid") {
    return NextResponse.json(
      { error: `Can't refund a ${order.payment_status} order.` },
      { status: 400 },
    )
  }
  if (!order.stripe_payment_intent_id) {
    return NextResponse.json(
      {
        error:
          "This order has no Stripe payment to refund. If it was paid by cash or transfer, mark it cancelled manually.",
      },
      { status: 400 },
    )
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      reason,
      metadata: {
        kind: "ticket",
        ticket_order_id: order.id,
        order_reference: order.order_reference ?? "",
        initiated_by_user_id: auth.userId,
        initiated_by_org_id: auth.orgId,
      },
    })

    // We don't update ticket_orders here — the webhook handles that
    // when charge.refunded fires. This keeps refunds from the Stripe
    // Dashboard consistent with refunds from this endpoint. Surface
    // the Stripe refund id so the UI can optimistically render
    // "refund pending" until the webhook flips status.
    return NextResponse.json({
      refund_id: refund.id,
      status: refund.status,
    })
  } catch (err) {
    console.error("[refund] stripe failed:", err)
    const message = err instanceof Error ? err.message : "Refund failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
