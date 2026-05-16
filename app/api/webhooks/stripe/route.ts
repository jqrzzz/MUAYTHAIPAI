import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { EmailService } from "@/lib/email-service"
import { env, hasEnv } from "@/lib/env"
import { createClient } from "@supabase/supabase-js"
import { notifyTicketSold } from "@/lib/notifications"

// Stripe SDK 18.x typed for the 2025-04-30.basil API. We're pinned to
// 2024-06-20 (some fields stay at the root level there). Cast the
// apiVersion to bypass the TS literal-type check; runtime behaviour
// is unaffected.
const stripe = new Stripe(env.stripe.secretKey(), {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * Fetch the charge + balance transaction for a PaymentIntent so we can
 * record what Stripe actually deducted in fees + what really landed.
 *
 * Returns nulls if any piece is missing — we always still want to save
 * the booking, even if the fee snapshot isn't available yet.
 */
async function fetchStripeFeeSnapshot(paymentIntentId: string): Promise<{
  stripe_charge_id: string | null
  stripe_balance_transaction_id: string | null
  stripe_fee_cents: number | null
  stripe_net_cents: number | null
}> {
  try {
    const charges = await stripe.charges.list({
      payment_intent: paymentIntentId,
      limit: 1,
    })
    const charge = charges.data[0]
    if (!charge) {
      return {
        stripe_charge_id: null,
        stripe_balance_transaction_id: null,
        stripe_fee_cents: null,
        stripe_net_cents: null,
      }
    }
    const balanceTxId =
      typeof charge.balance_transaction === "string"
        ? charge.balance_transaction
        : charge.balance_transaction?.id ?? null

    let fee: number | null = null
    let net: number | null = null
    if (balanceTxId) {
      const tx = await stripe.balanceTransactions.retrieve(balanceTxId)
      // Stripe's `fee` is summed across fee_details — exactly what we want
      fee = tx.fee ?? null
      net = tx.net ?? null
    }
    return {
      stripe_charge_id: charge.id,
      stripe_balance_transaction_id: balanceTxId,
      stripe_fee_cents: fee,
      stripe_net_cents: net,
    }
  } catch (err) {
    console.error("[webhook] Failed to fetch fee snapshot:", err)
    return {
      stripe_charge_id: null,
      stripe_balance_transaction_id: null,
      stripe_fee_cents: null,
      stripe_net_cents: null,
    }
  }
}

async function saveBookingToDatabase(data: {
  serviceName: string
  guestName: string
  guestEmail: string
  bookingDate: string
  bookingTime?: string
  paymentAmountUsd: number
  stripePaymentIntentId: string
  userId?: string
  orgId?: string
}) {
  try {
    // Resolve org_id: use metadata if provided, otherwise look up the first org with this service
    let orgId = data.orgId

    if (!orgId) {
      // Fallback: find any org that has a service matching this name
      const { data: serviceMatch } = await supabase
        .from("services")
        .select("org_id")
        .ilike("name", `%${data.serviceName}%`)
        .limit(1)
        .single()
      orgId = serviceMatch?.org_id
    }

    if (!orgId) {
      console.error("No org_id found for booking:", data.serviceName)
      return null
    }

    // Find service by name within the org
    const { data: service } = await supabase
      .from("services")
      .select("id")
      .eq("org_id", orgId)
      .ilike("name", `%${data.serviceName}%`)
      .single()

    let finalUserId = data.userId || null
    if (!finalUserId && data.guestEmail) {
      const { data: existingUser } = await supabase.from("users").select("id").eq("email", data.guestEmail).single()

      if (existingUser) {
        finalUserId = existingUser.id
      }
    }

    const commissionRate = 0.15
    const commissionAmount = Math.round(data.paymentAmountUsd * commissionRate * 100) / 100

    // Capture Stripe's actual fee + net so the dashboard tells the truth
    // about what really landed in our balance, not just the gross amount.
    const feeSnapshot = await fetchStripeFeeSnapshot(data.stripePaymentIntentId)

    // Upsert by stripe_payment_intent_id — Stripe fires both
    // payment_intent.succeeded AND checkout.session.completed for the
    // same payment, plus it retries failed webhooks. The partial
    // unique index on (stripe_payment_intent_id) ensures we never
    // double-book. `ignoreDuplicates: true` makes the second event a
    // no-op; the .select() chain returns an empty array, which we
    // surface as null so the caller can skip emails for replays.
    const { data: bookings, error } = await supabase
      .from("bookings")
      .upsert(
        {
          org_id: orgId,
          service_id: service?.id || null,
          user_id: finalUserId,
          guest_name: data.guestName,
          guest_email: data.guestEmail,
          booking_date: data.bookingDate,
          booking_time: data.bookingTime || null,
          status: "confirmed",
          payment_status: "paid",
          payment_method: "stripe",
          payment_currency: "USD",
          payment_amount_usd: data.paymentAmountUsd,
          payment_amount_thb: null,
          commission_rate: commissionRate,
          commission_amount_usd: commissionAmount,
          stripe_payment_intent_id: data.stripePaymentIntentId,
          stripe_charge_id: feeSnapshot.stripe_charge_id,
          stripe_balance_transaction_id: feeSnapshot.stripe_balance_transaction_id,
          stripe_fee_cents: feeSnapshot.stripe_fee_cents,
          stripe_net_cents: feeSnapshot.stripe_net_cents,
        },
        { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true },
      )
      .select()

    if (error) {
      console.error("Failed to save booking to database:", error)
      return null
    }

    const booking = bookings?.[0]
    if (!booking) {
      // Duplicate webhook delivery (Stripe retry, or the sibling event
      // already created this booking). Caller will skip emails.
      console.log(
        "Booking already exists for PI",
        data.stripePaymentIntentId,
        "— skipping duplicate",
      )
      return null
    }

    console.log(
      "Booking saved to database:",
      booking.id,
      `$${data.paymentAmountUsd} USD (commission: $${commissionAmount})`,
      finalUserId ? `(linked to user ${finalUserId})` : "(guest)",
    )
    return booking
  } catch (err) {
    console.error("Error saving booking:", err)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      console.error("Missing Stripe signature")
      return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 })
    }

    if (!hasEnv("STRIPE_WEBHOOK_SECRET")) {
      console.error("Missing STRIPE_WEBHOOK_SECRET environment variable")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, env.stripe.webhookSecret())
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log("Payment succeeded:", paymentIntent.id, `$${(paymentIntent.amount / 100).toFixed(2)} USD`)

        const metadata = paymentIntent.metadata
        const service = metadata.service_type || metadata.service_name

        if (metadata.customer_email && metadata.customer_name && service) {
          // Persist first, email second — saveBookingToDatabase returns
          // null when the booking already exists (Stripe retry, or the
          // sibling checkout.session.completed event fired first), and
          // we use that signal to skip the duplicate-email send.
          const booking = await saveBookingToDatabase({
            serviceName: service,
            guestName: metadata.customer_name,
            guestEmail: metadata.customer_email,
            bookingDate: metadata.booking_date || new Date().toISOString().split("T")[0],
            bookingTime: metadata.booking_time,
            paymentAmountUsd: paymentIntent.amount / 100,
            stripePaymentIntentId: paymentIntent.id,
            userId: metadata.user_id || undefined,
            orgId: metadata.org_id || undefined,
          })

          if (booking) {
            const bookingData = {
              customerName: metadata.customer_name,
              customerEmail: metadata.customer_email,
              serviceType: service,
              bookingDate: metadata.booking_date || "TBD",
              bookingTime: metadata.booking_time,
              amount: paymentIntent.amount / 100,
              paymentId: paymentIntent.id,
            }
            const emailService = EmailService.getInstance()
            const customerEmailSent = await emailService.sendBookingConfirmation(bookingData)
            const staffEmailSent = await emailService.sendStaffNotification(bookingData)
            console.log(`Emails sent - Customer: ${customerEmailSent}, Staff: ${staffEmailSent}`)
          }
        } else {
          console.warn("Missing required booking details in metadata, skipping emails")
        }

        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error("Payment failed:", paymentIntent.id, paymentIntent.last_payment_error?.message || "Unknown")
        break
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("Checkout session completed:", session.id)
        await handleCheckoutCompleted(session)
        break
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("Async payment succeeded:", session.id)
        break
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.error("Async payment failed:", session.id)
        break
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("Checkout session expired:", session.id)
        break
      }

      case "charge.refunded": {
        // Fired when a refund happens — from API OR directly in the
        // Stripe Dashboard. Keeps our books in sync with reality.
        const charge = event.data.object as Stripe.Charge
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id
        if (!piId) {
          console.warn("[webhook] charge.refunded missing payment_intent — skipping")
          break
        }
        const fullyRefunded = charge.amount_refunded >= charge.amount

        // Try bookings first (the older flow). Use .select() so we know
        // whether any rows actually matched — if not, this might be a
        // ticket refund and we fall through to that branch.
        const { data: updatedBookings } = await supabase
          .from("bookings")
          .update({
            payment_status: fullyRefunded ? "refunded" : "paid",
            refunded_amount_cents: charge.amount_refunded,
            refunded_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", piId)
          .select("id")

        if (updatedBookings && updatedBookings.length > 0) {
          console.log(
            `Booking refund recorded for PI ${piId}: $${(charge.amount_refunded / 100).toFixed(2)}`,
            fullyRefunded ? "(full)" : "(partial)",
          )
          break
        }

        // No booking matched — try ticket_orders. Full refund flips the
        // order to refunded and decrements quantity_sold so the seat is
        // released back into inventory. Partial refunds leave the seat
        // counted (we don't model partial-seat refunds yet) but still
        // record the refunded amount for the books.
        const { data: ticketOrder } = await supabase
          .from("ticket_orders")
          .select("id, ticket_id, quantity, event_id, order_reference, payment_status")
          .eq("stripe_payment_intent_id", piId)
          .maybeSingle()

        if (!ticketOrder) {
          console.warn(`[webhook] charge.refunded for unknown PI ${piId}`)
          break
        }

        // Idempotency: if we already marked this refunded, don't decrement
        // quantity_sold a second time on a Stripe webhook retry.
        if (ticketOrder.payment_status === "refunded") {
          console.log(`[webhook] ticket ${ticketOrder.order_reference} already refunded — skipping`)
          break
        }

        const { error: ticketRefundErr } = await supabase
          .from("ticket_orders")
          .update({
            payment_status: fullyRefunded ? "refunded" : "paid",
            status: fullyRefunded ? "refunded" : "confirmed",
          })
          .eq("id", ticketOrder.id)
        if (ticketRefundErr) {
          console.error("[webhook] Failed to mark ticket refunded:", ticketRefundErr)
          break
        }

        if (fullyRefunded) {
          // Release the seat. Read-then-write — same trade-off as the
          // initial purchase increment in handleTicketCheckoutCompleted.
          const { data: tier } = await supabase
            .from("event_tickets")
            .select("quantity_sold")
            .eq("id", ticketOrder.ticket_id)
            .maybeSingle()
          if (tier) {
            const next = Math.max(0, (tier.quantity_sold ?? 0) - ticketOrder.quantity)
            await supabase
              .from("event_tickets")
              .update({ quantity_sold: next })
              .eq("id", ticketOrder.ticket_id)
          }
        }

        console.log(
          `Ticket refund recorded for ${ticketOrder.order_reference}: ฿${(charge.amount_refunded).toLocaleString()}`,
          fullyRefunded ? "(full)" : "(partial)",
        )
        break
      }

      case "charge.refund.updated": {
        // Stripe may update a refund (e.g. status: pending → succeeded).
        // We don't need to re-process; the original charge.refunded was
        // already recorded. Just log for traceability.
        const refund = event.data.object as Stripe.Refund
        console.log("Refund updated:", refund.id, refund.status)
        break
      }

      default:
        break
    }

    return NextResponse.json({
      received: true,
      eventType: event.type,
      eventId: event.id,
    })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Health check endpoint
export async function GET() {
  const healthStatus = {
    status: "Webhook endpoint is active and ready",
    endpoint: "/api/webhooks/stripe",
    methods: ["POST", "GET"],
    environment: {
      hasStripeSecret: hasEnv("STRIPE_SECRET_KEY"),
      hasWebhookSecret: hasEnv("STRIPE_WEBHOOK_SECRET"),
    },
  }

  return NextResponse.json(healthStatus)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const metadata = session.metadata || {}

    // Ticket purchase path — kind=ticket sessions originate from
    // /api/public/fights/[eventId]/tickets/[ticketId]/checkout. They
    // never carry the booking metadata so we route + return early.
    if (metadata.kind === "ticket" && metadata.ticket_order_id) {
      await handleTicketCheckoutCompleted(session, metadata)
      return
    }

    const customerEmail = session.customer_details?.email || metadata.customer_email
    const service = metadata.service_type || metadata.service_name

    if (customerEmail && metadata.customer_name && service) {
      // Same idempotency pattern as payment_intent.succeeded: persist
      // first, email only if the upsert produced a new row. Without
      // this gate, every Checkout sends emails twice — once from this
      // handler and once from payment_intent.succeeded on the same PI.
      const booking = await saveBookingToDatabase({
        serviceName: service,
        guestName: metadata.customer_name,
        guestEmail: customerEmail,
        bookingDate: metadata.booking_date || new Date().toISOString().split("T")[0],
        bookingTime: metadata.booking_time,
        paymentAmountUsd: session.amount_total ? session.amount_total / 100 : 0,
        stripePaymentIntentId: (session.payment_intent as string) || session.id,
        userId: metadata.user_id || undefined,
        orgId: metadata.org_id || undefined,
      })

      if (booking) {
        const bookingData = {
          customerName: metadata.customer_name,
          customerEmail: customerEmail,
          serviceType: service,
          bookingDate: metadata.booking_date || "TBD",
          bookingTime: metadata.booking_time,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          paymentId: (session.payment_intent as string) || session.id,
        }
        const emailService = EmailService.getInstance()
        const customerEmailSent = await emailService.sendBookingConfirmation(bookingData)
        const staffEmailSent = await emailService.sendStaffNotification(bookingData)
        console.log(`Emails sent - Customer: ${customerEmailSent}, Staff: ${staffEmailSent}`)
      }
    } else {
      console.warn("Missing booking details in session metadata")
    }
  } catch (error) {
    console.error("Error handling checkout completion:", error)
  }
}

