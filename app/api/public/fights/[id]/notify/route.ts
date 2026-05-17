/**
 * POST /api/public/fights/[id]/notify
 *
 * "Notify me when tickets go on sale" form submission. Anyone can
 * submit; we dedup on (event_id, lower(email)) so the same person
 * submitting twice doesn't pile up rows. Surfaces the resulting
 * waitlist size to the promoter via the editor (separate endpoint).
 *
 * Defenses:
 *   - Email regex validation (matches the buyer-form rule on the
 *     ticket purchase dialog).
 *   - Rate limit: 5 submissions per IP per hour. Generous for a
 *     real visitor but cuts off bot scraping.
 *   - Optional honeypot field "company" — if filled, silently 200.
 *     Real users don't fill hidden fields; bots do.
 *   - Event must exist and be in `published` status (not draft, not
 *     cancelled). We don't allow registrations on closed events.
 *
 * Idempotency: PostgreSQL unique violation on the dedup index is
 * mapped to a 200 response so resubmitting the same email looks
 * the same as the first submission to the user.
 */
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkLimit, ipFromRequest } from "@/lib/rate-limit"

export const runtime = "nodejs"

// Mirrors the buyer-form regex on /fights/[id] — reject obvious typos
// like "a@" or "@b" that the HTML5 type=email is too permissive on.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params

  // Per-IP rate limit. Generous (5/hr) — a real human submitting once
  // per visit per device is well under, but a script trying to enum
  // events or stuff the table hits the wall fast.
  const ip = ipFromRequest(request)
  const gate = await checkLimit({
    key: `ticket-notify:${ip}`,
    max: 5,
    windowSeconds: 3600,
  })
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: 429, headers: gate.headers },
    )
  }

  let body: { email?: unknown; company?: unknown } | null = null
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
  if (!body || typeof body.email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  // Honeypot — real form has no "company" field; bots fill every
  // input. Pretend success so they don't learn it's a trap.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return NextResponse.json({ ok: true })
  }

  const email = body.email.trim()
  if (email.length > 320 || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 })
  }

  // Validate event — must exist + be visible to the public. We
  // intentionally do NOT require ticket_sales_open=false here:
  // someone might land on a published event that just opened sales
  // before the page rerendered, and an extra interest registration
  // is harmless. Cancelled events get rejected though.
  const { data: ev, error: evErr } = await supabase
    .from("fight_events")
    .select("id, status")
    .eq("id", eventId)
    .single()
  if (evErr || !ev) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }
  if (ev.status !== "published") {
    return NextResponse.json({ error: "Event not available" }, { status: 404 })
  }

  // Insert. If the email_lower trigger from migration 065 has been
  // applied, the dedup index will catch repeats with a 23505 — we
  // map that to 200 so resubmits are idempotent.
  // email_lower is set by trigger but we provide a fallback value
  // so the insert works even if the trigger isn't installed yet
  // (defense-in-depth — keeps the endpoint usable pre-migration).
  const { error: insErr } = await supabase
    .from("ticket_interest")
    .insert({
      event_id: eventId,
      email,
      email_lower: email.toLowerCase(),
    })

  if (insErr) {
    // 23505 = unique_violation; our dedup index hit. Treat as success.
    if (insErr.code === "23505") {
      return NextResponse.json({ ok: true, already_registered: true })
    }
    // 42P01 = undefined_table — migration 065 not applied yet. Tell
    // the user the form isn't ready rather than 500ing silently so
    // a visitor doesn't think they're registered when they aren't.
    if (insErr.code === "42P01") {
      return NextResponse.json(
        { error: "Notify list is not set up yet — check back soon" },
        { status: 503 },
      )
    }
    console.error("[ticket-notify] insert failed:", insErr)
    return NextResponse.json({ error: "Couldn't register" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
