/**
 * POST /api/admin/inbox/drafts/[id]/reject
 *
 * Marks a pending AI draft as rejected. The row is NOT deleted — we
 * keep it for audit, but it will never be sent. The conversation's
 * needs_review flag on the row is cleared so it stops nagging the owner.
 *
 * No outbound side-effect. Safe for any owner or admin to call.
 */

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteParams = { params: { id: string } }

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase service credentials")
  }
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(_req: Request, { params }: RouteParams) {
  const ssr = await createServerClient()

  const {
    data: { user },
  } = await ssr.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await ssr
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

  const draftId = params.id
  if (!draftId) {
    return NextResponse.json({ error: "Missing draft id" }, { status: 400 })
  }

  let service
  try {
    service = getServiceClient()
  } catch (err) {
    console.error("[api/admin/inbox] service client unavailable:", err)
    return NextResponse.json(
      { error: "service_unavailable" },
      { status: 500 },
    )
  }

  const { data: draft } = await service
    .from("mtp_communication_log")
    .select("id, org_id, draft_status, direction")
    .eq("id", draftId)
    .eq("org_id", membership.org_id)
    .maybeSingle()

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 })
  }
  if (draft.direction !== "outbound") {
    return NextResponse.json(
      { error: "Not an outbound draft" },
      { status: 400 },
    )
  }
  if (draft.draft_status !== "pending") {
    return NextResponse.json(
      { error: `Draft not pending (status=${draft.draft_status ?? "null"})` },
      { status: 400 },
    )
  }

  const { error: updErr } = await service
    .from("mtp_communication_log")
    .update({
      draft_status: "rejected",
      needs_review: false,
      handled_by: "human",
    })
    .eq("id", draft.id)

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, draft_id: draft.id })
}