// Ticket-purchase branch of checkout.session.completed. Pulled out so
// the main handler stays focused on the booking path.
//
// Source of truth: this is where the ticket becomes valid. Until this
// function runs, the ticket_orders row is payment_status='pending' and
// quantity_sold on the tier hasn't moved. We rely on the webhook so
// the success page redirect can fail/lag without anyone losing a ticket.
async function handleTicketCheckoutCompleted(
  session: Stripe.Checkout.Session,
  metadata: Stripe.Metadata,
) {
  const orderId = metadata.ticket_order_id
  if (!orderId) return

  // Idempotency — Stripe can retry the webhook; if we already paid this
  // order, don't double-count quantity_sold or re-email.
  const { data: existing } = await supabase
    .from("ticket_orders")
    .select("id, event_id, ticket_id, quantity, payment_status, guest_email, guest_name, total_price_thb, order_reference")
    .eq("id", orderId)
    .maybeSingle()
  if (!existing) {
    console.warn("[ticket.webhook] order not found:", orderId)
    return
  }
  if (existing.payment_status === "paid") {
    return
  }

  const stripePiId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null

  // Flip the order to paid first — that's the contract for "ticket valid".
  const { error: orderErr } = await supabase
    .from("ticket_orders")
    .update({
      payment_status: "paid",
      stripe_payment_intent_id: stripePiId,
    })
    .eq("id", existing.id)
  if (orderErr) {
    console.error("[ticket.webhook] order update failed:", orderErr)
    return
  }

  // Increment quantity_sold on the tier. RPC would be safer (atomic) but
  // for MVP volume a read-then-write is fine — the pending-row check at
  // checkout-create already gates the obvious overbook.
  const { data: tier } = await supabase
    .from("event_tickets")
    .select("quantity_sold")
    .eq("id", existing.ticket_id)
    .maybeSingle()
  if (tier) {
    await supabase
      .from("event_tickets")
      .update({ quantity_sold: (tier.quantity_sold ?? 0) + existing.quantity })
      .eq("id", existing.ticket_id)
  }

  // Hydrate event + tier for the confirmation email + the gym
  // notification. Pull org_id on the event so the bell ping lands in
  // the right gym's inbox.
  const [{ data: event }, { data: ticketTier }] = await Promise.all([
    supabase
      .from("fight_events")
      .select("name, event_date, event_time, venue_name, venue_city, org_id")
      .eq("id", existing.event_id)
      .maybeSingle(),
    supabase
      .from("event_tickets")
      .select("tier_name, description")
      .eq("id", existing.ticket_id)
      .maybeSingle(),
  ])

  // Ping the promoting gym so the bell icon surfaces the sale in
  // real time. Fire-and-forget — failures here don't block the
  // confirmation email below.
  if (event?.org_id) {
    notifyTicketSold({
      orgId: event.org_id as string,
      eventId: existing.event_id,
      eventName: event.name || "Fight event",
      buyerName: existing.guest_name || "Guest",
      tierName: ticketTier?.tier_name || "Ticket",
      quantity: existing.quantity,
      totalThb: existing.total_price_thb,
      orderReference: existing.order_reference || existing.id,
    }).catch((err) => {
      console.warn("[ticket.webhook] notification failed:", err)
    })
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://muaythaipai.com"
    await EmailService.getInstance().sendTicketConfirmationEmail({
      buyerEmail: existing.guest_email || "",
      buyerName: existing.guest_name || "Guest",
      eventName: event?.name || "Fight event",
      eventDate: event?.event_date ?? null,
      eventTime: event?.event_time ?? null,
      venue:
        [event?.venue_name, event?.venue_city].filter(Boolean).join(", ") ||
        null,
      tierName: ticketTier?.tier_name || "Ticket",
      tierDescription: ticketTier?.description ?? null,
      quantity: existing.quantity,
      totalThb: existing.total_price_thb,
      orderReference: existing.order_reference || existing.id,
      eventUrl: `${siteUrl}/ockock/fights/${existing.event_id}`,
    })
  } catch (err) {
    console.error("[ticket.webhook] confirmation email failed:", err)
  }
}
