/**
 * DELETE /api/platform-admin/boardroom/files/[id] — remove a Boardroom file
 * (both the storage object and the DB row).
 */
import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { requirePlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BUCKET = "boardroom"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: "Server not configured" }, { status: 500 })
  const service = createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: file } = await service
    .from("boardroom_files")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle()
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await service.storage.from(BUCKET).remove([file.storage_path]).catch(() => null)
  const { error: delErr } = await service.from("boardroom_files").delete().eq("id", id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
