/**
 * Audit log — append-only history of sensitive platform-operator actions.
 *
 * GET /api/platform-admin/audit-log?action=&actor=&target_type=&limit=200
 *
 * Filters are all optional. Results are sorted newest first.
 */
import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const action = url.searchParams.get("action")
  const actor = url.searchParams.get("actor")
  const targetType = url.searchParams.get("target_type")
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200), 500)

  let query = supabase
    .from("platform_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (action) query = query.eq("action", action)
  if (actor) query = query.eq("actor_user_id", actor)
  if (targetType) query = query.eq("target_type", targetType)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Counts by action (last 24h) for the filter strip
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString()
  const { data: recentRows } = await supabase
    .from("platform_audit_log")
    .select("action")
    .gte("created_at", dayAgo)

  const counts_24h: Record<string, number> = {}
  for (const r of recentRows ?? []) {
    counts_24h[r.action] = (counts_24h[r.action] ?? 0) + 1
  }

  return NextResponse.json({
    entries: data ?? [],
    counts_24h,
  })
}
