import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"

const COLUMNS = [
  "id",
  "name",
  "name_th",
  "city",
  "province",
  "country",
  "lat",
  "lng",
  "phone",
  "email",
  "website",
  "instagram",
  "facebook",
  "line_id",
  "google_place_id",
  "google_rating",
  "google_review_count",
  "ai_summary",
  "ai_tags",
  "source",
  "status",
  "linked_org_id",
  "invited_at",
  "claimed_at",
  "last_crawled_at",
  "last_extracted_at",
  "created_at",
] as const

type Row = Record<string, unknown>

function escape(v: unknown): string {
  if (v == null) return ""
  let s: string
  if (Array.isArray(v)) s = v.join(";")
  else if (typeof v === "object") s = JSON.stringify(v)
  else s = String(v)
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const source = searchParams.get("source")
  const province = searchParams.get("province")

  let query = supabase
    .from("discovered_gyms")
    .select(COLUMNS.join(","))
    .order("created_at", { ascending: false })
    .limit(5000)

  if (status) query = query.eq("status", status)
  if (source) query = query.eq("source", source)
  if (province) query = query.ilike("province", `%${province}%`)

  const { data, error } = await query
  if (error) {
    return new NextResponse(`Error: ${error.message}`, { status: 500 })
  }

  const rows = (data || []) as unknown as Row[]
  const lines = [
    COLUMNS.join(","),
    ...rows.map((r) => COLUMNS.map((c) => escape(r[c])).join(",")),
  ]
  const csv = lines.join("\n")

  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="discovered-gyms-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
