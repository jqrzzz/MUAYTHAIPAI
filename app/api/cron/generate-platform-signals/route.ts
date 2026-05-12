/**
 * Daily AI-native signal generation cron.
 *
 * Scheduled to run every morning. Steps:
 *   1. Snapshot platform state (subs, bookings, support, discovery)
 *   2. Run all rule-based generators → SignalDraft[]
 *   3. Optionally rewrite high-severity drafts with AI (warmer voice)
 *   4. Upsert into platform_signals (dedup_key prevents duplicates)
 *   5. Stale any open signals that didn't re-emit (e.g. trial converted)
 *
 * Auth: Bearer CRON_SECRET (Vercel cron + manual ops invocation).
 */
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  aiReframeSignals,
  buildSnapshot,
  generateAllSignals,
} from "@/lib/platform-signals"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

function authorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  const hdr = request.headers.get("authorization")
  return hdr === `Bearer ${expected}`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 1. Snapshot
  const snap = await buildSnapshot(supabase)

  // 2. Generate
  let drafts = generateAllSignals(snap)

  // 3. Reframe high-severity drafts with AI (best-effort)
  drafts = await aiReframeSignals(drafts)

  // 4. Upsert
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  // 14 days TTL for non-re-emitted signals — long enough that a missed
  // cron run doesn't lose data, short enough that stale stuff falls off

  const upserts = drafts.map(
    (d): Record<string, unknown> => ({
      kind: d.kind,
      severity: d.severity,
      target_org_id: d.target_org_id,
      title: d.title,
      summary: d.summary,
      detail: d.detail ?? null,
      evidence: d.evidence ?? {},
      suggested_action: d.suggested_action ?? null,
      dedup_key: d.dedup_key,
      status: "open",
      generated_at: now,
      expires_at: d.expires_at ?? expiresAt,
    }),
  )

  let upsertedCount = 0
  if (upserts.length > 0) {
    const { error } = await supabase
      .from("platform_signals")
      .upsert(upserts, {
        onConflict: "target_org_id,kind,dedup_key",
      })
    if (error) {
      console.error("[signals/cron] upsert failed:", error)
      return NextResponse.json(
        { error: error.message, generated: drafts.length },
        { status: 500 },
      )
    }
    upsertedCount = upserts.length
  }

  // 5. Stale any open signals NOT in the re-emitted set. Compares by
  // (target_org_id, kind, dedup_key) — anything we didn't emit this run
  // got resolved (e.g. trial converted, ticket replied, ratio recovered).
  const dedupKeysByOrg = new Map<string, Set<string>>()
  for (const d of drafts) {
    const key = `${d.target_org_id ?? "_"}:${d.kind}:${d.dedup_key}`
    const orgKey = d.target_org_id ?? "_"
    if (!dedupKeysByOrg.has(orgKey)) dedupKeysByOrg.set(orgKey, new Set())
    dedupKeysByOrg.get(orgKey)!.add(key)
  }

  const { data: openSignals } = await supabase
    .from("platform_signals")
    .select("id, target_org_id, kind, dedup_key")
    .eq("status", "open")

  const toStale: string[] = []
  for (const s of openSignals ?? []) {
    const key = `${s.target_org_id ?? "_"}:${s.kind}:${s.dedup_key}`
    const orgKey = s.target_org_id ?? "_"
    const emittedKeys = dedupKeysByOrg.get(orgKey) ?? new Set()
    if (!emittedKeys.has(key)) {
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
    upserted: upsertedCount,
    staled: toStale.length,
    severity_breakdown: countBy(drafts, (d) => d.severity),
    kind_breakdown: countBy(drafts, (d) => d.kind),
  })
}

function countBy<T>(arr: T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const t of arr) {
    const k = key(t)
    out[k] = (out[k] ?? 0) + 1
  }
  return out
}
