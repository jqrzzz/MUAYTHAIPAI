/**
 * AI Social composer.
 *
 * POST /api/admin/social/ai/compose
 *   body: { intent: string, platforms: Platform[], tone?: string }
 *
 * Operator types ONE thing ("we have fight night Saturday with Phong at
 * Lumpinee") and gets back per-platform variants tuned to each
 * platform's voice + length conventions. The result is auto-saved as a
 * draft social_post they can review + edit + schedule.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "ai"
import { requireGymAdmin } from "@/lib/auth-helpers"
import { checkLimit } from "@/lib/rate-limit"
import { MODEL_VOICE } from "@/lib/ai-models"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const MODEL = MODEL_VOICE

const PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "line_oa",
  "threads",
  "twitter",
] as const

const BodySchema = z.object({
  intent: z.string().min(3).max(2000),
  platforms: z.array(z.enum(PLATFORMS)).min(1).max(6),
  /** "friendly" | "elite" | "casual" | "formal" — free text, AI interprets */
  tone: z.string().max(80).optional(),
})

const ResponseSchema = z.object({
  instagram: z
    .object({
      caption: z.string().describe("3-6 short paragraphs. Punchy. Include 1-2 emojis if natural."),
      hashtags: z.array(z.string()).max(15).describe("5-10 relevant hashtags, no leading #"),
    })
    .optional(),
  facebook: z
    .object({
      body: z.string().describe("2-4 paragraphs. Conversational, slightly longer than IG."),
    })
    .optional(),
  tiktok: z
    .object({
      caption: z.string().describe("Short, punchy, hook-style. 1-2 sentences max."),
      hashtags: z.array(z.string()).max(8).describe("3-5 hashtags including #fyp #muaythai"),
    })
    .optional(),
  line_oa: z
    .object({
      body: z.string().describe("Direct, friendly announcement. Plain language. 2-3 sentences."),
    })
    .optional(),
  threads: z
    .object({
      body: z.string().describe("Casual, short. Like a tweet. Max 500 chars."),
    })
    .optional(),
  twitter: z
    .object({
      body: z.string().describe("Max 280 chars. Punchy hook + 1-2 hashtags."),
    })
    .optional(),
})

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId, user } = auth

  const gate = await checkLimit({ key: `admin-social-compose:${user.id}`, max: 30, windowSeconds: 3600 })
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 429, headers: gate.headers })
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { intent, platforms, tone } = parsed.data

  // Pull gym info for context
  const { data: gym } = await supabase
    .from("organizations")
    .select("name, city, description")
    .eq("id", orgId)
    .single()

  const platformList = platforms.join(", ")
  const systemPrompt = `You are OckOck, the social media writer for Muay Thai gyms. You write copy that sounds like a real person at the gym, not a corporate marketing department.

Gym: ${gym?.name || "this gym"}${gym?.city ? ` in ${gym.city}` : ""}${
    gym?.description ? `. About: ${gym.description}` : ""
  }

The operator's intent: "${intent}"

${tone ? `Voice: ${tone}.` : "Voice: warm, confident, a little gritty. Like a coach who's been at it for years."}

Generate copy for ${platformList} ONLY. Tune length + tone for each platform's culture:
- Instagram: visual-first. Tease the experience, don't oversell. Hashtags down at the bottom, never inline.
- Facebook: longer story. Community-feel. Real talk.
- TikTok: hook in the first 5 words. Short. #muaythai #fyp.
- LINE OA: direct announcement. Like a friend texting you. Plain text.
- Threads: casual quick take. Short.
- Twitter: tight. 280 chars max including hashtags.

Avoid emoji-heavy "marketing speak." Sound human. Use Thai words naturally if relevant (สวัสดี, มวยไทย, สู้ๆ).

Output only the platforms requested. Don't fabricate facts (don't say "we won 5 fights last week" if the operator didn't say so). Stick to what they shared.`

  let aiContent
  try {
    const result = await generateObject({
      model: MODEL,
      schema: ResponseSchema,
      system: systemPrompt,
      prompt: `Generate posts for: ${platformList}.`,
    })
    aiContent = result.object
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 502 },
    )
  }

  // Persist as draft — operator can review + schedule
  const { data: post, error } = await supabase
    .from("social_posts")
    .insert({
      org_id: orgId,
      platforms,
      content: aiContent,
      status: "draft",
      source: "ai_compose",
      source_intent: intent,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post })
}
