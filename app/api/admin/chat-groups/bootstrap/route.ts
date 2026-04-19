/**
 * POST /api/admin/chat-groups/bootstrap
 *
 * Idempotent: ensures the current org has at least one `public_inbox`
 * group and one `owner_assist` group. Safe to call any number of times —
 * creates what's missing, leaves what's there alone.
 *
 * Returns all groups for the org so the channels UI can render them
 * without a separate GET round-trip.
 *
 * Auth: owner or admin. Trainers can read via GET /api/admin/chat-groups
 * but shouldn't be creating groups on the owner's behalf.
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type GroupRow = {
  id: string
  org_id: string
  name: string
  purpose: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function POST() {
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

  const { data: existing, error: listErr } = await supabase
    .from("mtp_chat_groups")
    .select("id, org_id, name, purpose, description, is_active, created_at, updated_at")
    .eq("org_id", membership.org_id)

  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 })
  }

  const existingByPurpose = new Map<string, GroupRow>()
  for (const g of (existing ?? []) as GroupRow[]) {
    if (!existingByPurpose.has(g.purpose)) existingByPurpose.set(g.purpose, g)
  }

  const toCreate: Array<{ purpose: string; name: string; description: string }> = []
  if (!existingByPurpose.has("public_inbox")) {
    toCreate.push({
      purpose: "public_inbox",
      name: "Public Inbox",
      description:
        "All incoming messages from visitors and students across every connected channel.",
    })
  }
  if (!existingByPurpose.has("owner_assist")) {
    toCreate.push({
      purpose: "owner_assist",
      name: "Owner Assistant",
      description:
        "Private channel between the gym owner and the assistant AI.",
    })
  }

  if (toCreate.length > 0) {
    const { error: insertErr } = await supabase
      .from("mtp_chat_groups")
      .insert(
        toCreate.map((g) => ({
          org_id: membership.org_id,
          name: g.name,
          purpose: g.purpose,
          description: g.description,
          is_active: true,
        })),
      )
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }
  }

  // Re-fetch so the response reflects a consistent post-bootstrap state.
  const { data: groups } = await supabase
    .from("mtp_chat_groups")
    .select("id, org_id, name, purpose, description, is_active, created_at, updated_at")
    .eq("org_id", membership.org_id)
    .order("purpose", { ascending: true })

  return NextResponse.json({ groups: groups ?? [], created: toCreate.length })
}
