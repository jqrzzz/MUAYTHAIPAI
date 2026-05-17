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

// Max orders we'll return in one request. Promoters can "Load more"
// to walk back through history; defaults to a slimmer page when not
// requested so the first paint is fast even for big events.
const MAX_LIMIT = 1000
const DEFAULT_LIMIT = 200
// Cap on the aggregation fetch — for totals we pull lightweight rows
// of every paid/refunded order so the rollups are accurate regardless
// of the display page size. 10k rows of {quantity, total, status,
// scanned_at} is ~300KB which is fine for a single internal request.
const AGGREGATION_CAP = 10_000

export async function GET(
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

  const url = new URL(request.url)
  const rawLimit = parseInt(url.searchParams.get("limit") || "", 10)
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_LIMIT)
    : DEFAULT_LIMIT

  // Three parallel queries:
  //   1. tiers — for per-tier breakdown
  //   2. ordersRes — paginated rows for the buyer list (limit-aware)
  //   3. aggRes — lightweight scan of ALL paid/refunded orders so the
  //      headline totals stay accurate even if the buyer list is
  //      paginated. Requested with `count: "exact"` so we know whether
  //      to surface a "Load more" affordance and whether totals are
  //      approximate (truncated at AGGREGATION_CAP).
  const [tiersRes, ordersRes, aggRes] = await Promise.all([
    supabase
      .from("event_tickets")
      .select("id, tier_name, price_thb, quantity_total, quantity_sold, is_active")
      .eq("event_id", eventId)
      .order("price_thb", { ascending: true }),
    supabase
      .from("ticket_orders")
      .select(`
        id, order_reference, guest_name, guest_email, quantity,
        total_price_thb, payment_status, payment_method, status, created_at,
        scanned_at, scan_count,
        ticket_id,
        ticket:event_tickets!ticket_orders_ticket_id_fkey ( tier_name )
      `)
      .eq("event_id", eventId)
      // Include refunded orders too — the promoter wants to see those
      // in the history with a "Refunded" badge, not have them disappear.
      .in("payment_status", ["paid", "refunded"])
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("ticket_orders")
      .select(
        "ticket_id, quantity, total_price_thb, payment_status, scanned_at",
        { count: "exact" },
      )
      .eq("event_id", eventId)
      .in("payment_status", ["paid", "refunded"])
      .limit(AGGREGATION_CAP),
  ])

  const tiers = tiersRes.data ?? []
  const orders = ordersRes.data ?? []
  const aggRows = aggRes.data ?? []
  const totalOrderCount = aggRes.count ?? aggRows.length
  const totalsApproximate = totalOrderCount > AGGREGATION_CAP

  // Rollups now scan the lightweight aggregation set, not the paginated
  // display set — so the headline numbers are right even when the
  // promoter is only looking at the most recent N orders.
  const paidAgg = aggRows.filter((o) => o.payment_status === "paid")
  const totalSold = paidAgg.reduce((s, o) => s + (o.quantity ?? 0), 0)
  const totalRevenue = paidAgg.reduce(
    (s, o) => s + (o.total_price_thb ?? 0),
    0,
  )
  const totalScanned = paidAgg.filter((o) => !!o.scanned_at).length

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
      payment_status: o.payment_status,
      status: o.status,
      payment_method: o.payment_method,
    }
  })

  return NextResponse.json({
    totals: {
      tickets_sold: totalSold,
      revenue_thb: totalRevenue,
      scanned_at_door: totalScanned,
      // Total across ALL paid+refunded orders, not just the page shown
      // — so the "Buyers (N)" header reflects reality.
      orders: totalOrderCount,
      // Surface to the UI so it can show a "totals are approximate"
      // hint in the (rare) case an event has >10k orders.
      approximate: totalsApproximate,
    },
    tiers: tiers.map((t) => {
      const remaining = (t.quantity_total ?? 0) - (t.quantity_sold ?? 0)
      // Per-tier revenue now comes from the aggregation set, not the
      // paginated display set — accurate for events with >limit orders.
      const tierRevenue = paidAgg
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
    pagination: {
      limit,
      returned: safeOrders.length,
      total: totalOrderCount,
      has_more: safeOrders.length < totalOrderCount,
    },
  })
}
