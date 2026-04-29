import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

/**
 * Aggregated coverage for the Network tab — by province and status.
 * Cheap aggregation in JS so we don't need a SQL view.
 */
export async function GET() {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("discovered_gyms")
    .select("province, status, source")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = data?.length ?? 0
  const byStatus: Record<string, number> = {}
  const bySource: Record<string, number> = {}
  const byProvince: Record<string, { total: number; statuses: Record<string, number> }> = {}

  for (const row of data || []) {
    const p = row.province || "(unknown)"
    const s = row.status || "pending"
    const src = row.source || "unknown"
    byStatus[s] = (byStatus[s] ?? 0) + 1
    bySource[src] = (bySource[src] ?? 0) + 1
    if (!byProvince[p]) byProvince[p] = { total: 0, statuses: {} }
    byProvince[p].total += 1
    byProvince[p].statuses[s] = (byProvince[p].statuses[s] ?? 0) + 1
  }

  const provinces = Object.entries(byProvince)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({
    total,
    by_status: byStatus,
    by_source: bySource,
    provinces,
  })
}
