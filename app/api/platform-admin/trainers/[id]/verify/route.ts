/**
 * Toggle the "Verified Examiner" badge on a user.
 *
 * POST /api/platform-admin/trainers/[id]/verify
 *   body: { verified: boolean, note?: string }
 *
 * Auth: platform admin only.
 * The id in the URL is the user_id (matches platform-admin/trainers list).
 *
 * Writes to audit log so the verification trail is itself verifiable.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { logAudit } from "@/lib/audit-log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BodySchema = z.object({
  verified: z.boolean(),
  note: z.string().trim().max(400).optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { supabase, user, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {
    is_verified_examiner: parsed.data.verified,
  }
  if (parsed.data.verified) {
    update.verified_examiner_at = new Date().toISOString()
    update.verified_examiner_by = user?.id ?? null
    if (parsed.data.note !== undefined) {
      update.verified_examiner_note = parsed.data.note || null
    }
  } else {
    // Revoking — clear the metadata so the audit story is clean.
    update.verified_examiner_at = null
    update.verified_examiner_by = null
    update.verified_examiner_note = null
  }

  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", id)
    .select("id, full_name, is_verified_examiner")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit(supabase, {
    action: parsed.data.verified ? "instructor.verify" : "instructor.unverify",
    actorUserId: user?.id ?? null,
    actorEmail: user?.email ?? null,
    targetType: "user",
    targetId: id,
    targetLabel: data.full_name ?? null,
    metadata: { note: parsed.data.note ?? null },
    request,
  })

  return NextResponse.json({ ok: true, user: data })
}
