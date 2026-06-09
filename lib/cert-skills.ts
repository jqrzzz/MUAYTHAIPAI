import type { SupabaseClient } from "@supabase/supabase-js"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

export type CertSkillsMap = Record<string, string[]>

/** The hardcoded baseline — used to seed the table and as a fallback. */
export function codeSkillsMap(): CertSkillsMap {
  const map: CertSkillsMap = {}
  for (const lvl of CERTIFICATION_LEVELS) map[lvl.id] = [...lvl.skills]
  return map
}

/**
 * Skills per level, DB-backed with a code fallback.
 *
 * Levels that have rows in `cert_level_skills` use those (ordered by position);
 * any level with no rows falls back to the hardcoded defaults. v1 is
 * reword-only, so DB rows align 1:1 with the code positions — and therefore
 * with `skill_signoffs.skill_index`. Counts and ordering never change here, so
 * issuance enforcement and historical sign-offs are unaffected.
 *
 * Safe before the migration runs (table absent / empty → pure code fallback).
 */
export async function getCertSkillsMap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: SupabaseClient<any, any, any>,
): Promise<CertSkillsMap> {
  const map = codeSkillsMap()
  try {
    const { data, error } = await client
      .from("cert_level_skills")
      .select("level_id, position, skill")
      .order("position", { ascending: true })
    if (error || !data || data.length === 0) return map

    const byLevel: Record<string, { position: number; skill: string }[]> = {}
    for (const r of data as { level_id: string; position: number; skill: string }[]) {
      ;(byLevel[r.level_id] ??= []).push({ position: r.position, skill: r.skill })
    }
    // Only override levels that actually have rows; leave the rest on defaults.
    for (const [levelId, rows] of Object.entries(byLevel)) {
      map[levelId] = rows.sort((a, b) => a.position - b.position).map((r) => r.skill)
    }
    return map
  } catch {
    return map
  }
}

/** Convenience: skills for one level (DB-backed, code fallback). */
export async function getLevelSkills(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: SupabaseClient<any, any, any>,
  levelId: string,
): Promise<string[]> {
  const map = await getCertSkillsMap(client)
  return map[levelId] ?? []
}
