/**
 * Social posts CRUD.
 *
 * GET  /api/admin/social/posts?status=draft&limit=50
 * POST /api/admin/social/posts  body: { platforms, content, status?, scheduled_for?, source?, source_intent? }
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const url = new URL(request.url)
  const status = url.searchParams.get("status")
  const limit = Math.min(
    Number(url.searchParams.get("limit") ?? 100),
    200,
  )

  let query = supabase
    .from("social_posts")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ posts: data ?? [] })
}

const PlatformEnum = z.enum([
  "instagram",
  "facebook",
  "tiktok",
  "line_oa",
  "threads",
  "twitter",
])

const PostBodySchema = z.object({
  platforms: z.array(PlatformEnum).min(1),
  content: z.record(z.string(), z.any()),
  status: z.enum(["draft", "scheduled", "published", "archived"]).default("draft"),
  scheduled_for: z.string().datetime().nullable().optional(),
  source: z.enum(["manual", "ai_compose", "ai_batch"]).default("manual"),
  source_intent: z.string().max(2000).nullable().optional(),
})

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId, user } = auth

  const parsed = PostBodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      org_id: orgId,
      platforms: parsed.data.platforms,
      content: parsed.data.content,
      status: parsed.data.status,
      scheduled_for: parsed.data.scheduled_for ?? null,
      source: parsed.data.source,
      source_intent: parsed.data.source_intent ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ post: data })
}
