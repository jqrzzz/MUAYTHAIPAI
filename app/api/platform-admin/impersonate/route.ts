/**
 * Platform-admin impersonation: POST sets a cookie that lets the super
 * admin browse /admin, /trainer, /student as if they were that role.
 * DELETE clears it. Only platform admins are allowed to call either.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { cookies } from "next/headers"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { IMPERSONATION_COOKIE } from "@/lib/impersonation"
import { logAudit } from "@/lib/audit-log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BodySchema = z.object({
  type: z.enum(["gym_admin", "trainer", "student"]),
  orgId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  label: z.string().min(1).max(160),
})

async function requirePlatformAdmin() {
  const { supabase, user, isPlatformAdmin } = await getPlatformAdmin()
  if (!user) return { ok: false as const, status: 401 }
  if (!isPlatformAdmin) return { ok: false as const, status: 403 }
  return { ok: true as const, supabase, user }
}

export async function POST(request: Request) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { type, orgId, userId, label } = parsed.data

  // Light validation: gym_admin/trainer needs orgId; trainer/student needs userId.
  if ((type === "gym_admin" || type === "trainer") && !orgId) {
    return NextResponse.json({ error: "orgId required" }, { status: 400 })
  }
  if ((type === "trainer" || type === "student") && !userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  const jar = await cookies()
  jar.set(IMPERSONATION_COOKIE, JSON.stringify({ type, orgId, userId, label }), {
    httpOnly: false, // banner reads this client-side to render the exit button
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4, // 4h — long enough for a working session, not forever
  })

  await logAudit(auth.supabase, {
    action: "impersonate.start",
    actorUserId: auth.user.id,
    actorEmail: auth.user.email,
    targetType: type === "gym_admin" ? "organization" : "user",
    targetId: orgId ?? userId ?? null,
    targetLabel: label,
    metadata: { type, orgId, userId },
    request,
  })

  // Where to land. The picker decides what makes sense per type.
  const next =
    type === "gym_admin" ? "/admin" : type === "trainer" ? "/trainer" : "/student"
  return NextResponse.json({ ok: true, next })
}

export async function DELETE(request: Request) {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  }
  const jar = await cookies()
  const prior = jar.get(IMPERSONATION_COOKIE)?.value
  jar.delete(IMPERSONATION_COOKIE)

  await logAudit(auth.supabase, {
    action: "impersonate.end",
    actorUserId: auth.user.id,
    actorEmail: auth.user.email,
    targetLabel: prior ? (() => {
      try {
        const p = JSON.parse(prior)
        return p?.label ?? null
      } catch {
        return null
      }
    })() : null,
    metadata: prior ? (() => {
      try {
        return JSON.parse(prior)
      } catch {
        return null
      }
    })() : null,
    request,
  })

  return NextResponse.json({ ok: true })
}
