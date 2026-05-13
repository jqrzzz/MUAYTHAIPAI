/**
 * PATCH /api/platform-admin/boardroom/notes — update the (singleton) notes doc.
 */
import { NextResponse } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BODY = 100_000 // ~100k chars; way more than anyone needs for notes

export async function PATCH(request: Request) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, user } = auth

  const body = (await request.json().catch(() => ({}))) as { body?: unknown }
  const text = typeof body.body === "string" ? body.body.slice(0, MAX_BODY) : ""

  const { data, error } = await supabase
    .from("boardroom_notes")
    .upsert(
      { id: 1, body: text, updated_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes: data })
}
