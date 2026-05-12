/**
 * POST /api/landing/chat
 *
 * The "OckOck guide" for ockock.app — a stateless, product-aware chat for
 * prospective gym owners on the marketing site. No auth and no persistence:
 * this isn't a gym's inbox, it's a sales conversation. Bilingual; grounded
 * strictly in lib/ockock/product so OckOck can't invent pricing or features.
 *
 * Body:   { messages: { role: "user" | "assistant"; content: string }[] }
 * Return: { reply: string }   (also { error } on rate-limit / bad input)
 *
 * If the AI gateway isn't configured, generateText throws and we return a
 * canned summary so the visitor still gets something useful.
 */
import { generateText } from "ai"
import { NextResponse } from "next/server"
import { checkLimit, ipFromRequest } from "@/lib/rate-limit"
import { OCKOCK, PLAN, ockockKnowledgeBlock } from "@/lib/ockock/product"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MODEL = "openai/gpt-4o-mini"
const MAX_TURNS = 20
const MAX_MESSAGE_LENGTH = 2000
const MAX_OUTPUT_TOKENS = 500
const RATE_PER_HOUR = 30

type Turn = { role: "user" | "assistant"; content: string }

const SYSTEM = `You are OckOck (Thai: ${OCKOCK.thaiName}) — a friendly water-buffalo AI who helps people run Muay Thai gyms in Thailand. You're talking to a visitor on ockock.app, the OckOck product website. Most visitors are gym owners (or thinking about starting a gym); some are travelers who want to train; some are just curious.

# Your job
- Warmly explain what OckOck does for a Muay Thai gym, answer questions about features and pricing, and — when they're interested — nudge them to start the free trial. The "Start free ${PLAN.trialDays}-day trial" button is right there on the page; you can also mention /signup.
- If the visitor wants to *train* in Thailand (not run a gym): be friendly, and point them to the gym directory on the ${OCKOCK.network} network — OckOck is the software gyms use, and travelers chat with each gym's own OckOck on that gym's page.
- Demonstrate, don't just describe: if they write in Thai, reply in Thai; if English, English. You handle both natively. Keep replies short — chat-bubble length, plain text, no Markdown tables or headings.

# Rules
- Only talk about OckOck and running a Muay Thai gym. For anything unrelated, say you're just the OckOck guide and steer back.
- Never invent pricing, features, dates, or promises. If it's not in the facts below — or you're not sure — say so plainly ("I'm not 100% sure — best to email ${OCKOCK.contactEmail}, or just start the free trial and see for yourself").
- Don't be pushy: at most one gentle nudge toward the trial per reply.
- If asked, be honest that you're OckOck's AI.

# OckOck facts (source of truth — if it's not here, you don't know it)
${ockockKnowledgeBlock()}`

const FALLBACK_REPLY = `I'm having a moment 🐃 — but the short version: OckOck runs your Muay Thai gym (bookings, the Naga–Garuda cert ladder, and an AI that answers your customers in Thai or English) for ฿${PLAN.priceTHB}/month after a free ${PLAN.trialDays}-day trial. Tap "Start free ${PLAN.trialDays}-day trial" above to try it — no credit card needed.`

export async function POST(request: Request) {
  // Cap abuse on this unauthenticated LLM endpoint. Degrades open if the
  // limiter itself errors — a marketing chat shouldn't 500 over that.
  const ip = ipFromRequest(request)
  const gate = await checkLimit({ key: `landing-chat:${ip}`, max: RATE_PER_HOUR }).catch(
    () => ({ ok: true as const, remaining: RATE_PER_HOUR, resetAt: new Date() }),
  )
  if (!gate.ok) {
    return NextResponse.json(
      { error: "You've sent a lot of messages — give it a minute, or just start the free trial 🐃" },
      { status: 429, headers: gate.headers },
    )
  }

  const body = await request.json().catch(() => null)
  const raw = body && Array.isArray((body as { messages?: unknown }).messages)
    ? (body as { messages: unknown[] }).messages
    : null
  if (!raw || raw.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 })
  }

  let messages: Turn[] = raw
    .filter(
      (m): m is Turn =>
        !!m &&
        typeof m === "object" &&
        "role" in m &&
        ((m as Turn).role === "user" || (m as Turn).role === "assistant") &&
        "content" in m &&
        typeof (m as Turn).content === "string" &&
        (m as Turn).content.trim().length > 0,
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }))

  // The UI seeds the thread with a canned greeting; the model doesn't need it.
  while (messages.length > 0 && messages[0].role === "assistant") messages = messages.slice(1)

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "the last message must be from the user" }, { status: 400 })
  }

  try {
    const result = await generateText({
      model: MODEL,
      system: SYSTEM,
      messages,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.4,
    })
    const reply = result.text?.trim()
    return NextResponse.json({ reply: reply || FALLBACK_REPLY })
  } catch (err) {
    console.error("[landing/chat] AI error:", err)
    return NextResponse.json({ reply: FALLBACK_REPLY })
  }
}
