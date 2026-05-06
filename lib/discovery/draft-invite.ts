/**
 * AI-personalized invite letter drafting.
 *
 * Takes a discovered gym's enriched data (name, location, ai_summary,
 * ai_tags, raw_extraction) and produces a one-of-a-kind invite letter
 * that references specific things about that gym. Output sits as
 * `auto_draft_subject` + `auto_draft_body` on the `discovered_gyms`
 * row, waiting for the operator to approve + send.
 *
 * Why a custom draft per gym: a templated email blast feels obviously
 * automated. A letter that mentions the gym's actual location, the
 * specific style they teach, or a detail from their site reads as
 * personal — and converts much better. The cost is one Claude call per
 * gym; that's pennies.
 *
 * The body retains the same value-prop bullets as the static
 * sendDiscoveryInvite template (free trial, certs, network) but the
 * intro and closing are personalized so it feels like a one-to-one
 * note, not a campaign send.
 */

import { generateObject } from "ai"
import { z } from "zod"

const MODEL = "openai/gpt-4o-mini"

export interface DraftInput {
  /** Gym name (used in greeting + signoff). */
  gymName: string
  /** "City, Province" or just city or null. */
  location: string | null
  /** AI-generated 1-3 sentence summary of the gym from extraction. */
  aiSummary: string | null
  /** Tags pulled from extraction, e.g. ["traditional", "kids-classes", "english-friendly"]. */
  aiTags: string[] | null
  /**
   * The full URL the operator will paste into the letter at send-time.
   * NOT included in the draft — the invite endpoint substitutes it.
   * We use the literal placeholder `{{INVITE_URL}}` so the operator's
   * /api/platform-admin/discovery/invite call replaces it with the
   * real URL when the gym claims their token.
   */
  invitePlaceholder?: string
}

export interface DraftOutput {
  subject: string
  body: string
  /** The model used; recorded in metadata for audit. */
  model: string
}

const Schema = z.object({
  subject: z
    .string()
    .min(10)
    .max(120)
    .describe(
      "Email subject. ≤80 chars ideal. No emojis. Reference the gym name. Don't sound like spam.",
    ),
  body: z
    .string()
    .min(60)
    .max(1500)
    .describe(
      "Plain-text email body, 4-8 short paragraphs. Sawadee-style warm Thai opener. Reference at least one specific thing from the gym's summary or tags. Cover: free 30-day trial, no credit card, Naga–Garuda national certifications, traveling-student visibility. End with the placeholder {{INVITE_URL}} on its own line, then '— MUAYTHAIPAI Network' as signoff. Don't use markdown.",
    ),
})

const SYSTEM = `You write personal-feeling outreach emails to Muay Thai gym owners in Thailand from MUAYTHAIPAI, a country-wide gym network. Tone: warm, peer-to-peer, never corporate or salesy. The reader is a busy gym owner — get to the point, but lead with something specific you know about their gym.

Hard rules:
1. Lead the body with a short observation that demonstrates you know this specific gym (their location, style, vibe — pulled from the data provided). Not flattery — a fact.
2. Don't open with "Dear" or "Hello" — start with "Sawadee" or directly with the personalized observation.
3. Body must include these value bullets, paraphrased naturally (not as a literal list unless it reads better):
   - Free listing on the official certification platform
   - 30-day trial, no credit card
   - Access to the Naga–Garuda national certification system
   - Visibility to traveling students moving between gyms
4. End the body with the literal token \`{{INVITE_URL}}\` on its own line — the system substitutes the real URL at send time.
5. Sign off with "— MUAYTHAIPAI Network" on the final line.
6. Don't promise things outside that list. Don't make up traffic numbers or testimonials.
7. Plain text only. No markdown, no HTML, no emojis.
8. Subject: ≤80 chars, no exclamation marks, no all-caps, no emojis.`

function buildPrompt(input: DraftInput): string {
  const lines: string[] = []
  lines.push(`Gym name: ${input.gymName}`)
  if (input.location) lines.push(`Location: ${input.location}`)
  if (input.aiSummary) lines.push(`Summary: ${input.aiSummary}`)
  if (input.aiTags && input.aiTags.length > 0) {
    lines.push(`Tags: ${input.aiTags.join(", ")}`)
  }
  return `Generate a personal invite email to this gym to join the MUAYTHAIPAI network.\n\n${lines.join("\n")}\n\nReturn JSON matching the schema. End the body with {{INVITE_URL}} on its own line, then signoff.`
}

export async function draftInviteLetter(input: DraftInput): Promise<DraftOutput> {
  const result = await generateObject({
    model: MODEL,
    schema: Schema,
    system: SYSTEM,
    prompt: buildPrompt(input),
    temperature: 0.6,
  })

  return {
    subject: result.object.subject.trim(),
    body: result.object.body.trim(),
    model: MODEL,
  }
}
