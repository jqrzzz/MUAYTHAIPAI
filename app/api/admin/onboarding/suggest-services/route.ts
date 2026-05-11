/**
 * OckOck-generated default services for a new gym.
 *
 * Called from the onboarding wizard's Services step. Takes the gym's
 * name + city + (optional) description and returns 3 service templates
 * the owner can accept-as-is, edit, or dismiss. The point is to give
 * a fresh gym a running start instead of an empty form.
 *
 * Not stored — these are suggestions. The owner confirms with the
 * existing /api/admin/services POST flow once they've picked.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { generateText } from "ai"
import { requireGymAdmin } from "@/lib/auth-helpers"
import { MODEL_VOICE } from "@/lib/ai-models"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PostSchema = z.object({
  // Optional overrides — we'll fall back to whatever's on the org row
  gymName: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  description: z.string().max(800).optional(),
})

interface ServiceSuggestion {
  name: string
  description: string
  duration_minutes: number
  price_thb: number
}

const FALLBACK: ServiceSuggestion[] = [
  {
    name: "Drop-in Session",
    description:
      "Single training session — perfect for travelers or first-time visitors. Includes pad work and bag rounds.",
    duration_minutes: 90,
    price_thb: 500,
  },
  {
    name: "Weekly Pass",
    description:
      "Unlimited training for 7 days. Ideal for tourists staying in town or students testing the waters.",
    duration_minutes: 90,
    price_thb: 2500,
  },
  {
    name: "Private 1-on-1",
    description:
      "One-hour personal session with a trainer. Tailored to your skill level and goals.",
    duration_minutes: 60,
    price_thb: 1500,
  },
]

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const parsed = PostSchema.safeParse(await request.json().catch(() => ({})))
  const overrides = parsed.success ? parsed.data : {}

  const { data: org } = await supabase
    .from("organizations")
    .select("name, city, province, country, description")
    .eq("id", orgId)
    .single()

  const gymName = overrides.gymName || org?.name || "this gym"
  const city = overrides.city || org?.city || ""
  const province = org?.province || ""
  const country = org?.country || "Thailand"
  const description = overrides.description || org?.description || ""

  const locale =
    [city, province].filter(Boolean).join(", ") +
    (country && country !== "Thailand" ? `, ${country}` : "")

  const sys = `You are OckOck, an AI assistant for Muay Thai gyms in Thailand.
You help new gym owners pick the right service packages to list on day one.

Output STRICT JSON only — no prose, no markdown fences, no explanation.
Schema:
{
  "services": [
    { "name": string, "description": string, "duration_minutes": integer, "price_thb": integer },
    { ... 2 more ... }
  ]
}

Rules:
- Exactly 3 services.
- Names are short (2-4 words), no emoji.
- Descriptions are 1-2 sentences, plain English, no marketing fluff.
- duration_minutes: realistic for the format (private 60, group 90, weekly pass 90).
- price_thb: realistic Thai gym pricing (drop-in 300-700, week-pass 2000-4000, private 1000-2500). Adjust modestly for tourist hubs (Phuket, Pai, Chiang Mai, Bangkok) where prices skew higher.
- Mix: at least one drop-in/single-session option, at least one multi-session/pass option.
- Don't invent gimmicks — these are real services real students book.`

  const userPrompt = `Gym: ${gymName}${locale ? ` in ${locale}` : ""}
${description ? `About: ${description}` : ""}

Suggest 3 service packages for this gym to list on day one.`

  let suggestions: ServiceSuggestion[] = FALLBACK
  try {
    const { text } = await generateText({
      model: MODEL_VOICE,
      system: sys,
      prompt: userPrompt,
    })
    // The model occasionally wraps JSON in ```json fences despite the
    // instruction. Strip those before parsing.
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
    const parsedJson = JSON.parse(cleaned) as { services?: ServiceSuggestion[] }
    if (Array.isArray(parsedJson.services) && parsedJson.services.length > 0) {
      suggestions = parsedJson.services.slice(0, 3).map((s) => ({
        name: String(s.name ?? "").slice(0, 80),
        description: String(s.description ?? "").slice(0, 400),
        duration_minutes: Math.max(15, Math.min(480, Number(s.duration_minutes) || 90)),
        price_thb: Math.max(0, Math.min(50000, Number(s.price_thb) || 500)),
      }))
    }
  } catch (err) {
    console.error("[onboarding/suggest-services] AI generation failed:", err)
    // Fall through to FALLBACK
  }

  return NextResponse.json({ services: suggestions })
}
