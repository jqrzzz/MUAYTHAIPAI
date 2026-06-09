/**
 * Editable certification skills (reword v1) — operator surface.
 *
 * GET   → every level's skills (DB-backed, code fallback) + the code default
 *         for each position, so the UI can flag which were reworded.
 * PATCH → { level_id, position, skill }  reword one skill in place.
 *
 * Reword only: `position` must be an existing skill index, so counts, ordering,
 * and every `skill_signoffs.skill_index` stay valid. Before writing, the level's
 * defaults are materialized (idempotent) so the per-level DB rows never become a
 * partial list. Service-role (the table is public-read, operator-write); gated to
 * platform admins; audit-logged.
 */
import { NextResponse } from "next/server"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { logAudit } from "@/lib/audit-log"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { CERTIFICATION_LEVELS, getLevelById } from "@/lib/certification-levels"
import { getCertSkillsMap } from "@/lib/cert-skills"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const MAX_SKILL_LEN = 300

export async function GET() {
  const { isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const db = svc()
  const map = await getCertSkillsMap(db)

  const levels = CERTIFICATION_LEVELS.map((l) => ({
    id: l.id,
    name: l.name,
    icon: l.icon,
    number: l.number,
    skills: (map[l.id] ?? l.skills).map((text, position) => {
      const def = l.skills[position] ?? ""
      return { position, text, default: def, edited: text !== def }
    }),
  }))

  return NextResponse.json({ levels })
}

export async function PATCH(request: Request) {
  const { user, isPlatformAdmin } = await getPlatformAdmin()
  if (!user || !isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    level_id?: string
    position?: number
    skill?: string
  }
  const level = body.level_id ? getLevelById(body.level_id) : undefined
  const skill = (body.skill ?? "").trim()
  const position = body.position

  if (!level) {
    return NextResponse.json({ error: "Unknown level" }, { status: 400 })
  }
  if (typeof position !== "number" || !Number.isInteger(position) || position < 0 || position >= level.skills.length) {
    return NextResponse.json(
      { error: "position must be an existing skill index (reword only)" },
      { status: 400 },
    )
  }
  if (!skill || skill.length > MAX_SKILL_LEN) {
    return NextResponse.json(
      { error: `skill is required and must be ≤ ${MAX_SKILL_LEN} characters` },
      { status: 400 },
    )
  }

  const db = svc()

  // Materialize this level's defaults if missing, so per-level rows are never
  // a partial list (the reader treats "any rows" as the full set for a level).
  const seedRows = level.skills.map((text, i) => ({ level_id: level.id, position: i, skill: text }))
  await db.from("cert_level_skills").upsert(seedRows, {
    onConflict: "level_id,position",
    ignoreDuplicates: true,
  })

  const { error } = await db
    .from("cert_level_skills")
    .update({ skill, updated_at: new Date().toISOString() })
    .eq("level_id", level.id)
    .eq("position", position)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const previous = level.skills[position]
  await logAudit(db, {
    action: "cert.skill.reword",
    actorUserId: user.id,
    actorEmail: user.email,
    targetType: "cert_skill",
    targetId: `${level.id}:${position}`,
    targetLabel: `${level.name} · skill ${position + 1}`,
    metadata: { level_id: level.id, position, previous, next: skill },
  })

  return NextResponse.json({ ok: true })
}
