/**
 * Team & access management for the operator console (full platform admins only).
 *
 * GET  /api/platform-admin/team   → { admins, invites } (current access + pending)
 * POST /api/platform-admin/team   → { action: "revoke", userId } | { action: "cancelInvite", inviteId }
 *
 * Inviting a new partner reuses POST /api/platform-admin/invites. Uses a
 * service-role client because the `users` table has no platform-admin SELECT
 * policy (an admin can't list other admins through the request-scoped client).
 * Gated to full admins via requirePlatformAdmin({ billing: true }).
 */
import { NextResponse } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth-helpers"
import { logAudit } from "@/lib/audit-log"
import { createServiceClient } from "@/lib/supabase/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Service-role client — the `users` table has no platform-admin SELECT policy,
// so an admin can't list other admins through the request-scoped client. This
// route is gated to full admins, so service-role is safe.
function svc() {
  return createServiceClient()
}

export async function GET() {
  const auth = await requirePlatformAdmin({ billing: true })
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = svc()
  const [{ data: admins }, { data: invites }] = await Promise.all([
    db
      .from("users")
      .select("id, email, full_name, display_name, platform_admin_role, created_at")
      .eq("is_platform_admin", true)
      .order("created_at", { ascending: true }),
    db
      .from("platform_invites")
      .select("id, email, name, role, created_at, expires_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminRows = (admins ?? []).map((a: any) => ({
    id: a.id,
    email: a.email,
    name: a.display_name || a.full_name || null,
    role: (a.platform_admin_role as string) || "full",
    since: a.created_at,
  }))

  return NextResponse.json({ admins: adminRows, invites: invites ?? [] })
}

export async function POST(request: Request) {
  const auth = await requirePlatformAdmin({ billing: true })
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { user } = auth

  const body = (await request.json().catch(() => ({}))) as {
    action?: string
    userId?: string
    inviteId?: string
  }
  const db = svc()

  if (body.action === "cancelInvite" && body.inviteId) {
    const { data: invite } = await db
      .from("platform_invites")
      .select("email")
      .eq("id", body.inviteId)
      .maybeSingle()
    const { error } = await db
      .from("platform_invites")
      .update({ status: "cancelled" })
      .eq("id", body.inviteId)
      .eq("status", "pending")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await logAudit(db, {
      action: "team.invite_cancel",
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "platform_invite",
      targetId: body.inviteId,
      targetLabel: (invite as { email?: string } | null)?.email ?? null,
    })
    return NextResponse.json({ ok: true })
  }

  if (body.action === "revoke" && body.userId) {
    if (body.userId === user.id) {
      return NextResponse.json({ error: "You can't revoke your own access." }, { status: 400 })
    }

    const { data: target } = await db
      .from("users")
      .select("id, email, is_platform_admin, platform_admin_role")
      .eq("id", body.userId)
      .maybeSingle()
    const t = target as
      | { id: string; email: string; is_platform_admin: boolean; platform_admin_role: string | null }
      | null
    if (!t?.is_platform_admin) {
      return NextResponse.json({ error: "That user isn't a platform admin." }, { status: 400 })
    }

    // Never strand the network without a full admin.
    if ((t.platform_admin_role ?? "full") === "full") {
      const { count } = await db
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("is_platform_admin", true)
        .or("platform_admin_role.eq.full,platform_admin_role.is.null")
      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Can't revoke the last full admin — promote someone else first." },
          { status: 400 },
        )
      }
    }

    const { error } = await db
      .from("users")
      .update({ is_platform_admin: false, platform_admin_role: "full" })
      .eq("id", body.userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit(db, {
      action: "team.revoke",
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "user",
      targetId: t.id,
      targetLabel: t.email,
      metadata: { revoked_role: t.platform_admin_role ?? "full" },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
