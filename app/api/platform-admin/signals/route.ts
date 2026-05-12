/**
 * Platform signals — list + manual regenerate.
 *
 * GET   /api/platform-admin/signals?status=open&severity=&kind=
 *       Returns open signals sorted by severity desc (critical first),
 *       then generated_at desc.
 *
 * POST  /api/platform-admin/signals/regenerate
 *       Manually trigger the cron logic (skips the Bearer token check).
 *       Useful when testing or after dismissing a wave of signals.
 */
import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

export async function GET(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get("status") ?? "open"
  const severity = url.searchParams.get("severity")
  const kind = url.searchParams.get("kind")

  let query = supabase
    .from("platform_signals")
    .select(`
      *,
      organizations:target_org_id (id, name, slug, email)
    `)
    .order("generated_at", { ascending: false })
    .limit(200)

  if (status !== "all") query = query.eq("status", status)
  if (severity) query = query.eq("severity", severity)
  if (kind) query = query.eq("kind", kind)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Re-sort by severity desc then generated_at desc
  const signals = (data ?? []).slice().sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 9
    const sb = SEVERITY_ORDER[b.severity] ?? 9
    if (sa !== sb) return sa - sb
    return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  })

  // Counts by severity for the strip
  const counts = { critical: 0, warning: 0, info: 0 }
  for (const s of signals) {
    if (s.status !== "open") continue
    if (s.severity in counts) counts[s.severity as keyof typeof counts]++
  }

  return NextResponse.json({ signals, counts })
}
