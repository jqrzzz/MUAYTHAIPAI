/**
 * POST /api/platform-admin/boardroom/files — upload a file to the Boardroom.
 * Service-role for storage (bypasses RLS); the API gate is the platform-admin
 * check.
 */
import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { requirePlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB
const BUCKET = "boardroom"

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { user } = auth

  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB).` },
      { status: 400 },
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: "Server not configured" }, { status: 500 })
  const service = createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Random storage path; preserve the file extension so downloads behave nicely.
  const dot = file.name.lastIndexOf(".")
  const ext = dot >= 0 && dot < file.name.length - 1 ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : ""
  const storagePath = `${crypto.randomUUID()}${ext ? `.${ext}` : ""}`

  const { error: upErr } = await service.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type || undefined,
    upsert: false,
  })
  if (upErr) {
    console.error("[boardroom/files] upload failed:", upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  const { data: row, error: insErr } = await service
    .from("boardroom_files")
    .insert({
      name: file.name.slice(0, 200),
      storage_path: storagePath,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: user.id,
    })
    .select()
    .single()
  if (insErr) {
    // Best-effort cleanup of the orphaned object.
    await service.storage.from(BUCKET).remove([storagePath]).catch(() => null)
    return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ file: row })
}
