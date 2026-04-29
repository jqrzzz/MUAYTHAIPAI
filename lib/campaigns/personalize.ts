/**
 * Campaign personalization — given a template and one target gym,
 * produce a polished subject + body via the AI SDK gateway.
 *
 * The template can use placeholders like {{gym_name}}, {{city}},
 * {{province}}, {{ai_summary}}. They're substituted naively first;
 * if `personalize` is true, Claude rewrites for natural flow and
 * region/persona fit.
 */

import { generateObject } from "ai"
import { z } from "zod"

const MODEL = "openai/gpt-4o-mini"

interface PersonalizeInput {
  gym: {
    name: string
    name_th?: string | null
    city?: string | null
    province?: string | null
    country?: string | null
    website?: string | null
    ai_summary?: string | null
    ai_tags?: string[] | null
  }
  channel: "email" | "line" | "whatsapp" | "test"
  subject_template: string | null
  body_template: string
  personalize_prompt: string | null
  personalize: boolean
  /** If provided, replaces {{invite_url}} in the body. */
  inviteUrl?: string | null
}

export interface PersonalizedDraft {
  subject: string | null
  body: string
}

const FillSchema = z.object({
  subject: z.string().optional(),
  body: z.string(),
})

function fillPlaceholders(
  text: string,
  gym: PersonalizeInput["gym"],
  inviteUrl?: string | null
): string {
  return text
    .replace(/\{\{\s*gym_name\s*\}\}/gi, gym.name || "")
    .replace(/\{\{\s*name_th\s*\}\}/gi, gym.name_th || gym.name || "")
    .replace(/\{\{\s*city\s*\}\}/gi, gym.city || "")
    .replace(/\{\{\s*province\s*\}\}/gi, gym.province || "")
    .replace(/\{\{\s*country\s*\}\}/gi, gym.country || "Thailand")
    .replace(/\{\{\s*ai_summary\s*\}\}/gi, gym.ai_summary || "")
    .replace(/\{\{\s*ai_tags\s*\}\}/gi, (gym.ai_tags || []).join(", "))
    .replace(/\{\{\s*website\s*\}\}/gi, gym.website || "")
    .replace(/\{\{\s*invite_url\s*\}\}/gi, inviteUrl || "")
}

export async function personalizeDraft(
  input: PersonalizeInput
): Promise<PersonalizedDraft> {
  const subjectFilled = input.subject_template
    ? fillPlaceholders(input.subject_template, input.gym, input.inviteUrl)
    : null
  const bodyFilled = fillPlaceholders(
    input.body_template,
    input.gym,
    input.inviteUrl
  )

  if (!input.personalize) {
    return { subject: subjectFilled, body: bodyFilled }
  }

  const channelHint =
    input.channel === "email"
      ? "This is an email — keep markdown formatting."
      : input.channel === "line"
        ? "This is a LINE message — keep it short and casual, no HTML."
        : input.channel === "whatsapp"
          ? "This is a WhatsApp message — short, casual, no HTML."
          : "This is a test message."

  const system = `You polish outreach messages to Muay Thai gym owners in Thailand for the MUAYTHAIPAI network platform. The operator gives you a template that's been placeholder-filled. Rewrite it so the message reads naturally for THIS specific gym, weaving in their specifics (city, summary, tags) where they fit. Keep the operator's intent, voice, and call-to-action. Do not invent facts about the gym — only use what's provided. Keep it short and warm.

CRITICAL: preserve any URLs verbatim. Do not rewrite, paraphrase, shorten, or remove URLs in the body. The call-to-action link must remain exactly as written. ${channelHint}`

  const userPrompt = `${input.personalize_prompt ? `Operator note: ${input.personalize_prompt}\n\n` : ""}Target gym facts:
- Name: ${input.gym.name}${input.gym.name_th ? ` (${input.gym.name_th})` : ""}
- Location: ${[input.gym.city, input.gym.province].filter(Boolean).join(", ") || "Thailand"}
${input.gym.ai_summary ? `- About: ${input.gym.ai_summary}\n` : ""}${input.gym.ai_tags && input.gym.ai_tags.length > 0 ? `- Tags: ${input.gym.ai_tags.join(", ")}\n` : ""}${input.gym.website ? `- Website: ${input.gym.website}\n` : ""}
${subjectFilled ? `Original subject:\n${subjectFilled}\n\n` : ""}Original body:
${bodyFilled}

Output the polished version.`

  try {
    const result = await generateObject({
      model: MODEL,
      schema: FillSchema,
      system,
      prompt: userPrompt,
      temperature: 0.4,
    })
    let body = result.object.body.trim()
    // Safety net: if the AI dropped the invite link, append it.
    if (input.inviteUrl && !body.includes(input.inviteUrl)) {
      body = `${body}\n\n${input.inviteUrl}`
    }
    return {
      subject: subjectFilled
        ? result.object.subject?.trim() || subjectFilled
        : null,
      body,
    }
  } catch (err) {
    // Fall back to placeholder-filled version on AI failure
    console.warn("[campaigns/personalize] AI failed, using placeholder fill:", err)
    return { subject: subjectFilled, body: bodyFilled }
  }
}
