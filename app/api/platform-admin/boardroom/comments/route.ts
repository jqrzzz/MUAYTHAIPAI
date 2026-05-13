/**
 * POST /api/platform-admin/boardroom/comments — post a comment in the
 * Boardroom thread.
 */
import { NextResponse } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BODY = 8000

export async function POST(request: Request) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, user } = auth

  const body = (await request.json().catch(() => ({}))) as { body?: unknown }
  const text = typeof body.body === "string" ? body.body.trim().slice(0, MAX_BODY) : ""
  if (!text) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 })

  const { data, error } = await supabase
    .from("boardroom_comments")
    .insert({ author_id: user.id, body: text })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}
