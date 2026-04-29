/**
 * Claude extraction — turn raw scraped markdown into a structured
 * GymExtraction. Uses the AI SDK gateway (same as the command bar).
 */

import { generateObject } from "ai"
import { z } from "zod"
import type { GymExtraction } from "./types"

const MODEL = "openai/gpt-4o-mini"

const ExtractionSchema = z.object({
  about: z.string().optional(),
  schedule: z
    .array(z.object({ day: z.string(), time: z.string(), type: z.string() }))
    .optional(),
  prices: z
    .array(z.object({ label: z.string(), price: z.string(), period: z.string().optional() }))
    .optional(),
  trainers: z
    .array(z.object({ name: z.string(), role: z.string().optional(), bio: z.string().optional() }))
    .optional(),
  services: z.array(z.string()).optional(),
  has_accommodation: z.boolean().optional(),
  accommodation_details: z.string().optional(),
  cert_levels_offered: z.array(z.string()).optional(),
  language_support: z.array(z.string()).optional(),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().optional(),
      line_id: z.string().optional(),
      whatsapp: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
    })
    .optional(),
  classification: z
    .object({
      audience: z.enum(["tourist", "serious", "mixed", "unknown"]),
      skill_focus: z.array(z.enum(["beginner", "intermediate", "advanced", "fighter"])),
      notes: z.string().optional(),
    })
    .optional(),
  ai_summary: z.string().describe("2-3 sentence summary of the gym"),
  ai_tags: z.array(z.string()).describe("Short lowercase tags like 'has-accommodation', 'fighter-focused', 'tourist-friendly'"),
})

const SYSTEM_PROMPT = `You extract structured data about Muay Thai gyms from scraped website content. You will be given the raw markdown of a gym's website.

Rules:
- Only fill fields you can ground in the source text. Omit anything you'd have to guess.
- Prices: keep the original currency string (e.g. "฿500", "$15 USD"). Don't convert.
- Schedule: use whatever day labels the source uses (Mon, Monday, จ., etc.).
- Classification.audience: 'tourist' if the site emphasises drop-in classes, packages, English first; 'serious' if it emphasises fight team, professional fighters, long-term programs; 'mixed' if both; 'unknown' if unclear.
- ai_summary: 2-3 sentences max. What kind of gym is this in plain English?
- ai_tags: short lowercase, hyphenated. Examples: 'has-accommodation', 'fighter-focused', 'tourist-friendly', 'female-trainers', 'pro-coaching', 'family-run', 'beachside', 'urban'.`

export interface ExtractionResult {
  extraction: GymExtraction
  ai_summary: string
  ai_tags: string[]
  model: string
}

export async function extractFromMarkdown(params: {
  markdown: string
  gymName: string
}): Promise<ExtractionResult> {
  const truncated = params.markdown.length > 30000
    ? params.markdown.slice(0, 30000) + "\n\n[…truncated…]"
    : params.markdown

  const result = await generateObject({
    model: MODEL,
    schema: ExtractionSchema,
    system: SYSTEM_PROMPT,
    prompt: `Gym name: ${params.gymName}\n\nScraped website markdown:\n\n${truncated}`,
    temperature: 0.2,
  })

  const { ai_summary, ai_tags, ...extraction } = result.object
  return {
    extraction: extraction as GymExtraction,
    ai_summary,
    ai_tags,
    model: MODEL,
  }
}
