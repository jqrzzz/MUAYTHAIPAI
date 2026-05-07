/**
 * Liability waiver — GET (load current) + POST (publish a new version).
 *
 * Publishing a new version sets is_active=FALSE on the previous version
 * and creates a new row with version=N+1, is_active=TRUE. This way the
 * gym keeps a history of every waiver text that was ever in effect.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { requireGymAdmin } from "@/lib/auth-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PublishSchema = z.object({
  title: z.string().min(1).max(150),
  body: z.string().min(50).max(20000),
})

export async function GET() {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  // Active waiver, if any. Plus the count of signatures so the operator
  // can see "47 students have signed v3."
  const { data: active } = await supabase
    .from("org_waivers")
    .select("id, version, title, body, created_at, updated_at")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .maybeSingle()

  let signatures = 0
  if (active) {
    const { count } = await supabase
      .from("student_waiver_signatures")
      .select("id", { count: "exact", head: true })
      .eq("waiver_id", active.id)
    signatures = count ?? 0
  }

  // History — older versions for audit
  const { data: history } = await supabase
    .from("org_waivers")
    .select("id, version, title, created_at, is_active")
    .eq("org_id", orgId)
    .order("version", { ascending: false })
    .limit(20)

  return NextResponse.json({
    active,
    signatures,
    history: history ?? [],
  })
}

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const parsed = PublishSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // Find the next version number and deactivate any currently-active one.
  const { data: latest } = await supabase
    .from("org_waivers")
    .select("version")
    .eq("org_id", orgId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextVersion = (latest?.version ?? 0) + 1

  await supabase
    .from("org_waivers")
    .update({ is_active: false })
    .eq("org_id", orgId)
    .eq("is_active", true)

  const { data, error } = await supabase
    .from("org_waivers")
    .insert({
      org_id: orgId,
      version: nextVersion,
      title: parsed.data.title.trim(),
      body: parsed.data.body,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ waiver: data })
}
