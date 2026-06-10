/**
 * POST /api/admin/gym-logo   upload a new logo (multipart/form-data: file)
 * DELETE /api/admin/gym-logo  clear the current logo + remove stored files
 *
 * Service-role for storage (bypasses RLS); the API gate is requireGymAdmin
 * so only owners/admins of a gym can change its logo. Bucket is public
 * (gym-logos) so the URL renders directly on /gyms/[slug] etc.
 */
import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BUCKET = "gym-logos"
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = /^image\/(jpeg|png|webp|gif)$/

function service() {
  return createServiceClient()
}

export async function POST(request: NextRequest) {
  const auth = await requireGymAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { orgId } = auth

  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Logo too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB).` },
      { status: 400 },
    )
  }
  if (!ALLOWED_MIME.test(file.type)) {
    return NextResponse.json(
      { error: "Logo must be JPEG, PNG, WebP, or GIF." },
      { status: 400 },
    )
  }

  let svc
  try {
    svc = service()
  } catch {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 })
  }

  const dot = file.name.lastIndexOf(".")
  const ext =
    dot >= 0 && dot < file.name.length - 1
      ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "")
      : "png"
  const path = `${orgId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

  const { error: upErr } = await svc.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (upErr) {
    console.error("[gym-logo] upload failed:", upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  const { data: pub } = svc.storage.from(BUCKET).getPublicUrl(path)
  const newUrl = pub?.publicUrl ?? null
  if (!newUrl) {
    return NextResponse.json({ error: "Couldn't generate public URL" }, { status: 500 })
  }

  const { error: orgErr } = await svc
    .from("organizations")
    .update({ logo_url: newUrl, updated_at: new Date().toISOString() })
    .eq("id", orgId)
  if (orgErr) {
    return NextResponse.json({ error: orgErr.message }, { status: 500 })
  }

  return NextResponse.json({ logo_url: newUrl })
}

export async function DELETE() {
  const auth = await requireGymAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { orgId } = auth

  let svc
  try {
    svc = service()
  } catch {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 })
  }

  await svc
    .from("organizations")
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq("id", orgId)

  // Best-effort cleanup of stored files in this gym's folder.
  const { data: files } = await svc.storage.from(BUCKET).list(orgId)
  if (files && files.length > 0) {
    await svc.storage
      .from(BUCKET)
      .remove(files.map((f) => `${orgId}/${f.name}`))
      .catch(() => null)
  }

  return NextResponse.json({ ok: true })
}
