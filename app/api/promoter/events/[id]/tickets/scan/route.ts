/**
 * POST /api/promoter/events/[id]/tickets/scan
 *
 * Door staff scans a ticket QR (or types the order reference) — this
 * endpoint validates the ticket against the event and marks it scanned.
 *
 * Body: { order_reference: string }
 *
 * Response shapes:
 *   200 valid           → { status: 'valid', order: {...} }
 *   200 already_scanned → { status: 'already_scanned', order: {...},
 *                            scanned_at, scan_count }
 *   404 not_found       → { status: 'not_found' }
 *   403 wrong_event     → { status: 'wrong_event' }
 *   400 not_paid        → { status: 'not_paid' }
 *   400 cancelled       → { status: 'cancelled' }
 *
 * The page renders the response status as a green/amber/red banner so
 * door staff can scan-and-glance without reading text. Already-scanned
 * is amber, not red — a genuine duplicate scan attempt is suspicious
 * but not necessarily fraud (could just be a re-scan by accident).
 *
 * scan_count increments on every attempt regardless of outcome, so a
 * post-hoc audit can spot patterns (a ticket scanned 5 times = follow up).
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 })
  }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ status: "wrong_event" }, { status: 403 })
  }

  // Refuse scans for cancelled events. Without this check, walkup
  // sales recorded after the event was cancelled (or pre-existing
  // orders not yet refunded by the bulk-cancel job) would still
  // scan in as valid, letting voided buyers through the door.
  const { data: ev } = await supabase
    .from("fight_events")
    .select("status")
    .eq("id", eventId)
    .single()
  if (ev?.status === "cancelled") {
    return NextResponse.json(
      {
        status: "event_cancelled",
        message: "This event has been cancelled.",
      },
      { status: 410 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const orderReference =
    typeof body?.order_reference === "string" ? body.order_reference.trim().toUpperCase() : ""
  if (!orderReference) {
    return NextResponse.json(
      { status: "bad_request", error: "order_reference required" },
      { status: 400 },
    )
  }

  const { data: order } = await supabase
    .from("ticket_orders")
    .select(`
      id, event_id, ticket_id, order_reference, guest_name, guest_email,
      quantity, payment_status, status, scanned_at, scan_count,
      ticket:event_tickets!ticket_orders_ticket_id_fkey ( tier_name )
    `)
    .eq("order_reference", orderReference)
    .maybeSingle()

  if (!order) {
    return NextResponse.json({ status: "not_found" }, { status: 404 })
  }

  if (order.event_id !== eventId) {
    return NextResponse.json(
      {
        status: "wrong_event",
        message: "This ticket isn't for tonight's event.",
      },
      { status: 403 },
    )
  }

  if (order.status === "cancelled" || order.status === "refunded") {
    return NextResponse.json(
      { status: "cancelled", order: redactOrder(order) },
      { status: 400 },
    )
  }

  if (order.payment_status !== "paid") {
    return NextResponse.json(
      { status: "not_paid", order: redactOrder(order) },
      { status: 400 },
    )
  }

  // Always bump scan_count so we have an audit trail of attempts —
  // even when the scan is denied (cancelled / wrong event / etc the
  // increments happen before that early-return, but we keep those
  // outcomes out of scan_count to avoid noise). The increments below
  // apply only to first-scan-or-already-scanned (the legitimate paths).
  const nextScanCount = (order.scan_count ?? 0) + 1

  if (order.scanned_at) {
    // Already scanned — bump count, return amber status with the
    // original scan timestamp.
    await supabase
      .from("ticket_orders")
      .update({ scan_count: nextScanCount })
      .eq("id", order.id)
    return NextResponse.json({
      status: "already_scanned",
      order: redactOrder(order),
      scanned_at: order.scanned_at,
      scan_count: nextScanCount,
    })
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("ticket_orders")
    .update({
      scanned_at: now,
      scanned_by_user_id: auth.userId,
      scan_count: nextScanCount,
    })
    .eq("id", order.id)
  if (error) {
    // Migration 060 might not be applied yet — surface a clear message
    // rather than a generic 500.
    if (error.message?.includes("scanned_at") || error.message?.includes("scan_count")) {
      return NextResponse.json(
        {
          status: "feature_disabled",
          error:
            "Ticket scanning isn't enabled yet on this database. Apply migration 060 first.",
        },
        { status: 503 },
      )
    }
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    status: "valid",
    order: redactOrder(order),
    scanned_at: now,
    scan_count: nextScanCount,
  })
}

// Redact the buyer email partially — door staff don't need the whole
// thing, just enough to match identity if challenged.
function redactOrder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any,
) {
  const email: string | null = order.guest_email ?? null
  const maskedEmail = email
    ? email.replace(/^(.{2}).*(@.*)$/, (_m, a, b) => `${a}…${b}`)
    : null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tier = Array.isArray(order.ticket) ? order.ticket[0] : order.ticket
  return {
    id: order.id,
    order_reference: order.order_reference,
    guest_name: order.guest_name,
    guest_email_masked: maskedEmail,
    quantity: order.quantity,
    tier_name: tier?.tier_name ?? null,
  }
}
