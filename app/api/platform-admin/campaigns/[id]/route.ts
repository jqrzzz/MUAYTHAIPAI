import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

const EDITABLE_FIELDS = [
  "name",
  "description",
  "channel",
  "target_filter",
  "subject_template",
  "body_template",
  "personalize_prompt",
  "personalize",
  "from_name",
  "from_email",
  "status",
] as const

async function refreshCounts(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  id: string
) {
  const { data: rows } = await supabase
    .from("campaign_sends")
    .select("status")
    .eq("campaign_id", id)
  const total_drafted = rows?.length ?? 0
  const total_sent =
    rows?.filter((r) =>
      ["sent", "opened", "clicked", "claimed"].includes(r.status)
    ).length ?? 0
  const total_claimed = rows?.filter((r) => r.status === "claimed").length ?? 0
  await supabase
    .from("campaigns")
    .update({ total_drafted, total_sent, total_claimed })
    .eq("id", id)
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await refreshCounts(supabase, id)

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  // Per-status breakdown for the detail view
  const { data: sends } = await supabase
    .from("campaign_sends")
    .select("status")
    .eq("campaign_id", id)
  const breakdown: Record<string, number> = {}
  for (const s of sends || []) {
    breakdown[s.status] = (breakdown[s.status] ?? 0) + 1
  }

  return NextResponse.json({ campaign: data, breakdown })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  for (const key of EDITABLE_FIELDS) {
    if (key in body) updates[key] = body[key]
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No editable fields" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ campaign: data })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }
  const { error } = await supabase.from("campaigns").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
