/**
 * Global search across the platform.
 *
 * GET /api/platform-admin/search?q=...
 *
 * Fans out across orgs, users, bookings, discovered_gyms, and Stripe IDs.
 * Returns categorized results, each with a `kind`, label, sub, and
 * `jump_to` URL the UI can navigate to.
 *
 * Designed for the Cmd+K modal — fast, conservative limits, ranked by
 * exact match → prefix → contains.
 */
import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Result {
  kind: "gym" | "user" | "booking" | "discovered_gym" | "stripe" | "ticket"
  id: string
  label: string
  sub?: string
  jump_to: string
  /** Higher = more relevant */
  score: number
}

export async function GET(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const q = (url.searchParams.get("q") ?? "").trim()
  if (q.length < 2) {
    return NextResponse.json({ results: [], query: q })
  }

  const lower = q.toLowerCase()
  const ilikePattern = `%${q.replace(/[%_]/g, "\\$&")}%`
  const stripeId = /^(ch_|pi_|cus_|sub_|in_|txn_|re_|acct_)/.test(q)

  // Score helper: 100 exact, 60 prefix, 30 contains
  const scoreOf = (haystack: string | null | undefined): number => {
    if (!haystack) return 0
    const h = haystack.toLowerCase()
    if (h === lower) return 100
    if (h.startsWith(lower)) return 60
    if (h.includes(lower)) return 30
    return 0
  }

  // Fan out — keep each query small + bounded
  const [gymsRes, usersRes, bookingsRes, discoveredRes, ticketsRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, email, city")
      .or(`name.ilike.${ilikePattern},slug.ilike.${ilikePattern},email.ilike.${ilikePattern}`)
      .limit(8),
    supabase
      .from("users")
      .select("id, full_name, email")
      .or(`full_name.ilike.${ilikePattern},email.ilike.${ilikePattern}`)
      .limit(8),
    // Bookings: search by guest_email, guest_name, or stripe PI/charge ID
    stripeId
      ? supabase
          .from("bookings")
          .select("id, org_id, guest_name, guest_email, booking_date, payment_amount_thb, payment_amount_usd, stripe_payment_intent_id, stripe_charge_id, organizations:org_id(name)")
          .or(`stripe_payment_intent_id.eq.${q},stripe_charge_id.eq.${q}`)
          .limit(5)
      : supabase
          .from("bookings")
          .select("id, org_id, guest_name, guest_email, booking_date, payment_amount_thb, payment_amount_usd, stripe_payment_intent_id, stripe_charge_id, organizations:org_id(name)")
          .or(`guest_email.ilike.${ilikePattern},guest_name.ilike.${ilikePattern}`)
          .order("booking_date", { ascending: false })
          .limit(5),
    supabase
      .from("discovered_gyms")
      .select("id, name, city, status, website")
      .or(`name.ilike.${ilikePattern},city.ilike.${ilikePattern}`)
      .limit(5),
    supabase
      .from("support_tickets")
      .select("id, subject, category, priority, status, organizations:org_id(name)")
      .or(`subject.ilike.${ilikePattern},initial_body.ilike.${ilikePattern}`)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const results: Result[] = []

  for (const g of gymsRes.data ?? []) {
    const score = Math.max(scoreOf(g.name), scoreOf(g.slug), scoreOf(g.email))
    if (score === 0) continue
    results.push({
      kind: "gym",
      id: g.id,
      label: g.name,
      sub: [g.city, g.slug ? `/${g.slug}` : null, g.email].filter(Boolean).join(" · "),
      jump_to: `/platform-admin?tab=gyms&gym=${g.id}`,
      score,
    })
  }

  for (const u of usersRes.data ?? []) {
    const score = Math.max(scoreOf(u.full_name), scoreOf(u.email))
    if (score === 0) continue
    results.push({
      kind: "user",
      id: u.id,
      label: u.full_name || u.email || "—",
      sub: u.full_name && u.email ? u.email : undefined,
      jump_to: `/platform-admin?tab=students&user=${u.id}`,
      score,
    })
  }

  for (const b of bookingsRes.data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org = Array.isArray((b as any).organizations) ? (b as any).organizations[0] : (b as any).organizations
    const amountStr = b.payment_amount_usd
      ? `$${(b.payment_amount_usd / 100).toFixed(2)}`
      : b.payment_amount_thb
        ? `฿${b.payment_amount_thb.toLocaleString()}`
        : ""
    const score = stripeId
      ? 100
      : Math.max(scoreOf(b.guest_email), scoreOf(b.guest_name))
    if (score === 0) continue
    results.push({
      kind: "booking",
      id: b.id,
      label: `${b.guest_name || b.guest_email || "—"} · ${b.booking_date}`,
      sub: [org?.name, amountStr, b.stripe_payment_intent_id?.slice(0, 16)]
        .filter(Boolean)
        .join(" · "),
      jump_to: `/platform-admin?tab=bookings`,
      score,
    })
  }

  for (const d of discoveredRes.data ?? []) {
    const score = Math.max(scoreOf(d.name), scoreOf(d.city))
    if (score === 0) continue
    results.push({
      kind: "discovered_gym",
      id: d.id,
      label: d.name,
      sub: [d.city, `status: ${d.status}`].filter(Boolean).join(" · "),
      jump_to: `/platform-admin?tab=network&discovered=${d.id}`,
      score,
    })
  }

  for (const t of ticketsRes.data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const org = Array.isArray((t as any).organizations) ? (t as any).organizations[0] : (t as any).organizations
    const score = scoreOf(t.subject)
    if (score === 0) continue
    results.push({
      kind: "ticket",
      id: t.id,
      label: t.subject,
      sub: [org?.name, t.priority, t.status].filter(Boolean).join(" · "),
      jump_to: `/platform-admin?tab=support&ticket=${t.id}`,
      score,
    })
  }

  // Stripe IDs that didn't match a booking — still acknowledge them
  if (stripeId && results.filter((r) => r.kind === "booking").length === 0) {
    results.push({
      kind: "stripe",
      id: q,
      label: q,
      sub: "Stripe ID — no booking record found",
      jump_to: `https://dashboard.stripe.com/payments/${q}`,
      score: 50,
    })
  }

  results.sort((a, b) => b.score - a.score)
  return NextResponse.json({ results: results.slice(0, 25), query: q })
}
