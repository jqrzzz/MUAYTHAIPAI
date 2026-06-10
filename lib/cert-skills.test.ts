import { describe, it, expect } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import { codeSkillsMap, getCertSkillsMap, getLevelSkills } from "@/lib/cert-skills"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

// cert_level_skills rows are reword-only overrides of the code-defined skills.
// The reader must (a) fall back to code when the table is empty/broken and
// (b) override ONLY levels that actually have rows — partial overrides of a
// level never happen because the editor seeds the full level before writing.

type Row = { level_id: string; position: number; skill: string }

/** Minimal stub matching the exact chain the reader uses:
 *  from("cert_level_skills").select(...).order(...) -> { data, error } */
function stubClient(result: { data: Row[] | null; error: unknown }): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        order: async () => result,
      }),
    }),
  } as unknown as SupabaseClient
}

function throwingClient(): SupabaseClient {
  return {
    from: () => {
      throw new Error("boom")
    },
  } as unknown as SupabaseClient
}

describe("codeSkillsMap", () => {
  it("mirrors the code-defined ladder", () => {
    const map = codeSkillsMap()
    for (const lvl of CERTIFICATION_LEVELS) {
      expect(map[lvl.id]).toEqual(lvl.skills)
    }
  })

  it("returns copies — mutating the map can't corrupt the ladder constant", () => {
    const map = codeSkillsMap()
    map.naga.push("EVIL INJECTED SKILL")
    expect(CERTIFICATION_LEVELS.find((l) => l.id === "naga")!.skills).not.toContain(
      "EVIL INJECTED SKILL",
    )
  })
})

describe("getCertSkillsMap", () => {
  it("falls back to code skills when the table is empty", async () => {
    const map = await getCertSkillsMap(stubClient({ data: [], error: null }))
    expect(map).toEqual(codeSkillsMap())
  })

  it("falls back when the query errors", async () => {
    const map = await getCertSkillsMap(stubClient({ data: null, error: { message: "no table" } }))
    expect(map).toEqual(codeSkillsMap())
  })

  it("falls back when the client throws", async () => {
    const map = await getCertSkillsMap(throwingClient())
    expect(map).toEqual(codeSkillsMap())
  })

  it("overrides only levels that have rows, ordered by position", async () => {
    const rows: Row[] = [
      // Deliberately shuffled — the reader must sort by position.
      { level_id: "naga", position: 1, skill: "Reworded second" },
      { level_id: "naga", position: 0, skill: "Reworded first" },
    ]
    const map = await getCertSkillsMap(stubClient({ data: rows, error: null }))
    expect(map.naga.slice(0, 2)).toEqual(["Reworded first", "Reworded second"])
    // Untouched level keeps its code skills.
    expect(map.garuda).toEqual(codeSkillsMap().garuda)
  })
})

describe("getLevelSkills", () => {
  it("returns one level's skills and [] for unknown levels", async () => {
    const client = stubClient({ data: [], error: null })
    expect(await getLevelSkills(client, "naga")).toEqual(codeSkillsMap().naga)
    expect(await getLevelSkills(client, "not-a-level")).toEqual([])
  })
})
