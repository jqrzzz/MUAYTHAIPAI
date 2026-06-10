/**
 * POST /api/platform-admin/invites/accept
 *
 * Accept a platform-admin invite. Caller must be signed in with the same
 * email the invite was sent to. Uses a service-role client to UPSERT the
 * users row (RLS otherwise prevents self-promotion to platform admin).
 *
 * Body:   { token }
 * Return: { ok: true, redirect: "/platform-admin" }
 */
import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const userClient = await createClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { token?: unknown }
  const token = typeof body.token === "string" ? body.token : ""
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

  let service: ReturnType<typeof createServiceClient>
  try {
    service = createServiceClient()
  } catch {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 })
  }

  const { data: invite } = await service
    .from("platform_invites")
    .select("id, email, name, role, status, expires_at")
    .eq("token", token)
    .maybeSingle()
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 })
  if (invite.status !== "pending") {
    return NextResponse.json({ error: "This invite has already been used or cancelled." }, { status: 400 })
  }
  if (new Date(invite.expires_at) < new Date()) {
    await service.from("platform_invites").update({ status: "expired" }).eq("id", invite.id)
    return NextResponse.json({ error: "This invite has expired." }, { status: 400 })
  }
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: `This invite was sent to ${invite.email}. Sign in with that email to accept.`,
      },
      { status: 403 },
    )
  }

  // Promote the user. UPDATE first; if no row, INSERT (preserves any existing
  // full_name etc. rather than blindly upserting).
  const { data: existing } = await service.from("users").select("id").eq("id", user.id).maybeSingle()
  if (existing) {
    const { error: updErr } = await service
      .from("users")
      .update({ is_platform_admin: true, platform_admin_role: invite.role })
      .eq("id", user.id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
  } else {
    const { error: insErr } = await service.from("users").insert({
      id: user.id,
      email: user.email,
      full_name: invite.name ?? null,
      is_platform_admin: true,
      platform_admin_role: invite.role,
    })
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  await service
    .from("platform_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id)

  return NextResponse.json({ ok: true, redirect: "/platform-admin" })
}
