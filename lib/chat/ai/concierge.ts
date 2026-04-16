/**
 * Concierge AI — the public-facing persona for inbound chat.
 *
 * Persona:
 *   - Greets new visitors with "Sawadee! Welcome to <gym>"
 *   - Detects the visitor's language and mirrors it (Thai-first fallback,
 *     but switches to English / Mandarin / Japanese / etc. on signal)
 *   - Warm, concise, never pushy. Safety: escalates anything it isn't
 *     95% sure of rather than inventing answers.
 *
 * Tools (all read-only — write actions live behind the action-token
 * deeplink flow coming in Wave 8d):
 *   - get_services            — active services + prices
 *   - get_schedule            — weekly time slots
 *   - search_faqs             — free-text over gym FAQs
 *   - escalate_to_owner       — mark conversation awaiting_human
 *
 * If the AI SDK gateway isn't configured yet (missing AI_GATEWAY_API_KEY
 * and/or provider key), generateText throws and we fall through to a
 * canned holding reply so the visitor still gets an acknowledgement
 * and the owner sees the message in the inbox. This is intentional:
 * Phase 8b ships AI-ready even if keys land later.
 */

import { generateText, stepCountIs, tool } from "ai"
import { z } from "zod"
import type { GymKnowledge } from "../knowledge"
import { renderKnowledgeBlock } from "../knowledge"

export type ConciergeHistoryEntry = {
  direction: "inbound" | "outbound"
  body: string
}

export type ConciergeInput = {
  kb: GymKnowledge
  userMessage: string
  history: ConciergeHistoryEntry[]
  isBoundUser: boolean
  isFirstMessage: boolean
}

export type ConciergeOutput = {
  replyText?: string
  escalated?: boolean
  needsReview?: boolean
  meta?: Record<string, unknown>
}

const MODEL = "openai/gpt-4o-mini"
const MAX_TOOL_STEPS = 5
const MAX_OUTPUT_TOKENS = 600

