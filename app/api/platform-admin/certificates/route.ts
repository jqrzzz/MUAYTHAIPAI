/**
 * Network certificate registry for the operator console.
 *
 * GET   /api/platform-admin/certificates  → every cert across all gyms (+ student, gym, issuer)
 * PATCH /api/platform-admin/certificates  → { certificate_id, status: "active" | "revoked" }
 *
 * Oversight surface: the operator owns the Naga→Garuda standard and can see
 * the whole registry + revoke/reinstate any cert. Issuing stays gym-side (a
 * trainer signs off the required skills). Uses a service-role client because
 * `certificates` is staff/org-scoped under RLS — a platform operator isn't a
 * member of every gym. Gated to platform admins; revoke/reinstate is audit-logged.
 */
import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { logAudit } from "@/lib/audit-log"
import { createServiceClient } from "@/lib/supabase/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function svc() {
  return createServiceClient()
}

export async function GET() {
  const { isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const db = svc()
  const { data, error } = await db
    .from("certificates")
    .select(`
      id, level, level_number, certificate_number, status, issued_at, org_id, user_id,
      users:user_id (full_name, email),
      organizations:org_id (name),
      issued_by_trainer:issued_by (display_name)
    `)
    .order("issued_at", { ascending: false })
    .limit(5000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const certificates = (data ?? []).map((c: any) => {
    const u = Array.isArray(c.users) ? c.users[0] : c.users
    const org = Array.isArray(c.organizations) ? c.organizations[0] : c.organizations
    const tr = Array.isArray(c.issued_by_trainer) ? c.issued_by_trainer[0] : c.issued_by_trainer
    return {
      id: c.id,
      level: c.level,
      level_number: c.level_number,
      certificate_number: c.certificate_number,
      status: c.status,
      issued_at: c.issued_at,
      student_name: u?.full_name ?? null,
      student_email: u?.email ?? null,
      gym_name: org?.name ?? "—",
      issued_by: tr?.display_name ?? null,
    }
  })

  const active = certificates.filter((c) => c.status === "active").length
  return NextResponse.json({
    certificates,
    total: certificates.length,
    active,
    revoked: certificates.length - active,
  })
}

export async function PATCH(request: Request) {
  const { user, isPlatformAdmin } = await getPlatformAdmin()
  if (!user || !isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    certificate_id?: string
    status?: string
  }
  if (!body.certificate_id || !body.status || !["active", "revoked"].includes(body.status)) {
    return NextResponse.json(
      { error: "certificate_id and status (active|revoked) are required" },
      { status: 400 },
    )
  }

  const db = svc()
  const { data: before } = await db
    .from("certificates")
    .select("status, certificate_number, org_id")
    .eq("id", body.certificate_id)
    .maybeSingle()
  if (!before) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
  }

  const { error } = await db
    .from("certificates")
    .update({ status: body.status })
    .eq("id", body.certificate_id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const prev = before as { status?: string; certificate_number?: string; org_id?: string }
  await logAudit(db, {
    action: body.status === "revoked" ? "cert.revoke" : "cert.reinstate",
    actorUserId: user.id,
    actorEmail: user.email,
    targetType: "certificate",
    targetId: body.certificate_id,
    targetLabel: prev.certificate_number ?? null,
    metadata: { previous_status: prev.status ?? null, new_status: body.status, org_id: prev.org_id ?? null },
  })

  return NextResponse.json({ ok: true })
}
