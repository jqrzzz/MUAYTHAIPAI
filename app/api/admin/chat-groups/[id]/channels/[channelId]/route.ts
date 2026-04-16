/**
 * PATCH  /api/admin/chat-groups/[id]/channels/[channelId]
 * DELETE /api/admin/chat-groups/[id]/channels/[channelId]
 *
 * Update or remove one routing row in mtp_chat_group_channels.
 *
 * PATCH body:
 *   { is_active?: boolean, display_label?: string }
 *
 * DELETE: hard-deletes. Visitor members already bound to this group
 * are preserved — disabling a channel row just stops NEW first-contact
 * auto-bind, it doesn't orphan existing conversations.
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteParams = { params: { id: string; channelId: string } }

async function loadContext(params: RouteParams["params"]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" as const, status: 401 }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!membership) return { error: "No organization" as const, status: 403 }
  if (!["owner", "admin"].includes(String(membership.role))) {
    return { error: "Forbidden: owner or admin required" as const, status: 403 }
  }

  const { data: group } = await supabase
    .from("mtp_chat_groups")
    .select("id")
    .eq("id", params.id)
    .eq("org_id", membership.org_id)
    .maybeSingle()

  if (!group) return { error: "Group not found" as const, status: 404 }

  return { supabase, membership, group }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await loadContext(params)
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  }

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (typeof body?.is_active === "boolean") updates.is_active = body.is_active
  if (typeof body?.display_label === "string") {
    updates.display_label = body.display_label.trim() || null
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "No updatable fields" }, { status: 400 })
  }

  const { data: updated, error } = await ctx.supabase
    .from("mtp_chat_group_channels")
    .update(updates)
    .eq("id", params.channelId)
    .eq("group_id", params.id)
    .select(
      "id, channel, external_account_id, display_label, is_active, last_inbound_at, created_at",
    )
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!updated) {
    return NextResponse.json({ error: "Channel row not found" }, { status: 404 })
  }

  return NextResponse.json({ channel: updated })
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const ctx = await loadContext(params)
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  }

  const { error } = await ctx.supabase
    .from("mtp_chat_group_channels")
    .delete()
    .eq("id", params.channelId)
    .eq("group_id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