export async function runConciergeAI(
  input: ConciergeInput,
): Promise<ConciergeOutput> {
  const kbBlock = renderKnowledgeBlock(input.kb)
  const systemPrompt = buildConciergeSystemPrompt(kbBlock, input)

  // One-shot escalation flag closed over by the tool — saves us having
  // to parse tool-call logs after the fact.
  let escalated = false
  let escalationReason = ""

  const tools = {
    get_services: tool({
      description:
        "Get the list of active services, prices, and durations for this gym. Use when the visitor asks about options, rates, programs, or what's available.",
      inputSchema: z.object({
        category: z
          .enum(["training", "certificate", "membership", "accommodation"])
          .optional()
          .describe("Filter to one category. Omit for all."),
      }),
      execute: async ({ category }) => {
        const services = category
          ? input.kb.services.filter((s) => s.category === category)
          : input.kb.services
        return {
          count: services.length,
          services: services.map((s) => ({
            name: s.name,
            category: s.category,
            description: s.description,
            price_thb: s.price_thb,
            price_usd: s.price_usd,
            duration_minutes: s.duration_minutes,
            duration_days: s.duration_days,
          })),
        }
      },
    }),

    get_schedule: tool({
      description:
        "Get the weekly training schedule (day-of-week + times). Use when the visitor asks when classes run, what times, or which days.",
      inputSchema: z.object({
        day_of_week: z
          .number()
          .min(0)
          .max(6)
          .optional()
          .describe("0=Sun, 6=Sat. Omit for the full week."),
      }),
      execute: async ({ day_of_week }) => {
        const slots =
          day_of_week !== undefined
            ? input.kb.schedule.filter((s) => s.day_of_week === day_of_week)
            : input.kb.schedule
        return { count: slots.length, schedule: slots }
      },
    }),

    search_faqs: tool({
      description:
        "Search the gym's FAQs by free-text query. Use before answering any policy / logistics question (what to bring, beginner-friendly, private rooms, etc.) to ground the answer in vetted content. Returns the top matches.",
      inputSchema: z.object({
        query: z.string().describe("A short phrase to match against FAQs."),
        limit: z.number().min(1).max(10).default(5),
      }),
      execute: async ({ query, limit }) => {
        const q = query.toLowerCase()
        const scored = input.kb.faqs
          .map((f) => {
            const hay = `${f.category} ${f.question} ${f.answer}`.toLowerCase()
            // Cheap keyword score — 1 point per matching token.
            const tokens = q.split(/\s+/).filter((t) => t.length > 2)
            const score = tokens.reduce(
              (acc, t) => (hay.includes(t) ? acc + 1 : acc),
              0,
            )
            return { faq: f, score }
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
        return {
          count: scored.length,
          results: scored.map((x) => x.faq),
        }
      },
    }),

    escalate_to_owner: tool({
      description:
        "Hand the conversation to a human staff member. Use when: (1) the visitor is unhappy, (2) they ask about something not in the KB, (3) they want to book / pay / change an existing booking, (4) anything sensitive (medical, refunds, injuries), (5) you're less than 95% sure.",
      inputSchema: z.object({
        reason: z
          .string()
          .describe("One short sentence for the owner's inbox."),
      }),
      execute: async ({ reason }) => {
        escalated = true
        escalationReason = reason
        return {
          ok: true,
          note: "Conversation marked awaiting_human. Craft a short acknowledgement to the visitor in their language before closing your reply.",
        }
      },
    }),
  }

  const messages = buildConversationMessages(input)

  try {
    const result = await generateText({
      model: MODEL,
      system: systemPrompt,
      messages,
      tools,
      stopWhen: stepCountIs(MAX_TOOL_STEPS),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.5,
    })

    const replyText = result.text?.trim()
    return {
      replyText: replyText || undefined,
      escalated,
      needsReview: escalated,
      meta: {
        model: MODEL,
        steps: result.steps?.length ?? 0,
        escalation_reason: escalated ? escalationReason : undefined,
        usage: result.usage,
      },
    }
  } catch (err) {
    console.error("[chat/concierge] AI call failed:", err)
    // Fail safe: escalate + return a holding reply in the visitor's
    // most likely language (Thai first, then English, since we're
    // Thailand-primary).
    return {
      replyText: buildHoldingReply(input),
      escalated: true,
      needsReview: true,
      meta: {
        model: MODEL,
        error: err instanceof Error ? err.message : String(err),
        fallback: "holding_reply",
      },
    }
  }
}

function buildConciergeSystemPrompt(
  kbBlock: string,
  input: ConciergeInput,
): string {
  const greetingHint = input.isFirstMessage
    ? `This is the visitor's first message in this conversation. Open with: "Sawadee! Welcome to ${input.kb.orgName}" (or the equivalent in their language) before answering.`
    : "Continue the conversation naturally — do not repeat the Sawadee greeting."

  const boundHint = input.isBoundUser
    ? "This visitor is a known student of the gym (already in our system). You may be a little more familiar."
    : "This visitor is new or anonymous. Keep it welcoming and informative."

  return `You are the concierge for ${input.kb.orgName}. You answer inbound messages from prospective and returning students across all channels (LINE, WhatsApp, Instagram, Facebook, Telegram, web).

# Persona
- Warm, concise, Thai-hospitality vibe.
- Default to Thai for the first line when the visitor's language is unclear, then mirror whatever language they reply in (Thai, English, Mandarin, Japanese, German, etc.).
- Never pushy. Never make up facts. If something isn't in the knowledge base, use search_faqs; if still unclear, call escalate_to_owner.
- Replies must be suitable for a chat bubble: short paragraphs, no Markdown tables, plain text.
- Do not promise specific availability, discounts, or dates unless the tools confirm them.
- Never reveal that you're an AI unless directly asked. If asked, be honest: "I'm the gym's AI assistant — a real person will jump in for anything I can't answer."

# Tools
Use tools liberally. Prefer calling get_services / get_schedule / search_faqs over answering from memory, even if you think you know. If the question is about booking, payment, refunds, injuries, or anything sensitive, call escalate_to_owner.

# Session context
- ${greetingHint}
- ${boundHint}

# Gym knowledge base (source of truth — if it's not here or in a tool result, you don't know it)
${kbBlock}`
}

function buildConversationMessages(
  input: ConciergeInput,
): Array<{ role: "user" | "assistant"; content: string }> {
  // Cap history to last 20 turns so we stay well inside the model's
  // useful attention window. history is [oldest → newest].
  const recent = input.history.slice(-20)
  const messages: Array<{ role: "user" | "assistant"; content: string }> = []
  for (const entry of recent) {
    if (!entry.body) continue
    messages.push({
      role: entry.direction === "inbound" ? "user" : "assistant",
      content: entry.body,
    })
  }
  // Ensure the latest turn is the current user message. Engine passes
  // history that already includes it — guard against drift.
  const last = messages[messages.length - 1]
  if (!last || last.role !== "user" || last.content !== input.userMessage) {
    messages.push({ role: "user", content: input.userMessage })
  }
  return messages
}

function buildHoldingReply(input: ConciergeInput): string {
  // If the visitor's message contains Thai characters we mirror in Thai;
  // otherwise English. Simple heuristic — real detection happens in the
  // AI layer once it's wired.
  const hasThai = /[\u0E00-\u0E7F]/.test(input.userMessage)
  if (hasThai) {
    return `สวัสดีค่ะ! ขอบคุณที่ติดต่อ ${input.kb.orgName} 🙏\nทีมงานจะตอบกลับเร็วๆ นี้ค่ะ`
  }
  return `Sawadee! Thanks for reaching out to ${input.kb.orgName} 🙏 Our team will get back to you shortly.`
}
