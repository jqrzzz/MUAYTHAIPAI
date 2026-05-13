/**
 * POST /api/onboarding/extract
 *
 * The AI half of conversational onboarding. The new gym owner describes
 * their gym in their own words (Thai or English, however messy) and OckOck
 * turns it into a clean structured setup — a public description, a list of
 * services with THB prices, and per-day opening hours. The owner reviews
 * and edits it on the next screen before anything is saved; this endpoint
 * never writes to the gym.
 *
 * Body:   { text: string }
 * Return: { description, services[], hours[], notes }   (best-effort; empty
 *         pieces on a thin description or AI error)
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "ai"
import { requireGymAdmin } from "@/lib/auth-helpers"
import { MODEL_FAST } from "@/lib/ai-models"
import { checkLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

const Schema = z.object({
  description: z
    .string()
    .describe(
      "A natural 1–2 sentence public description of the gym, written from what the owner said. Empty string if they didn't really describe it.",
    ),
  services: z
    .array(
      z.object({
        name: z.string().describe("Short service name, 2–4 words, no emoji."),
        description: z.string().describe("1–2 plain sentences. Empty string if none implied."),
        duration_minutes: z.number().int().describe("Realistic length: private ~60, group/drop-in ~90, day/week pass ~90."),
        price_thb: z.number().int().describe("Price in Thai Baht, integer. 0 only if genuinely free."),
      }),
    )
    .describe("Every service/package the owner mentioned, with THB prices. Empty array if none mentioned — do not invent."),
  hours: z
    .array(
      z.object({
        day: z.enum(DAYS),
        open: z.string().describe('24-hour "HH:MM", e.g. "07:00".'),
        close: z.string().describe('24-hour "HH:MM", e.g. "18:00".'),
      }),
    )
    .describe(
      'One entry per day the gym is OPEN. Days with no entry are treated as closed. Empty array if hours were not mentioned. Expand loose phrasing — "weekdays 7 to 6, half day Saturday" → mon–fri 07:00–18:00 and sat 08:00–12:00, no sunday entry.',
    ),
  notes: z
    .string()
    .describe("Anything relevant the owner said that doesn't fit the fields above (trainers, location quirks, classes for kids, etc.). Empty string if nothing."),
})

type Extracted = z.infer<typeof Schema>

const EMPTY: Extracted = { description: "", services: [], hours: [], notes: "" }

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/
// Pad "7:00" → "07:00" so <input type="time"> accepts it.
const padTime = (t: string) => (/^\d:/.test(t) ? `0${t}` : t)

function clean(raw: Extracted): Extracted {
  return {
    description: raw.description.trim().slice(0, 600),
    services: (raw.services ?? [])
      .filter((s) => s.name?.trim())
      .slice(0, 8)
      .map((s) => ({
        name: s.name.trim().slice(0, 80),
        description: (s.description ?? "").trim().slice(0, 400),
        duration_minutes: Math.max(15, Math.min(480, Math.round(Number(s.duration_minutes) || 90))),
        price_thb: Math.max(0, Math.min(100000, Math.round(Number(s.price_thb) || 0))),
      })),
    hours: (raw.hours ?? [])
      .filter((h) => DAYS.includes(h.day) && TIME_RE.test(h.open) && TIME_RE.test(h.close))
      // de-dupe by day, keep the first
      .filter((h, i, arr) => arr.findIndex((x) => x.day === h.day) === i)
      .map((h) => ({ day: h.day, open: padTime(h.open), close: padTime(h.close) })),
    notes: (raw.notes ?? "").trim().slice(0, 600),
  }
}

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { supabase, orgId, user } = auth

  const gate = await checkLimit({ key: `onboarding-extract:${user.id}`, max: 20, windowSeconds: 3600 }).catch(
    () => ({ ok: true as const, remaining: 20, resetAt: new Date() }),
  )
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 429, headers: gate.headers })

  const body = (await request.json().catch(() => ({}))) as { text?: unknown }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 4000) : ""
  if (text.length < 3) return NextResponse.json(EMPTY)

  const { data: org } = await supabase
    .from("organizations")
    .select("name, city, province, country")
    .eq("id", orgId)
    .single()

  const locale = [org?.city, org?.province].filter(Boolean).join(", ")
  const tourismHub = /phuket|pai|chiang ?mai|bangkok|krabi|koh|samui|pattaya/i.test(locale)

  const system = `You are OckOck, an AI assistant for Muay Thai gyms in Thailand. A new gym owner is describing their gym so you can set it up. Produce a clean structured setup.

Rules:
- Use ONLY what the owner actually said. Do not invent services, prices, hours, or details they didn't mention — leave those empty/absent.
- Prices are in Thai Baht as integers. Typical ranges (a sanity check, not a license to invent): drop-in 300–700, week pass 2000–4000, month pass 6000–12000, private 1000–2500.${tourismHub ? " This gym is in a tourist hub — prices may skew toward the higher end." : ""}
- Times are 24-hour "HH:MM". Expand loose phrasing into per-day entries; only list days the gym is open.
- "description": a warm, natural 1–2 sentence public description in the owner's spirit — not marketing fluff.
- The owner may write in Thai or English. Understand both; write "description" in the same language they used.`

  const prompt = `Gym: ${org?.name ?? "this gym"}${locale ? ` (${locale})` : ""}

The owner says:
"""
${text}
"""

Extract the structured setup.`

  try {
    const { object } = await generateObject({ model: MODEL_FAST, schema: Schema, system, prompt })
    return NextResponse.json(clean(object))
  } catch (err) {
    console.error("[onboarding/extract] AI extraction failed:", err)
    return NextResponse.json(EMPTY)
  }
}
