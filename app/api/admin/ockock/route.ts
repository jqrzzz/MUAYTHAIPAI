/**
 * Owner Assistant chat — the magical OckOck the gym owner talks to.
 *
 * Wires the rich runOwnerAI brain (lib/chat/ai/owner.ts) into the admin
 * console. Persists messages to mtp_communication_log so the owner has
 * continuous chat history across refreshes, and so anything OckOck does
 * (drafts replies, mints action-token deeplinks) is auditable.
 *
 * One owner_assist conversation per (org, owner). Messages flow:
 *   1. POST: log inbound, load history, call runOwnerAI, log outbound
 *   2. GET:  return recent messages so the tab can hydrate on mount
 *
 * The owner_assist group is created automatically by ensureChatGroups
 * (eager on signup, lazy as a self-heal here for any pre-existing gym).
 */

import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { runOwnerAI, type OwnerAIHistoryEntry } from "@/lib/chat/ai/owner"
import { ensureChatGroups } from "@/lib/chat/bootstrap"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY = 40

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase credentials")
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function resolveOwnerContext(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role, organizations(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership || !["owner", "admin"].includes(String(membership.role))) {
    return {
      error: NextResponse.json(
        { error: "OckOck is for gym owners and admins" },
        { status: 403 },
      ),
    }
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const org = membership.organizations as any
  return {
    userId: user.id,
    orgId: membership.org_id as string,
    orgName: (org?.name as string) || "Your gym",
    ownerDisplayName:
      profile?.full_name || profile?.email || user.email || null,
  }
}

/**
 * Find (or create) the single owner_assist conversation for this owner.
 * Self-heals the owner_assist group if it's missing.
 */
async function ensureOwnerConversation(
  supabase: ReturnType<typeof getServiceClient>,
  orgId: string,
  userId: string,
): Promise<{ conversationId: string } | { error: string }> {
  let { data: group } = await supabase
    .from("mtp_chat_groups")
    .select("id")
    .eq("org_id", orgId)
    .eq("purpose", "owner_assist")
    .eq("is_active", true)
    .maybeSingle()

  if (!group) {
    await ensureChatGroups(supabase, orgId)
    const retry = await supabase
      .from("mtp_chat_groups")
      .select("id")
      .eq("org_id", orgId)
      .eq("purpose", "owner_assist")
      .eq("is_active", true)
      .maybeSingle()
    group = retry.data
  }

  if (!group) {
    return { error: "owner_assist group missing and could not be created" }
  }

  const externalThreadId = `owner:${userId}`

  const { data: existing } = await supabase
    .from("mtp_conversations")
    .select("id")
    .eq("org_id", orgId)
    .eq("group_id", group.id)
    .eq("external_thread_id", externalThreadId)
    .maybeSingle()

  if (existing) return { conversationId: existing.id }

  const { data: created, error } = await supabase
    .from("mtp_conversations")
    .insert({
      org_id: orgId,
      group_id: group.id,
      channel: "web",
      external_thread_id: externalThreadId,
      status: "open",
    })
    .select("id")
    .single()

  if (error || !created) {
    return { error: error?.message ?? "could not create conversation" }
  }
  return { conversationId: created.id }
}

export async function GET(request: NextRequest) {
  const ctx = await resolveOwnerContext(request)
  if ("error" in ctx) return ctx.error

  const supabase = getServiceClient()
  const conv = await ensureOwnerConversation(supabase, ctx.orgId, ctx.userId)
  if ("error" in conv) {
    return NextResponse.json({ error: conv.error }, { status: 500 })
  }

  const { data: messages } = await supabase
    .from("mtp_communication_log")
    .select("id, direction, body, created_at")
    .eq("org_id", ctx.orgId)
    .eq("conversation_id", conv.conversationId)
    .order("created_at", { ascending: true })
    .limit(100)

  return NextResponse.json({
    conversationId: conv.conversationId,
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.body,
      createdAt: m.created_at,
    })),
  })
}

export async function POST(request: NextRequest) {
  const ctx = await resolveOwnerContext(request)
  if ("error" in ctx) return ctx.error

  const body = await request.json().catch(() => null)
  const message = (body?.message as string | undefined)?.trim()
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` },
      { status: 400 },
    )
  }

  const supabase = getServiceClient()
  const conv = await ensureOwnerConversation(supabase, ctx.orgId, ctx.userId)
  if ("error" in conv) {
    return NextResponse.json({ error: conv.error }, { status: 500 })
  }

  const now = new Date().toISOString()

  // Log the inbound message immediately so it's in history even if AI errors.
  await supabase.from("mtp_communication_log").insert({
    org_id: ctx.orgId,
    conversation_id: conv.conversationId,
    channel: "web",
    direction: "inbound",
    sender: ctx.userId,
    body: message,
    handled_by: null,
    draft_status: null,
    needs_review: false,
    created_at: now,
  })

  // Load recent history (excluding the message we just inserted).
  const { data: historyRows } = await supabase
    .from("mtp_communication_log")
    .select("direction, body, created_at")
    .eq("conversation_id", conv.conversationId)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY)

  const history: OwnerAIHistoryEntry[] = (historyRows ?? [])
    .slice()
    .reverse()
    .slice(0, -1)
    .map((r) => ({
      direction: r.direction as "inbound" | "outbound",
      body: r.body,
    }))

  let replyText = "Owner AI is taking longer than usual — try again in a moment."
  let aiMeta: Record<string, unknown> | undefined

  try {
    const result = await runOwnerAI({
      supabase,
      orgId: ctx.orgId,
      orgName: ctx.orgName,
      userId: ctx.userId,
      ownerDisplayName: ctx.ownerDisplayName,
      ownerConversationId: conv.conversationId,
      userMessage: message,
      history,
    })
    if (result.replyText) replyText = result.replyText
    aiMeta = result.meta
  } catch (err) {
    console.error("[admin/ockock] runOwnerAI failed:", err)
  }

  const replyAt = new Date().toISOString()
  await supabase.from("mtp_communication_log").insert({
    org_id: ctx.orgId,
    conversation_id: conv.conversationId,
    channel: "web",
    direction: "outbound",
    recipient: ctx.userId,
    body: replyText,
    handled_by: "ai",
    draft_status: "approved",
    needs_review: false,
    metadata: aiMeta ?? null,
    created_at: replyAt,
  })

  await supabase
    .from("mtp_conversations")
    .update({
      last_message_at: replyAt,
      last_message_preview: replyText.slice(0, 120),
      updated_at: replyAt,
    })
    .eq("id", conv.conversationId)

  return NextResponse.json({
    response: replyText,
    conversationId: conv.conversationId,
  })
}
