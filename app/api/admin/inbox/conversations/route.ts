/**
 * GET /api/admin/inbox/conversations
 *
 * Lists conversations for the authenticated admin's organization. Supports
 * an optional `status` filter (open | awaiting_human | closed). Returns
 * the latest 50 conversations, ordered by last_message_at DESC.
 *
 * Each conversation is decorated with:
 *   - pendingDraftCount — how many AI drafts are waiting for owner review
 *   - needsReviewCount  — how many sent outbound messages are flagged for review
 *   - group             — chat_group summary (name, purpose) for grouping in UI
 *
 * Auth: SSR client + org_members lookup. RLS policies on the mtp_* tables
 * already enforce that only owners/admins/trainers of the org can read,
 * but the membership check is kept explicit so the 403 path is clean.
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_STATUSES = new Set(["open", "awaiting_human", "closed"])
const PAGE_SIZE = 50

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) {
    return NextResponse.json({ error: "No organization" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get("status")

  let q = supabase
    .from("mtp_conversations")
    .select(
      `id,
       channel,
       external_thread_id,
       status,
       last_message_at,
       last_message_preview,
       assigned_to,
       group_id,
       mtp_chat_groups!inner(id, name, purpose)`,
    )
    .eq("org_id", membership.org_id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(PAGE_SIZE)

  if (statusFilter && ALLOWED_STATUSES.has(statusFilter)) {
    q = q.eq("status", statusFilter)
  }

  const { data: conversations, error } = await q

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const list = (conversations ?? []) as Array<{
    id: string
    channel: string
    external_thread_id: string
    status: string
    last_message_at: string | null
    last_message_preview: string | null
    assigned_to: string | null
    group_id: string
    mtp_chat_groups:
      | { id: string; name: string; purpose: string }
      | Array<{ id: string; name: string; purpose: string }>
  }>

  if (list.length === 0) {
    return NextResponse.json({ conversations: [] })
  }

  const convoIds = list.map((c) => c.id)

  // Counts per conversation. Two lightweight queries (drafts, needs_review).
  const [draftsRes, reviewRes] = await Promise.all([
    supabase
      .from("mtp_communication_log")
      .select("conversation_id", { count: "exact", head: false })
      .eq("org_id", membership.org_id)
      .eq("draft_status", "pending")
      .in("conversation_id", convoIds),
    supabase
      .from("mtp_communication_log")
      .select("conversation_id", { count: "exact", head: false })
      .eq("org_id", membership.org_id)
      .eq("needs_review", true)
      .in("conversation_id", convoIds),
  ])

  const draftCounts = new Map<string, number>()
  for (const row of (draftsRes.data ?? []) as Array<{ conversation_id: string }>) {
    draftCounts.set(row.conversation_id, (draftCounts.get(row.conversation_id) ?? 0) + 1)
  }

  const reviewCounts = new Map<string, number>()
  for (const row of (reviewRes.data ?? []) as Array<{ conversation_id: string }>) {
    reviewCounts.set(row.conversation_id, (reviewCounts.get(row.conversation_id) ?? 0) + 1)
  }

  const decorated = list.map((c) => {
    const group = Array.isArray(c.mtp_chat_groups)
      ? c.mtp_chat_groups[0]
      : c.mtp_chat_groups
    return {
      id: c.id,
      channel: c.channel,
      externalThreadId: c.external_thread_id,
      status: c.status,
      lastMessageAt: c.last_message_at,
      lastMessagePreview: c.last_message_preview,
      assignedTo: c.assigned_to,
      group: group ?? { id: c.group_id, name: "Unknown", purpose: "public_inbox" },
      pendingDraftCount: draftCounts.get(c.id) ?? 0,
      needsReviewCount: reviewCounts.get(c.id) ?? 0,
    }
  })

  return NextResponse.json({ conversations: decorated })
}
