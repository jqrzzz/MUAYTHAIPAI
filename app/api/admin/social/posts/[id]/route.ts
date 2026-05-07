/**
 * Single social post: PATCH (edit) + DELETE.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PatchSchema = z.object({
  platforms: z.array(z.enum([
    "instagram", "facebook", "tiktok", "line_oa", "threads", "twitter",
  ])).optional(),
  content: z.record(z.string(), z.any()).optional(),
  status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  scheduled_for: z.string().datetime().nullable().optional(),
  published_at: z.string().datetime().nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth
  const { id } = await params

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Auto-stamp published_at when transitioning to published
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = { ...parsed.data }
  if (parsed.data.status === "published" && !parsed.data.published_at) {
    update.published_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("social_posts")
    .update(update)
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ post: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth
  const { id } = await params

  const { error } = await supabase
    .from("social_posts")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
