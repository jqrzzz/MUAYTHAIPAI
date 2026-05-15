/**
 * GET /api/promoter/events/[id]/sales
 *
 * Sales view for the event editor. Pulls:
 *   - per-tier breakdown (sold, remaining, revenue)
 *   - recent paid orders with buyer name, email, reference, scan status
 *   - rolled-up totals (revenue, tickets sold, scanned at door)
 *
 * Gated by promoter org membership + event ownership. Counts only
 * payment_status='paid' so pending Stripe sessions don't pollute the
 * numbers; cancelled / refunded orders are surfaced separately if and
 * when we add that view.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
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

  const [tiersRes, ordersRes] = await Promise.all([
    supabase
      .from("event_tickets")
      .select("id, tier_name, price_thb, quantity_total, quantity_sold, is_active")
      .eq("event_id", eventId)
      .order("price_thb", { ascending: true }),
    supabase
      .from("ticket_orders")
      .select(`
        id, order_reference, guest_name, guest_email, quantity,
        total_price_thb, payment_status, status, created_at,
        scanned_at, scan_count,
        ticket_id,
        ticket:event_tickets!ticket_orders_ticket_id_fkey ( tier_name )
      `)
      .eq("event_id", eventId)
      .eq("payment_status", "paid")
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(200),
  ])

  const tiers = tiersRes.data ?? []
  const orders = ordersRes.data ?? []

  // Rollups across paid orders. Sum per-tier revenue from orders rather
  // than tier price × quantity_sold so refunds/edge-cases stay accurate
  // if we add them later.
  const totalSold = orders.reduce((s, o) => s + (o.quantity ?? 0), 0)
  const totalRevenue = orders.reduce(
    (s, o) => s + (o.total_price_thb ?? 0),
    0,
  )
  const totalScanned = orders.filter((o) => !!o.scanned_at).length

  // Defensive: if migration 060 isn't applied the rows just have
  // scanned_at = undefined which the filter handles naturally.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeOrders = orders.map((o: any) => {
    const tier = Array.isArray(o.ticket) ? o.ticket[0] : o.ticket
    return {
      id: o.id,
      order_reference: o.order_reference,
      guest_name: o.guest_name,
      guest_email: o.guest_email,
      quantity: o.quantity,
      total_price_thb: o.total_price_thb,
      created_at: o.created_at,
      scanned_at: o.scanned_at ?? null,
      scan_count: o.scan_count ?? 0,
      tier_name: tier?.tier_name ?? null,
    }
  })

  return NextResponse.json({
    totals: {
      tickets_sold: totalSold,
      revenue_thb: totalRevenue,
      scanned_at_door: totalScanned,
      orders: orders.length,
    },
    tiers: tiers.map((t) => {
      const remaining = (t.quantity_total ?? 0) - (t.quantity_sold ?? 0)
      const tierRevenue = orders
        .filter((o) => o.ticket_id === t.id)
        .reduce((s, o) => s + (o.total_price_thb ?? 0), 0)
      return {
        id: t.id,
        tier_name: t.tier_name,
        price_thb: t.price_thb,
        quantity_total: t.quantity_total,
        quantity_sold: t.quantity_sold,
        quantity_remaining: remaining,
        is_active: t.is_active,
        revenue_thb: tierRevenue,
      }
    }),
    orders: safeOrders,
  })
}
