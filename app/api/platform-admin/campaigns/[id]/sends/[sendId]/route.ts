import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

const EDITABLE_FIELDS = ["subject", "body", "to_address", "status"] as const
const VALID_STATUSES_FOR_PATCH = ["draft", "approved", "rejected"]

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; sendId: string }> }
) {
  const { id, sendId } = await context.params
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  for (const key of EDITABLE_FIELDS) {
    if (key in body) updates[key] = body[key]
  }
  if (
    updates.status &&
    !VALID_STATUSES_FOR_PATCH.includes(updates.status as string)
  ) {
    return NextResponse.json(
      { error: `status must be one of ${VALID_STATUSES_FOR_PATCH.join(", ")}` },
      { status: 400 }
    )
  }
  if (updates.status === "approved") {
    updates.approved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("campaign_sends")
    .update(updates)
    .eq("id", sendId)
    .eq("campaign_id", id)
    .select()
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ send: data })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; sendId: string }> }
) {
  const { id, sendId } = await context.params
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }
  const { error } = await supabase
    .from("campaign_sends")
    .delete()
    .eq("id", sendId)
    .eq("campaign_id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
