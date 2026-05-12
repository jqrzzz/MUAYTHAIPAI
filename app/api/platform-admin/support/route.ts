/**
 * Platform-admin support queue.
 *
 * GET /api/platform-admin/support?status=open|in_progress|...|all
 *
 * Returns tickets with everything the operator needs in one view:
 *   - workflow metadata (priority, status, SLA risk)
 *   - the original message + author + gym
 *   - the AI-drafted reply (still pending → in the conversation log)
 *
 * Sorted by SLA risk desc — overdue tickets first, then approaching.
 */
import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface TicketRow {
  id: string
  org_id: string
  user_id: string | null
  conversation_id: string | null
  subject: string
  initial_body: string
  source_url: string | null
  category: string
  priority: string
  ai_summary: string | null
  status: string
  sla_due_at: string | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organizations: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any
}

export async function GET(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get("status") ?? "open"

  let query = supabase
    .from("support_tickets")
    .select(`
      id, org_id, user_id, conversation_id,
      subject, initial_body, source_url,
      category, priority, ai_summary,
      status, sla_due_at, resolved_at, resolved_by, created_at,
      organizations:org_id (id, name, slug, email),
      users:user_id (id, full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(200)

  if (status === "open_all") {
    // Convenience: anything not resolved/closed
    query = query.in("status", ["open", "in_progress", "waiting_customer"])
  } else if (status !== "all") {
    query = query.eq("status", status)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = Date.now()
  const tickets = ((data ?? []) as TicketRow[]).map((t) => {
    const org = Array.isArray(t.organizations) ? t.organizations[0] : t.organizations
    const u = Array.isArray(t.users) ? t.users[0] : t.users
    const slaDue = t.sla_due_at ? new Date(t.sla_due_at).getTime() : null
    const minutes_remaining = slaDue ? Math.round((slaDue - now) / 60000) : null
    return {
      id: t.id,
      org_id: t.org_id,
      gym_name: org?.name ?? "—",
      gym_slug: org?.slug ?? null,
      gym_email: org?.email ?? null,
      author_name: u?.full_name ?? null,
      author_email: u?.email ?? null,
      conversation_id: t.conversation_id,
      subject: t.subject,
      initial_body: t.initial_body,
      source_url: t.source_url,
      category: t.category,
      priority: t.priority,
      ai_summary: t.ai_summary,
      status: t.status,
      sla_due_at: t.sla_due_at,
      minutes_remaining,
      created_at: t.created_at,
      resolved_at: t.resolved_at,
    }
  })

  // Re-sort by SLA urgency (overdue first, then closest deadline)
  tickets.sort((a, b) => {
    if (a.minutes_remaining == null && b.minutes_remaining == null) return 0
    if (a.minutes_remaining == null) return 1
    if (b.minutes_remaining == null) return -1
    return a.minutes_remaining - b.minutes_remaining
  })

  // Counts for the filter chips
  const counts = {
    open: 0,
    in_progress: 0,
    waiting_customer: 0,
    resolved: 0,
    closed: 0,
    overdue: 0,
  }
  for (const t of tickets) {
    if (t.status in counts) {
      counts[t.status as keyof typeof counts]++
    }
    if (
      t.minutes_remaining != null &&
      t.minutes_remaining < 0 &&
      ["open", "in_progress", "waiting_customer"].includes(t.status)
    ) {
      counts.overdue++
    }
  }

  return NextResponse.json({ tickets, counts })
}
