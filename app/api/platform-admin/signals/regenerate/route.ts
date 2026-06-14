/**
 * Manual signal regeneration trigger for the platform operator.
 *
 * POST /api/platform-admin/signals/regenerate
 *
 * Runs the same logic as the cron — useful for "refresh now" buttons in
 * the UI. Reuses the cron handler by setting the bearer auth.
 */
import { NextResponse } from "next/server"
import type { Json, TablesInsert } from "@/lib/supabase/database.types"
import { createServiceClient } from "@/lib/supabase/service"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import {
  aiReframeSignals,
  buildSnapshot,
  generateAllSignals,
} from "@/lib/platform-signals"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST() {
  const { isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Service-role client so we can write to platform_signals regardless
  // of the cookie session
  const supabase = createServiceClient()

  const snap = await buildSnapshot(supabase)
  let drafts = generateAllSignals(snap)
  drafts = await aiReframeSignals(drafts)

  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  const upserts = drafts.map((d): TablesInsert<"platform_signals"> => ({
    kind: d.kind,
    severity: d.severity,
    target_org_id: d.target_org_id,
    title: d.title,
    summary: d.summary,
    detail: d.detail ?? null,
    evidence: (d.evidence ?? {}) as unknown as Json,
    suggested_action: d.suggested_action ?? null,
    dedup_key: d.dedup_key,
    status: "open",
    generated_at: now,
    expires_at: d.expires_at ?? expiresAt,
  }))

  if (upserts.length > 0) {
    const { error } = await supabase
      .from("platform_signals")
      .upsert(upserts, { onConflict: "target_org_id,kind,dedup_key" })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Stale signals that didn't re-emit
  const emittedKeys = new Set<string>()
  for (const d of drafts) {
    emittedKeys.add(`${d.target_org_id ?? "_"}:${d.kind}:${d.dedup_key}`)
  }
  const { data: openSignals } = await supabase
    .from("platform_signals")
    .select("id, target_org_id, kind, dedup_key")
    .eq("status", "open")
  const toStale: string[] = []
  for (const s of openSignals ?? []) {
    if (!emittedKeys.has(`${s.target_org_id ?? "_"}:${s.kind}:${s.dedup_key}`)) {
      toStale.push(s.id)
    }
  }
  if (toStale.length > 0) {
    await supabase
      .from("platform_signals")
      .update({ status: "stale" })
      .in("id", toStale)
  }

  return NextResponse.json({
    ok: true,
    generated: drafts.length,
    staled: toStale.length,
  })
}
