import { describe, it, expect } from "vitest"
import {
  CERTIFICATION_LEVELS,
  LEVEL_IDS,
  getLevelById,
  getLevelIndex,
  getPreviousLevel,
  aggregateCertActivity,
} from "@/lib/certification-levels"

// The ladder is the network's credential standard. skill_signoffs reference
// skills by integer position (skill_index), so the structural invariants here
// are load-bearing — see CLAUDE.md.

describe("the Naga→Garuda ladder structure", () => {
  it("has five levels numbered 1..5 with unique ids", () => {
    expect(CERTIFICATION_LEVELS).toHaveLength(5)
    expect(CERTIFICATION_LEVELS.map((l) => l.number)).toEqual([1, 2, 3, 4, 5])
    expect(new Set(LEVEL_IDS).size).toBe(LEVEL_IDS.length)
    expect(LEVEL_IDS).toEqual(CERTIFICATION_LEVELS.map((l) => l.id))
  })

  it("every level has a non-empty skill list and a positive price", () => {
    for (const lvl of CERTIFICATION_LEVELS) {
      expect(lvl.skills.length, lvl.id).toBeGreaterThan(0)
      expect(lvl.priceTHB, lvl.id).toBeGreaterThan(0)
      expect(lvl.minDaysAfterPrevious, lvl.id).toBeGreaterThanOrEqual(0)
    }
  })

  it("skills within a level are unique (sign-offs are keyed by position)", () => {
    for (const lvl of CERTIFICATION_LEVELS) {
      expect(new Set(lvl.skills).size, lvl.id).toBe(lvl.skills.length)
    }
  })
})

describe("level helpers", () => {
  it("getLevelById finds levels and rejects unknowns", () => {
    expect(getLevelById("naga")?.number).toBe(1)
    expect(getLevelById("garuda")?.number).toBe(5)
    expect(getLevelById("nope")).toBeUndefined()
  })

  it("getLevelIndex / getPreviousLevel walk the ladder in order", () => {
    expect(getLevelIndex("naga")).toBe(0)
    expect(getPreviousLevel("naga")).toBeUndefined()
    expect(getPreviousLevel("phayra-nak")?.id).toBe("naga")
    expect(getPreviousLevel("garuda")?.id).toBe("hanuman")
  })
})

describe("aggregateCertActivity", () => {
  it("tallies certs and enrolments by level", () => {
    const res = aggregateCertActivity(
      [{ level: "naga" }, { level: "naga" }, { level: "singha" }],
      [{ level: "naga" }],
    )
    expect(res.issuedByLevel).toEqual({ naga: 2, singha: 1 })
    expect(res.enrolledByLevel).toEqual({ naga: 1 })
    expect(res.totalCerts).toBe(3)
    expect(res.totalEnrolled).toBe(1)
  })

  it("tolerates null/undefined inputs (Supabase result shapes)", () => {
    const res = aggregateCertActivity(null, undefined)
    expect(res.totalCerts).toBe(0)
    expect(res.totalEnrolled).toBe(0)
    expect(res.issuedByLevel).toEqual({})
  })
})
