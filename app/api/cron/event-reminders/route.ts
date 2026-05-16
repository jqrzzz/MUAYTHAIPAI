/**
 * Daily event-reminder cron.
 *
 * Scheduled by vercel.json (wire up when ready — pattern below).
 * Finds fight_events happening tomorrow and emails every paid
 * ticket holder a reminder with their QR + order reference.
 *
 * Idempotency: ticket_orders.reminder_sent_at (added in migration
 * 063) gets stamped on each success. Re-running the cron skips
 * already-emailed orders, so duplicate runs are safe.
 *
 * Auth:
 *   - Vercel cron sends `Authorization: Bearer ${CRON_SECRET}`.
 *     Anything else returns 401. Same pattern as trial-nudge cron.
 *
 * To wire up the schedule in Vercel, add to vercel.json:
 *   {
 *     "crons": [
 *       { "path": "/api/cron/event-reminders", "schedule": "0 10 * * *" }
 *     ]
 *   }
 *   Runs daily at 10 UTC (~5pm Bangkok) so reminders land late in the
 *   afternoon the day before the fight — gives buyers their evening
 *   to plan and lets the cron retry if the morning run drops anyone.
 */
import { NextResponse, type NextRequest } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { EmailService } from "@/lib/email-service"
import { ockockUrl } from "@/lib/ockock/url"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const sb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
  }
  const authHeader = request.headers.get("authorization") || ""
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Find events happening tomorrow (local YYYY-MM-DD). Wide window of
  // tomorrow-only — we run once a day so missing a 1-day window costs
  // the whole batch.
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowISO = tomorrow.toISOString().split("T")[0]

  const { data: events, error: evErr } = await sb
    .from("fight_events")
    .select("id, name, event_date, event_time, venue_name, venue_city")
    .eq("status", "published")
    .eq("event_date", tomorrowISO)
  if (evErr) {
    return NextResponse.json({ error: evErr.message }, { status: 500 })
  }
  if (!events || events.length === 0) {
    return NextResponse.json({ events: 0, reminders_sent: 0 })
  }

  const emailer = EmailService.getInstance()
  let totalSent = 0
  let totalFailed = 0
  let totalSkipped = 0

  for (const event of events) {
    // Pull only the still-pending orders to remind. reminder_sent_at
    // IS NULL is the idempotency gate — already-emailed buyers are
    // skipped on re-runs.
    const { data: orders } = await sb
      .from("ticket_orders")
      .select(`
        id, order_reference, guest_email, guest_name, quantity,
        ticket:event_tickets!ticket_orders_ticket_id_fkey ( tier_name )
      `)
      .eq("event_id", event.id)
      .eq("payment_status", "paid")
      .eq("status", "confirmed")
      .is("reminder_sent_at", null)
      .not("guest_email", "is", null)

    if (!orders || orders.length === 0) continue

    const venue =
      [event.venue_name, event.venue_city].filter(Boolean).join(", ") || null

    for (const o of orders) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tier = Array.isArray((o as any).ticket) ? (o as any).ticket[0] : (o as any).ticket
      const email = o.guest_email
      if (!email) {
        totalSkipped++
        continue
      }
      let ok = false
      try {
        ok = await emailer.sendTicketReminderEmail({
          buyerEmail: email,
          buyerName: o.guest_name || "Guest",
          eventName: event.name || "Fight event",
          eventDate: event.event_date,
          eventTime: event.event_time,
          venue,
          tierName: tier?.tier_name || "Ticket",
          quantity: o.quantity ?? 1,
          orderReference: o.order_reference || o.id,
          eventUrl: ockockUrl(`/fights/${event.id}`),
        })
      } catch (err) {
        console.warn("[event-reminders] send threw for", o.order_reference, err)
      }
      if (ok) {
        // Stamp only on success so the next cron run retries failures.
        const { error: stampErr } = await sb
          .from("ticket_orders")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", o.id)
        if (stampErr) {
          console.warn("[event-reminders] stamp failed for", o.order_reference, stampErr.message)
        }
        totalSent++
      } else {
        totalFailed++
      }
    }
  }

  return NextResponse.json({
    events: events.length,
    reminders_sent: totalSent,
    failed: totalFailed,
    skipped_missing_email: totalSkipped,
  })
}
