/**
 * "Generate this week's posts" — batch generator.
 *
 * POST /api/admin/social/ai/generate-batch
 *   body: { count?: number, platforms: Platform[], theme?: string }
 *
 * Pulls recent gym activity (services, recent bookings, certifications,
 * upcoming events) and asks AI to draft N varied posts. Each is saved
 * as its own draft social_post so the operator can review individually.
 *
 * Output is intentionally varied: training tip, fight story prompt,
 * gym culture moment, class spotlight, beginner welcome, etc. — not 7
 * versions of the same post.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "ai"
import { requireGymAdmin } from "@/lib/auth-helpers"
import { MODEL_VOICE } from "@/lib/ai-models"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 90

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
  count: z.number().int().min(1).max(14).default(7),
  platforms: z.array(z.enum(PLATFORMS)).min(1).max(6),
  /** Optional steer — e.g. "we want to focus on beginners this week" */
  theme: z.string().max(300).optional(),
})

const PostIdeaSchema = z.object({
  category: z
    .enum(["training_tip", "spotlight", "culture", "welcome", "story", "behind_scenes", "promo"])
    .describe("Which category this post belongs to — varies the mix"),
  intent: z
    .string()
    .describe("Short summary of what this post is about (1 sentence). The operator sees this in the queue."),
  instagram: z
    .object({
      caption: z.string(),
      hashtags: z.array(z.string()).max(12),
    })
    .optional(),
  facebook: z.object({ body: z.string() }).optional(),
  tiktok: z
    .object({ caption: z.string(), hashtags: z.array(z.string()).max(8) })
    .optional(),
  line_oa: z.object({ body: z.string() }).optional(),
  threads: z.object({ body: z.string() }).optional(),
  twitter: z.object({ body: z.string() }).optional(),
})

const ResponseSchema = z.object({
  posts: z.array(PostIdeaSchema),
})

export async function POST(request: Request) {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId, user } = auth

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { count, platforms, theme } = parsed.data

  // Pull gym context: name, city, recent services + trainers + recent activity
  const [orgRes, servicesRes, trainersRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("name, city, description")
      .eq("id", orgId)
      .single(),
    supabase
      .from("services")
      .select("name, description, category")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .limit(20),
    supabase
      .from("trainer_profiles")
      .select("display_name, bio")
      .eq("org_id", orgId)
      .eq("is_available", true)
      .limit(10),
  ])

  const platformList = platforms.join(", ")
  const servicesList = (servicesRes.data ?? [])
    .map((s) => `- ${s.name}${s.description ? `: ${s.description}` : ""}`)
    .join("\n")
  const trainersList = (trainersRes.data ?? [])
    .map((t) => `- ${t.display_name}${t.bio ? `: ${t.bio}` : ""}`)
    .join("\n")

  const systemPrompt = `You are OckOck, drafting a week of social posts for a Muay Thai gym. The operator will review + edit + schedule each one.

Gym: ${orgRes.data?.name || "this gym"}${orgRes.data?.city ? ` in ${orgRes.data.city}` : ""}
${orgRes.data?.description ? `About: ${orgRes.data.description}` : ""}

${servicesList ? `Classes/services they offer:\n${servicesList}` : ""}
${trainersList ? `Trainers:\n${trainersList}` : ""}
${theme ? `Steer: ${theme}` : ""}

Generate ${count} VARIED posts. Mix the categories so the feed feels alive:
- training_tip: a Muay Thai technique or training insight
- spotlight: a class, trainer, or service highlighted
- culture: Wai Kru, Muay Thai history, Thai boxing values, life at the gym
- welcome: invite beginners, dispel "I'm not ready" fears
- story: short anecdote (could be a training session moment, a comeback, a tradition)
- behind_scenes: gym life, daily training, food after training, gym dog, etc.
- promo: a class or program mentioned without being salesy

Each post: write copy ONLY for ${platformList}. Tune length + voice per platform.

Voice: warm, confident, a little gritty. Sound like a coach who's been doing this 20 years. Avoid corporate marketing speak. Don't fabricate specific facts (don't claim "we won X fights" or "we have Y students" unless you can back it up). Speak from the universal experience of running a Muay Thai gym.`

  let result
  try {
    result = await generateObject({
      model: MODEL,
      schema: ResponseSchema,
      system: systemPrompt,
      prompt: `Generate ${count} varied posts.`,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 502 },
    )
  }

  // Persist each as a draft
  const rows = result.object.posts.slice(0, count).map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: Record<string, any> = {}
    for (const platform of platforms) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = (p as any)[platform]
      if (c) content[platform] = c
    }
    return {
      org_id: orgId,
      platforms,
      content,
      status: "draft" as const,
      source: "ai_batch" as const,
      source_intent: `[${p.category}] ${p.intent}`,
      created_by: user.id,
    }
  })

  if (rows.length === 0) {
    return NextResponse.json({ posts: [] })
  }

  const { data, error } = await supabase
    .from("social_posts")
    .insert(rows)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data ?? [] })
}
