/**
 * Single support ticket: fetch full thread, update status, post reply.
 *
 * GET    /api/platform-admin/support/[id]    → ticket + conversation messages
 * PATCH  /api/platform-admin/support/[id]    → update status / priority / category
 *                                              body: { status?, priority?, category?, resolution_summary? }
 * POST   /api/platform-admin/support/[id]/reply  (separate route file)
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { getPlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select(`
      *,
      organizations:org_id (id, name, slug, email),
      users:user_id (id, full_name, email)
    `)
    .eq("id", id)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  // Fetch the conversation thread — all messages including any AI drafts
  let messages: unknown[] = []
  if (ticket.conversation_id) {
    const { data: msgs } = await supabase
      .from("mtp_communication_log")
      .select("id, direction, sender, recipient, body, handled_by, draft_status, needs_review, metadata, created_at")
      .eq("conversation_id", ticket.conversation_id)
      .order("created_at", { ascending: true })
    messages = msgs ?? []
  }

  return NextResponse.json({ ticket, messages })
}

const PatchSchema = z.object({
  status: z.enum(["open", "in_progress", "waiting_customer", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  category: z.enum(["billing", "setup", "feature", "bug", "urgent", "other"]).optional(),
  resolution_summary: z.string().max(1000).optional(),
})

const SLA_HOURS: Record<string, number> = {
  urgent: 1, high: 6, normal: 24, low: 72,
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { supabase, isPlatformAdmin, user } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = { ...parsed.data }

  // Recompute SLA when priority changes
  if (parsed.data.priority) {
    const hours = SLA_HOURS[parsed.data.priority] ?? 24
    update.sla_due_at = new Date(Date.now() + hours * 3600 * 1000).toISOString()
  }

  // Stamp resolution
  if (parsed.data.status === "resolved" || parsed.data.status === "closed") {
    update.resolved_at = new Date().toISOString()
    update.resolved_by = user?.id ?? null
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .update(update)
    .eq("id", id)
    .select()
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ticket: data })
}
