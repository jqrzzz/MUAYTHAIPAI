/**
 * POST /api/admin/inbox/drafts/[id]/approve
 *
 * Approves and sends a pending AI draft inline from the admin inbox.
 * Re-uses `sendPendingDraftHandler` — the same code path the owner-AI
 * action-token flow uses — so the side effects are identical (log row
 * flipped to 'approved', external_message_id stamped, conversation
 * status bumped open).
 *
 * Auth: SSR session + active org_members row must resolve. We require
 * owner or admin role — trainers can read the inbox but should not send
 * on the gym's behalf.
 */

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { sendPendingDraftHandler } from "@/lib/chat/actions/handlers/send-pending-draft"
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

  const result = await sendPendingDraftHandler.execute(
    service,
    { draft_id: draftId },
    { orgId: membership.org_id, userId: user.id },
  )

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 })
  }
  return NextResponse.json(result)
}
