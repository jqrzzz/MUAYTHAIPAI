/**
 * PATCH /api/promoter/events/[id]/marketing/[draftId]
 *
 * Mark a draft as 'used' (promoter copied the caption) or
 * 'dismissed' (rejected). Used purely as the learning signal —
 * the actual copy happens client-side via navigator.clipboard,
 * we just record the outcome.
 *
 * DELETE /api/promoter/events/[id]/marketing/[draftId]
 *
 * Hard-deletes a draft. Use when the promoter explicitly wants
 * the row gone (e.g. wrong language, off-brand). The dismissed
 * status keeps the row for learning; DELETE removes it.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function gate(eventId: string) {
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) return { error: "Unauthorized", status: 401 as const }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return { error: "Event not found", status: 404 as const }
  }
  return { supabase, auth }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; draftId: string }> },
) {
  const { id: eventId, draftId } = await params
  const g = await gate(eventId)
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })

  const body = await request.json().catch(() => ({}))
  const action = body?.action
  if (action !== "used" && action !== "dismissed") {
    return NextResponse.json(
      { error: "action must be 'used' or 'dismissed'" },
      { status: 400 },
    )
  }

  const { data: draft, error: loadErr } = await g.supabase
    .from("marketing_drafts")
    .select("id, event_id, status")
    .eq("id", draftId)
    .eq("event_id", eventId)
    .single()

  if (loadErr || !draft) {
    if (loadErr?.code === "42P01") {
      return NextResponse.json({ ok: true, persisted: false })
    }
    return NextResponse.json({ error: "Draft not found" }, { status: 404 })
  }

  // Idempotent: re-marking a draft with the same status is a
  // no-op success so the UI can flush a stale list without errors.
  if (draft.status === action) {
    return NextResponse.json({ ok: true, already_resolved: true })
  }

  const updates: Record<string, string | null> = { status: action }
  if (action === "used") {
    updates.used_at = new Date().toISOString()
  }

  const { error } = await g.supabase
    .from("marketing_drafts")
    .update(updates)
    .eq("id", draftId)

  if (error) {
    console.error("[marketing/resolve] update failed:", error)
    return NextResponse.json(
      { error: "Couldn't update draft" },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; draftId: string }> },
) {
  const { id: eventId, draftId } = await params
  const g = await gate(eventId)
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })

  const { error } = await g.supabase
    .from("marketing_drafts")
    .delete()
    .eq("id", draftId)
    .eq("event_id", eventId)

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ ok: true, persisted: false })
    }
    console.error("[marketing/delete] failed:", error)
    return NextResponse.json(
      { error: "Couldn't delete draft" },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
