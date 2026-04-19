/**
 * GET  /api/admin/chat-groups/[id]/channels
 * POST /api/admin/chat-groups/[id]/channels
 *
 * Manages the (channel, external_account_id) routing rows in
 * mtp_chat_group_channels for a given chat group. These rows are what
 * the engine's autoBindVisitor() uses to map first-contact inbounds
 * from a gym's account to the right public_inbox group.
 *
 * POST body:
 *   {
 *     channel: 'line' | 'telegram' | 'whatsapp' | 'ig' | 'fb' | 'web' | 'test',
 *     external_account_id: string,
 *     display_label?: string
 *   }
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteParams = { params: { id: string } }

const ALLOWED_CHANNELS = new Set([
  "line",
  "telegram",
  "whatsapp",
  "ig",
  "fb",
  "web",
  "test",
])

export async function GET(_req: Request, { params }: RouteParams) {
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

  // Verify the group belongs to this org before listing.
  const { data: group } = await supabase
    .from("mtp_chat_groups")
    .select("id")
    .eq("id", params.id)
    .eq("org_id", membership.org_id)
    .maybeSingle()

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 })
  }

  const { data: rows, error } = await supabase
    .from("mtp_chat_group_channels")
    .select(
      "id, channel, external_account_id, display_label, is_active, last_inbound_at, created_at",
    )
    .eq("group_id", params.id)
    .order("channel", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ channels: rows ?? [] })
}

export async function POST(request: Request, { params }: RouteParams) {
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
  if (!["owner", "admin"].includes(String(membership.role))) {
    return NextResponse.json(
      { error: "Forbidden: owner or admin required" },
      { status: 403 },
    )
  }

  const { data: group } = await supabase
    .from("mtp_chat_groups")
    .select("id, purpose, is_active")
    .eq("id", params.id)
    .eq("org_id", membership.org_id)
    .maybeSingle()

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const channel = typeof body?.channel === "string" ? body.channel : ""
  const externalAccountId =
    typeof body?.external_account_id === "string"
      ? body.external_account_id.trim()
      : ""
  const displayLabel =
    typeof body?.display_label === "string" ? body.display_label.trim() : null

  if (!ALLOWED_CHANNELS.has(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 })
  }
  if (!externalAccountId) {
    return NextResponse.json(
      { error: "external_account_id is required" },
      { status: 400 },
    )
  }

  const { data: inserted, error } = await supabase
    .from("mtp_chat_group_channels")
    .insert({
      group_id: params.id,
      channel,
      external_account_id: externalAccountId,
      display_label: displayLabel,
      is_active: true,
    })
    .select(
      "id, channel, external_account_id, display_label, is_active, last_inbound_at, created_at",
    )
    .single()

  if (error) {
    // UNIQUE (channel, external_account_id) collision: another gym is
    // already using this account id. Bubble up a clear 409 so the UI
    // can tell the owner what happened.
    // Postgres error 23505 = unique_violation.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (error as any)?.code
    if (code === "23505") {
      return NextResponse.json(
        {
          error:
            "This account is already registered elsewhere. If you own it, contact support.",
        },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ channel: inserted })
}
