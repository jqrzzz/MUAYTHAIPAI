/**
 * Student signs a gym's liability waiver.
 *
 * POST /api/student/waivers/sign  body: { org_id, signed_name }
 *
 * Captures IP + user-agent server-side (not trusted from the client).
 * The student must be signed in. We look up the gym's currently-active
 * waiver, record the signature against it, and return success.
 */

import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SignSchema = z.object({
  org_id: z.string().uuid(),
  signed_name: z.string().min(1).max(120),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Sign in to sign a waiver" }, { status: 401 })
  }

  const parsed = SignSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { org_id, signed_name } = parsed.data

  // Pull the gym's active waiver
  const { data: waiver } = await supabase
    .from("org_waivers")
    .select("id, version, title")
    .eq("org_id", org_id)
    .eq("is_active", true)
    .maybeSingle()

  if (!waiver) {
    return NextResponse.json(
      { error: "This gym hasn't published a waiver yet" },
      { status: 404 },
    )
  }

  // Capture audit metadata. x-forwarded-for handles Vercel edge proxy.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  const userAgent = request.headers.get("user-agent") || null

  const { data, error } = await supabase
    .from("student_waiver_signatures")
    .upsert(
      {
        org_id,
        user_id: user.id,
        waiver_id: waiver.id,
        signed_name: signed_name.trim(),
        ip_address: ip,
        user_agent: userAgent,
      },
      { onConflict: "org_id,user_id,waiver_id" },
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    signature: {
      id: data.id,
      waiver_version: waiver.version,
      signed_at: data.signed_at,
    },
  })
}
