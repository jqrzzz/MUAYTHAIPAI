/**
 * Claude research mode — given a region, ask Claude to suggest candidate
 * Muay Thai gyms it knows about. Output is a structured list of names +
 * locations. The discovery pipeline then runs each through Google Places
 * for verification + place_id resolution before storing them.
 *
 * This intentionally does NOT use a live web-search tool — Claude works
 * from training data and the operator (or the Google verification step)
 * filters out hallucinations. Live web search can be layered on later
 * by adding a tool to the generateText call.
 */

import { generateObject } from "ai"
import { z } from "zod"

const MODEL = "openai/gpt-4o-mini"

const ResearchSchema = z.object({
  candidates: z
    .array(
      z.object({
        name: z.string().describe("Gym name in English (or romanised Thai)"),
        name_th: z.string().optional().describe("Gym name in Thai script if known"),
        city: z.string(),
        province: z.string().optional(),
        notable_for: z
          .string()
          .optional()
          .describe("One short phrase: e.g. 'pro fighter team', 'tourist-friendly', 'female-led'"),
        confidence: z
          .enum(["high", "medium", "low"])
          .describe("How confident are you this gym actually exists?"),
      })
    )
    .describe("Up to 20 candidate gyms in the requested region"),
  notes: z
    .string()
    .optional()
    .describe("Brief operator note on the region (camp culture, hotspots, etc.)"),
})

export interface ResearchCandidate {
  name: string
  name_th?: string
  city: string
  province?: string
  notable_for?: string
  confidence: "high" | "medium" | "low"
}

export interface ResearchResult {
  candidates: ResearchCandidate[]
  notes?: string
  model: string
}

export async function researchRegion(params: {
  region: string
  hint?: string
  limit?: number
}): Promise<ResearchResult> {
  const limit = Math.min(params.limit ?? 15, 25)

  const result = await generateObject({
    model: MODEL,
    schema: ResearchSchema,
    system: `You are a Muay Thai scout helping a SaaS platform map participating gyms in Thailand. The operator names a region; you list candidate gyms you have direct knowledge of. Be conservative — don't invent gyms. Mark anything uncertain as confidence: 'low'. Each candidate will be verified against Google Places before storing.`,
    prompt: `Region: ${params.region}${params.hint ? `\nHint from operator: ${params.hint}` : ""}\n\nList up to ${limit} Muay Thai gym candidates you know in this region. Prefer well-established camps, fight teams, and gyms with online presence.`,
    temperature: 0.4,
  })

  return {
    candidates: result.object.candidates,
    notes: result.object.notes,
    model: MODEL,
  }
}
