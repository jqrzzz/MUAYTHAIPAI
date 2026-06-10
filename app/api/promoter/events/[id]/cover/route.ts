/**
 * POST /api/promoter/events/[id]/cover   upload an event cover image
 *                                         (multipart/form-data: file)
 * DELETE /api/promoter/events/[id]/cover  clear the cover + delete stored files
 *
 * Service-role for storage (bypasses RLS); the API gate is
 * getPromoterAuth + verifyEventOwnership so only the org that owns
 * the event can change its cover. Bucket is "event-covers" (public),
 * created by migration 061. The URL gets written to
 * fight_events.cover_image_url which the public fight detail page,
 * the fight index card, and the dynamic OG image all consume.
 *
 * Same shape as /api/admin/gym-logo (Batch B) so the upload UI on
 * the editor's Details tab can mirror the gym-logo upload UX.
 */
import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BUCKET = "event-covers"
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB — covers are bigger than logos
const ALLOWED_MIME = /^image\/(jpeg|png|webp|gif)$/

function service() {
  return createServiceClient()
}

async function authorize(eventId: string) {
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) return { ok: false as const, status: 401, error: "Unauthorized" }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return { ok: false as const, status: 404, error: "Event not found" }
  }
  return { ok: true as const, orgId: auth.orgId, userId: auth.userId }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params
  const auth = await authorize(eventId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Cover too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB).` },
      { status: 400 },
    )
  }
  if (!ALLOWED_MIME.test(file.type)) {
    return NextResponse.json(
      { error: "Cover must be JPEG, PNG, WebP, or GIF." },
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
      : "jpg"
  const path = `${eventId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

  const { error: upErr } = await svc.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (upErr) {
    // Bucket missing? Surface a clear message — migration 061 hasn't
    // been applied yet on this database.
    if (upErr.message?.toLowerCase().includes("bucket")) {
      return NextResponse.json(
        {
          error:
            "Cover image storage isn't enabled yet. Apply migration 061 (event-covers bucket) first.",
        },
        { status: 503 },
      )
    }
    console.error("[event-cover] upload failed:", upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  const { data: pub } = svc.storage.from(BUCKET).getPublicUrl(path)
  const newUrl = pub?.publicUrl ?? null
  if (!newUrl) {
    return NextResponse.json({ error: "Couldn't generate public URL" }, { status: 500 })
  }

  const { error: evtErr } = await svc
    .from("fight_events")
    .update({ cover_image_url: newUrl, updated_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("org_id", auth.orgId)
  if (evtErr) {
    return NextResponse.json({ error: evtErr.message }, { status: 500 })
  }

  return NextResponse.json({ cover_image_url: newUrl })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params
  const auth = await authorize(eventId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  let svc
  try {
    svc = service()
  } catch {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 })
  }

  await svc
    .from("fight_events")
    .update({ cover_image_url: null, updated_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("org_id", auth.orgId)

  // Best-effort cleanup — remove stored files for this event.
  const { data: files } = await svc.storage.from(BUCKET).list(eventId)
  if (files && files.length > 0) {
    await svc.storage
      .from(BUCKET)
      .remove(files.map((f) => `${eventId}/${f.name}`))
      .catch(() => null)
  }

  return NextResponse.json({ ok: true })
}
