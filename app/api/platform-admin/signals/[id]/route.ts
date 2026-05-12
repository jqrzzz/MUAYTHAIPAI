/**
 * Dismiss / mark-acted on a platform signal.
 *
 * PATCH /api/platform-admin/signals/[id]
 *   body: { status: 'dismissed' | 'acted_on' | 'open' }
 *
 * Stamps the operator + timestamp so the audit story is clean.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { logAudit } from "@/lib/audit-log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PatchSchema = z.object({
  status: z.enum(["open", "dismissed", "acted_on"]),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { supabase, isPlatformAdmin, user } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = { status: parsed.data.status }
  const now = new Date().toISOString()
  if (parsed.data.status === "dismissed") {
    update.dismissed_at = now
    update.dismissed_by = user?.id ?? null
  } else if (parsed.data.status === "acted_on") {
    update.acted_at = now
    update.acted_by = user?.id ?? null
  }

  const { data, error } = await supabase
    .from("platform_signals")
    .update(update)
    .eq("id", id)
    .select("id, kind, target_org_id, title")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit(supabase, {
    action: `signal.${parsed.data.status}`,
    actorUserId: user?.id ?? null,
    actorEmail: user?.email ?? null,
    targetType: "platform_signal",
    targetId: id,
    targetLabel: data.title,
    metadata: { kind: data.kind, target_org_id: data.target_org_id },
    request,
  })

  return NextResponse.json({ ok: true })
}
