/**
 * POST /api/public/fights/[id]/tickets/[ticketId]/checkout
 *
 * Public-facing ticket purchase. Creates a pending ticket_orders row +
 * a Stripe Checkout Session, returns the session URL for the client to
 * redirect to. After Stripe collects payment, the webhook (kind=ticket)
 * marks the order paid, increments event_tickets.quantity_sold, and
 * fires the confirmation email.
 *
 * Body:
 *   {
 *     quantity: number (1..10),
 *     guest_name: string,
 *     guest_email: string,
 *     guest_phone?: string
 *   }
 */
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { createServiceClient } from "@/lib/supabase/service"
import { stripe } from "@/lib/stripe"
import { hasEnv } from "@/lib/env"
import { checkLimit, ipFromRequest } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const sb = createServiceClient()

const MAX_QTY = 10

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> },
) {
  const { id: eventId, ticketId } = await params

  // Per-IP rate limit. A flood here would (a) burn Stripe API
  // requests and (b) leave a trail of pending ticket_orders rows
  // polluting the promoter's analytics. 20/hr is generous for a
  // real visitor who hesitates and retries.
  const ip = ipFromRequest(request)
  const gate = await checkLimit({
    key: `checkout:${ip}`,
    max: 20,
    windowSeconds: 3600,
  }).catch(() => ({ ok: true as const, remaining: 20, resetAt: new Date() }))
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Try again in a moment." },
      { status: 429, headers: gate.headers },
    )
  }

  if (!hasEnv("STRIPE_SECRET_KEY")) {
    return NextResponse.json(
      { error: "Ticket sales aren't configured yet." },
      { status: 503 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const quantity = Math.max(1, Math.min(MAX_QTY, parseInt(body?.quantity, 10) || 1))
  const guestName = typeof body?.guest_name === "string" ? body.guest_name.trim() : ""
  const guestEmail = typeof body?.guest_email === "string" ? body.guest_email.trim() : ""
  const guestPhone =
    typeof body?.guest_phone === "string" && body.guest_phone.trim().length > 0
      ? body.guest_phone.trim()
      : null

  if (!guestName || !guestEmail || !guestEmail.includes("@")) {
    return NextResponse.json(
      { error: "Name and a valid email are required to buy a ticket." },
      { status: 400 },
    )
  }

  // Load event + ticket tier together, verify everything's sale-eligible.
  const [{ data: event }, { data: tier }] = await Promise.all([
    sb
      .from("fight_events")
      .select("id, name, event_date, status, ticket_sales_open, org_id, venue_city")
      .eq("id", eventId)
      .maybeSingle(),
    sb
      .from("event_tickets")
      .select(
        "id, event_id, tier_name, price_thb, price_usd, quantity_total, quantity_sold, is_active",
      )
      .eq("id", ticketId)
      .maybeSingle(),
  ])

  if (!event || event.status !== "published") {
    return NextResponse.json({ error: "Event not found." }, { status: 404 })
  }
  if (!event.ticket_sales_open) {
    return NextResponse.json(
      { error: "Ticket sales are closed for this event." },
      { status: 400 },
    )
  }
  if (!tier || tier.event_id !== eventId || !tier.is_active) {
    return NextResponse.json({ error: "Ticket tier not found." }, { status: 404 })
  }
  const remaining = tier.quantity_total - tier.quantity_sold
  if (remaining < quantity) {
    return NextResponse.json(
      {
        error:
          remaining <= 0
            ? "Sold out — try a different tier."
            : `Only ${remaining} ticket${remaining === 1 ? "" : "s"} left at this tier.`,
      },
      { status: 409 },
    )
  }

  const totalThb = tier.price_thb * quantity
  const totalUsd = tier.price_usd ? tier.price_usd * quantity : null

  // Short, scannable reference shown to the buyer + printed on the
  // ticket email. Random 6 hex chars over the tier prefix.
  const orderReference = `TKT-${tier.tier_name.replace(/[^A-Z0-9]/gi, "").slice(0, 4).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`

  // Pending order row — payment status flips to 'paid' inside the
  // Stripe webhook, which is the source of truth for "ticket valid".
  const { data: order, error: orderErr } = await sb
    .from("ticket_orders")
    .insert({
      event_id: eventId,
      ticket_id: ticketId,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      quantity,
      total_price_thb: totalThb,
      total_price_usd: totalUsd,
      payment_status: "pending",
      payment_method: "stripe",
      status: "confirmed",
      order_reference: orderReference,
    })
    .select("id")
    .single()
  if (orderErr || !order) {
    return NextResponse.json(
      { error: orderErr?.message || "Couldn't create order" },
      { status: 500 },
    )
  }

  // Stripe needs to return the buyer to the host they came from — using
  // the request origin keeps preview deployments + ockock.app both working.
  // Clean paths so the URL stays /fights/... in the address bar after return.
  const origin = new URL(request.url).origin
  const successUrl = `${origin}/fights/${eventId}/success?ref=${orderReference}`
  const cancelUrl = `${origin}/fights/${eventId}`

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: guestEmail,
      line_items: [
        {
          price_data: {
            currency: "thb",
            product_data: {
              name: `${event.name} — ${tier.tier_name}`,
              description: event.event_date
                ? new Date(event.event_date).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : undefined,
            },
            // Stripe expects amount in the smallest currency unit. THB is
            // 2 decimals (satang) so multiply by 100.
            unit_amount: tier.price_thb * 100,
          },
          quantity,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Routed by the webhook — kind=ticket plus ticket_order_id is enough
      // to look up everything else server-side without trusting the client.
      metadata: {
        kind: "ticket",
        ticket_order_id: order.id,
        event_id: eventId,
        ticket_id: ticketId,
        order_reference: orderReference,
      },
    })

    return NextResponse.json({ url: session.url, order_reference: orderReference })
  } catch (err) {
    console.error("[tickets.checkout] stripe failed:", err)
    // Clean up the pending order since Stripe rejected the session — no
    // point holding inventory we'll never collect on.
    await sb.from("ticket_orders").delete().eq("id", order.id)
    return NextResponse.json(
      { error: "Couldn't open Stripe checkout. Try again." },
      { status: 500 },
    )
  }
}
