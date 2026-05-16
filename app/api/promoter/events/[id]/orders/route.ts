/**
 * POST /api/promoter/events/[id]/orders
 *
 * Manual ticket-order entry for the door. Staff types in a walkup
 * buyer (cash or bank transfer) — we create a paid ticket_orders row
 * directly, no Stripe involved.
 *
 * Body:
 *   {
 *     ticket_id: string                  // which tier
 *     quantity: number                   // 1..10
 *     guest_name: string                 // required
 *     guest_email?: string               // optional — sends confirmation if given
 *     guest_phone?: string               // optional
 *     payment_method: 'cash' | 'transfer'
 *     notes?: string                     // promoter's note ("bank transfer ref 12345")
 *   }
 *
 * Returns the created order including the generated order_reference
 * so the door page can show the QR for immediate scan or printing.
 *
 * Side effects:
 *  - Creates ticket_orders row with payment_status='paid' (the buyer
 *    paid in cash/transfer right there, no pending state needed).
 *  - Increments event_tickets.quantity_sold so the same seat can't be
 *    resold.
 *  - Fires the ticket-sold bell notification on the gym so the
 *    dashboard reflects walkup sales alongside Stripe sales.
 *  - Sends the confirmation email (with QR) when an email is provided.
 *
 * Gated by getPromoterAuth + verifyEventOwnership — only the
 * promoting org's owner/admin/promoter members can record sales.
 */
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"
import { EmailService } from "@/lib/email-service"
import { notifyTicketSold } from "@/lib/notifications"
import { ockockUrl } from "@/lib/ockock/url"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_QTY = 10
const VALID_METHODS = new Set(["cash", "transfer"])

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
  const ticketId = typeof body?.ticket_id === "string" ? body.ticket_id : ""
  const quantity = Math.max(1, Math.min(MAX_QTY, parseInt(body?.quantity, 10) || 1))
  const guestName = typeof body?.guest_name === "string" ? body.guest_name.trim() : ""
  const rawEmail = typeof body?.guest_email === "string" ? body.guest_email.trim() : ""
  // Email is optional for cash sales but if given it must be valid.
  const guestEmail = rawEmail.length > 0 ? rawEmail : null
  const guestPhone =
    typeof body?.guest_phone === "string" && body.guest_phone.trim().length > 0
      ? body.guest_phone.trim()
      : null
  const paymentMethod = String(body?.payment_method || "cash")
  const notes =
    typeof body?.notes === "string" && body.notes.trim().length > 0
      ? body.notes.trim().slice(0, 500)
      : null

  if (!ticketId || !guestName) {
    return NextResponse.json(
      { error: "ticket_id and guest_name are required." },
      { status: 400 },
    )
  }
  if (!VALID_METHODS.has(paymentMethod)) {
    return NextResponse.json(
      { error: "payment_method must be 'cash' or 'transfer'." },
      { status: 400 },
    )
  }
  if (guestEmail && !guestEmail.includes("@")) {
    return NextResponse.json(
      { error: "Email looks invalid — leave empty or fix the typo." },
      { status: 400 },
    )
  }

  // Load tier + verify it belongs to this event + has inventory.
  const { data: tier } = await supabase
    .from("event_tickets")
    .select("id, event_id, tier_name, price_thb, price_usd, quantity_total, quantity_sold, is_active")
    .eq("id", ticketId)
    .maybeSingle()

  if (!tier || tier.event_id !== eventId) {
    return NextResponse.json({ error: "Ticket tier not found." }, { status: 404 })
  }
  if (!tier.is_active) {
    return NextResponse.json(
      { error: "That tier is inactive — activate it first or pick another." },
      { status: 400 },
    )
  }
  const remaining = (tier.quantity_total ?? 0) - (tier.quantity_sold ?? 0)
  if (remaining < quantity) {
    return NextResponse.json(
      {
        error:
          remaining <= 0
            ? "Sold out at this tier."
            : `Only ${remaining} ticket${remaining === 1 ? "" : "s"} left at this tier.`,
      },
      { status: 409 },
    )
  }

  const totalThb = tier.price_thb * quantity
  const totalUsd = tier.price_usd ? tier.price_usd * quantity : null

  // Short order reference. Prefix encodes the payment method so a
  // promoter glancing at the Sales tab can spot walkups at a glance:
  //   TKT-CASH-A1B2C3 (cash walkup)
  //   TKT-XFER-9F8E7D (bank transfer)
  const refPrefix = paymentMethod === "transfer" ? "XFER" : "CASH"
  const orderReference = `TKT-${refPrefix}-${randomBytes(3).toString("hex").toUpperCase()}`

  const { data: order, error: insertErr } = await supabase
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
      payment_status: "paid",
      payment_method: paymentMethod,
      status: "confirmed",
      order_reference: orderReference,
    })
    .select("id, order_reference, guest_name, guest_email, quantity, total_price_thb, payment_method")
    .single()

  if (insertErr || !order) {
    console.error("[orders.cash] insert failed:", insertErr)
    return NextResponse.json(
      { error: insertErr?.message || "Couldn't record the sale." },
      { status: 500 },
    )
  }

  // Increment quantity_sold so the same seat can't be resold. Same
  // read-then-write approach as the Stripe checkout webhook — for
  // MVP volume the race window is acceptable.
  await supabase
    .from("event_tickets")
    .update({ quantity_sold: (tier.quantity_sold ?? 0) + quantity })
    .eq("id", ticketId)

  // Bell-ping the gym so the dashboard surfaces walkups too. Loads
  // event name in a follow-up read; small cost on the door-night
  // hot path, but the alternative is threading it through every
  // call. Fire-and-forget so notification failure doesn't roll back.
  ;(async () => {
    try {
      const { data: event } = await supabase
        .from("fight_events")
        .select("name, org_id")
        .eq("id", eventId)
        .maybeSingle()
      if (event?.org_id) {
        await notifyTicketSold({
          orgId: event.org_id as string,
          eventId,
          eventName: (event.name as string) || "Fight event",
          buyerName: guestName,
          tierName: tier.tier_name,
          quantity,
          totalThb,
          orderReference,
        })
      }
    } catch (err) {
      console.warn("[orders.cash] notification failed:", err)
    }
  })()

  // Confirmation email — only if the buyer gave us their email.
  // Walkups often don't, which is fine; they have the order_reference
  // printed/shown to them and that's enough.
  if (guestEmail) {
    ;(async () => {
      try {
        const [{ data: event }, { data: ticketRow }] = await Promise.all([
          supabase
            .from("fight_events")
            .select("name, event_date, event_time, venue_name, venue_city")
            .eq("id", eventId)
            .maybeSingle(),
          supabase
            .from("event_tickets")
            .select("tier_name, description")
            .eq("id", ticketId)
            .maybeSingle(),
        ])
        await EmailService.getInstance().sendTicketConfirmationEmail({
          buyerEmail: guestEmail,
          buyerName: guestName,
          eventName: event?.name || "Fight event",
          eventDate: event?.event_date ?? null,
          eventTime: event?.event_time ?? null,
          venue:
            [event?.venue_name, event?.venue_city].filter(Boolean).join(", ") ||
            null,
          tierName: ticketRow?.tier_name || tier.tier_name,
          tierDescription: ticketRow?.description ?? null,
          quantity,
          totalThb,
          orderReference,
          eventUrl: ockockUrl(`/fights/${eventId}`),
        })
      } catch (err) {
        console.warn("[orders.cash] confirmation email failed:", err)
      }
    })()
  }

  return NextResponse.json({
    order: {
      id: order.id,
      order_reference: order.order_reference,
      guest_name: order.guest_name,
      guest_email: order.guest_email,
      quantity: order.quantity,
      total_price_thb: order.total_price_thb,
      payment_method: order.payment_method,
      tier_name: tier.tier_name,
    },
    notes: notes,
  })
}
