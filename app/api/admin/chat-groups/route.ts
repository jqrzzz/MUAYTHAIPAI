/**
 * GET /api/admin/chat-groups
 *
 * Lists all chat groups for the authenticated admin's organization.
 * Used by the channels UI to render one panel per purpose.
 *
 * Each group is decorated with the count of channel routing rows
 * (mtp_chat_group_channels) so the UI can show "3 channels connected"
 * without a second round-trip per group.
 */

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
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

  const { data: groups, error } = await supabase
    .from("mtp_chat_groups")
    .select(
      "id, org_id, name, purpose, description, is_active, created_at, updated_at",
    )
    .eq("org_id", membership.org_id)
    .order("purpose", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const groupList = groups ?? []
  const groupIds = groupList.map((g) => g.id)

  let channelCountByGroup = new Map<string, number>()
  if (groupIds.length > 0) {
    const { data: channelRows } = await supabase
      .from("mtp_chat_group_channels")
      .select("group_id")
      .in("group_id", groupIds)
      .eq("is_active", true)
    channelCountByGroup = new Map()
    for (const row of (channelRows ?? []) as Array<{ group_id: string }>) {
      channelCountByGroup.set(
        row.group_id,
        (channelCountByGroup.get(row.group_id) ?? 0) + 1,
      )
    }
  }

  const decorated = groupList.map((g) => ({
    ...g,
    channelCount: channelCountByGroup.get(g.id) ?? 0,
  }))

  return NextResponse.json({ groups: decorated, role: membership.role })
}
