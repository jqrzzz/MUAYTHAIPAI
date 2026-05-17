/**
 * GET /api/promoter/events/[id]/sales/export
 *
 * Streams a CSV of every paid + refunded order for the event, no
 * caps. Used by the "Export CSV" button on the sales tab — and by
 * promoters of very large events whose totals exceed the
 * aggregation cap on the live `/sales` endpoint.
 *
 * Strategy: paginate the orders query in 1000-row batches via PostgREST
 * range() so we don't hit Supabase's default row limit. Build the
 * CSV in-memory (one event typically tops out at low tens of thousands
 * of orders — under a few MB of text — which is fine to assemble
 * before flushing). For absolute monsters, swap to a streaming
 * ReadableStream and pipe per-batch rows.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PAGE_SIZE = 1000
const MAX_PAGES = 100 // safety net at 100k rows

// CSV cell escaping per RFC 4180: wrap in quotes if the value contains
// a comma, double-quote, CR, or LF; double up any embedded quotes.
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ""
  const s = String(v)
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

const COLUMNS = [
  "order_reference",
  "tier_name",
  "quantity",
  "price_thb",
  "payment_status",
  "payment_method",
  "status",
  "guest_name",
  "guest_email",
  "guest_phone",
  "created_at",
  "scanned_at",
  "scan_count",
] as const

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

  // Pull the event name for a friendly filename. Best-effort — falls
  // back to the event id if the lookup fails for any reason.
  const { data: ev } = await supabase
    .from("fight_events")
    .select("name, event_date")
    .eq("id", eventId)
    .single()
  const safeName = (ev?.name ?? eventId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  const datePart = ev?.event_date ?? new Date().toISOString().slice(0, 10)
  const filename = `${safeName || "event"}-${datePart}-orders.csv`

  // Walk all paid+refunded orders in PAGE_SIZE batches. Stop when a
  // page returns fewer than PAGE_SIZE rows (end of list) or we hit
  // the safety cap so a runaway can't OOM the worker.
  const rows: string[] = [COLUMNS.join(",")]
  let pagesFetched = 0
  let from = 0

  while (pagesFetched < MAX_PAGES) {
    const { data, error } = await supabase
      .from("ticket_orders")
      .select(`
        order_reference, quantity, total_price_thb,
        payment_status, payment_method, status,
        guest_name, guest_email, guest_phone,
        created_at, scanned_at, scan_count,
        ticket:event_tickets!ticket_orders_ticket_id_fkey ( tier_name )
      `)
      .eq("event_id", eventId)
      .in("payment_status", ["paid", "refunded"])
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      return NextResponse.json(
        { error: "Failed to read orders" },
        { status: 500 },
      )
    }

    for (const o of data ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tier = Array.isArray((o as any).ticket)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (o as any).ticket[0]
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (o as any).ticket
      rows.push(
        [
          o.order_reference,
          tier?.tier_name ?? "",
          o.quantity,
          o.total_price_thb,
          o.payment_status,
          o.payment_method,
          o.status,
          o.guest_name,
          o.guest_email,
          o.guest_phone,
          o.created_at,
          o.scanned_at ?? "",
          o.scan_count ?? 0,
        ]
          .map(csvCell)
          .join(","),
      )
    }

    pagesFetched += 1
    if (!data || data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  // Excel chokes on UTF-8 CSVs without a BOM — adding it preserves
  // Thai names + emoji in the buyer columns.
  const body = "﻿" + rows.join("\r\n") + "\r\n"

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
