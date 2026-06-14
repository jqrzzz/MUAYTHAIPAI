/**
 * POST /api/promoter/events/[id]/marketing/generate
 *
 * The AI Auto-Marketer — Door B's third AI feature. Generates
 * ready-to-paste social copy for a published event across the
 * platforms a Thai promoter actually uses (Facebook, Instagram,
 * LINE OA, Twitter/X) in both Thai and English. Every draft
 * lands in marketing_drafts; copy/dismiss is the learning signal.
 *
 * Body:
 *   {
 *     platforms: ("facebook" | "instagram" | "line" | "twitter")[]
 *     languages: ("en" | "th")[]
 *     // Optional: promoter free-text steering ("emphasize the
 *     // headliner", "tourist-focused", "no emojis").
 *     notes?: string
 *   }
 *
 * Returns:
 *   {
 *     drafts: Array<{
 *       id:        string
 *       platform:  string
 *       language:  string
 *       caption:   string
 *       hashtags:  string[]
 *     }>
 *     prompt_version: string
 *   }
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { generateObject } from "ai"
import { z } from "zod"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"
import { MODEL_VOICE } from "@/lib/ai-models"
import { checkLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PROMPT_VERSION = "v1"
const MAX_NOTES_LENGTH = 500
const MAX_HASHTAGS = 10
const MAX_CAPTION_LENGTH = 2200 // IG's hard cap; FB is higher but
                                // we don't need more in practice.

const PLATFORMS = ["facebook", "instagram", "line", "twitter"] as const
const LANGUAGES = ["en", "th"] as const
type Platform = (typeof PLATFORMS)[number]
type Language = (typeof LANGUAGES)[number]

const serviceSupabase = createServiceClient()

// Per-platform character + tone guidance. Surfaced to the model
// as a JSON-ish hint block, and also enforced (loosely) by the
// schema max() lengths so a model that wanders gets trimmed.
const PLATFORM_RULES: Record<Platform, { maxChars: number; voice: string }> = {
  facebook: {
    maxChars: 1500,
    voice:
      "Long-form story. 2-4 short paragraphs. Set the scene, tease the matchups, end with date + venue + ticket link. Hashtags at the very bottom on their own line, never inline. Plain text, occasional emoji ok if it fits the gym's voice.",
  },
  instagram: {
    maxChars: 2000,
    voice:
      "Visual-first. Tease the experience, don't oversell. Punchy opener (one line), then 2-3 short paragraphs about the fights + the night. Hashtags grouped at the bottom, never inline. Up to 8 relevant hashtags.",
  },
  line: {
    maxChars: 800,
    voice:
      "Direct announcement, like texting a friend. Plain text, no hashtags (LINE OA broadcasts don't use them). Lead with the date + headline, then bullet 2-3 key matchups, then how to buy. No emojis or just one.",
  },
  twitter: {
    maxChars: 260,
    voice:
      "Tight hook in the first 5 words. Max 240 chars in the caption to leave room for the link the promoter will paste later. 2-3 hashtags max, inline ok. No fluff.",
  },
}

const DraftSchema = z.object({
  platform: z
    .enum(PLATFORMS)
    .describe("Must be one of the platforms requested."),
  language: z
    .enum(LANGUAGES)
    .describe("Must be one of the languages requested."),
  caption: z
    .string()
    .min(20)
    .max(MAX_CAPTION_LENGTH)
    .describe(
      "Platform-appropriate caption. Respect the per-platform voice and length rules in the system prompt. Plain text. Place hashtags at the bottom on their own line for facebook/instagram, inline for twitter, none for line.",
    ),
  hashtags: z
    .array(z.string().max(40))
    .max(MAX_HASHTAGS)
    .describe(
      "Hashtags WITHOUT the leading # symbol, lowercase preferred. 5-8 for instagram, 3-5 for facebook, 2-3 for twitter, EMPTY for line.",
    ),
})

const ResponseSchema = z.object({
  drafts: z
    .array(DraftSchema)
    .describe(
      "One draft per (platform, language) combination requested. Order doesn't matter — UI groups by platform.",
    ),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const auth = await getPromoterAuth(supabase)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!(await verifyEventOwnership(supabase, eventId, auth.orgId))) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Tighter rate limit than matchmaker/oracle because each call
  // produces many drafts (up to 4 platforms × 2 langs = 8 drafts).
  const gate = await checkLimit({
    key: `marketing:${auth.userId}`,
    max: 20,
    windowSeconds: 3600,
  })
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: 429, headers: gate.headers },
    )
  }

  // ----- Parse + validate request -----
  const body = await request.json().catch(() => ({}))
  const platforms: Platform[] = Array.isArray(body.platforms)
    ? Array.from(
        new Set(
          (body.platforms as unknown[]).filter((p): p is Platform =>
            (PLATFORMS as readonly string[]).includes(p as string),
          ),
        ),
      )
    : []
  const languages: Language[] = Array.isArray(body.languages)
    ? Array.from(
        new Set(
          (body.languages as unknown[]).filter((l): l is Language =>
            (LANGUAGES as readonly string[]).includes(l as string),
          ),
        ),
      )
    : []
  const notes =
    typeof body.notes === "string"
      ? body.notes.trim().slice(0, MAX_NOTES_LENGTH)
      : ""

  if (platforms.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one platform (facebook, instagram, line, twitter)." },
      { status: 400 },
    )
  }
  if (languages.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one language (en or th)." },
      { status: 400 },
    )
  }

  // ----- Gather context -----

  const { data: event } = await supabase
    .from("fight_events")
    .select(
      "name, description, event_date, event_time, venue_name, venue_address, venue_city, venue_province, max_capacity, status, organizations ( name, slug, city )",
    )
    .eq("id", eventId)
    .single()

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  if (event.status === "cancelled") {
    return NextResponse.json(
      { error: "Can't generate marketing for a cancelled event." },
      { status: 422 },
    )
  }

  const { data: bouts } = await supabase
    .from("event_bouts")
    .select(`
      bout_order, is_main_event, weight_class, scheduled_rounds,
      fighter_red:trainer_profiles!event_bouts_fighter_red_id_fkey (
        display_name, fight_record_wins, fight_record_losses, fight_record_draws,
        fighter_country, organizations ( name )
      ),
      fighter_blue:trainer_profiles!event_bouts_fighter_blue_id_fkey (
        display_name, fight_record_wins, fight_record_losses, fight_record_draws,
        fighter_country, organizations ( name )
      )
    `)
    .eq("event_id", eventId)
    .order("is_main_event", { ascending: false })
    .order("bout_order", { ascending: true })

  const { data: tiers } = await supabase
    .from("event_tickets")
    .select("tier_name, price_thb, quantity_total, quantity_sold, is_active")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("price_thb", { ascending: true })

  // Cheapest active tier = "tickets from ฿X" hook.
  const cheapestPrice = (tiers ?? [])
    .map((t) => t.price_thb ?? 0)
    .filter((p) => p > 0)
    .sort((a, b) => a - b)[0]

  // Build the bout summary. Main events first; up to 4 bouts named
  // explicitly to keep the prompt tight. Undercard summarized as
  // "+N more bouts".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatFighter = (f: any) => {
    const f2 = Array.isArray(f) ? f[0] : f
    if (!f2) return null
    const record = `${f2.fight_record_wins ?? 0}-${f2.fight_record_losses ?? 0}-${f2.fight_record_draws ?? 0}`
    const gym = Array.isArray(f2.organizations)
      ? f2.organizations[0]?.name
      : f2.organizations?.name
    return {
      name: f2.display_name as string,
      record,
      country: f2.fighter_country as string | null,
      gym: gym as string | null | undefined,
    }
  }

  const namedBouts = (bouts ?? []).slice(0, 4).map((b) => {
    const red = formatFighter(b.fighter_red)
    const blue = formatFighter(b.fighter_blue)
    return {
      isMain: !!b.is_main_event,
      weightClass: b.weight_class,
      rounds: b.scheduled_rounds,
      red,
      blue,
    }
  })
  const undercardCount = Math.max(0, (bouts?.length ?? 0) - 4)

  // Org/host. The "host gym" name + city anchor the local appeal.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const org = Array.isArray((event as any).organizations)
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event as any).organizations[0]
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event as any).organizations
  const hostName = org?.name as string | undefined
  const hostSlug = org?.slug as string | undefined

  // ----- Build the prompt -----

  const platformGuidance = platforms
    .map((p) => `- ${p}: ${PLATFORM_RULES[p].voice} (max ~${PLATFORM_RULES[p].maxChars} chars)`)
    .join("\n")

  const boutsBlock = namedBouts.length
    ? namedBouts
        .map((b, i) => {
          const tag = b.isMain ? " [MAIN EVENT]" : ""
          const red = b.red
            ? `${b.red.name} (${b.red.record})${b.red.country ? ` [${b.red.country}]` : ""}${b.red.gym ? ` of ${b.red.gym}` : ""}`
            : "TBD"
          const blue = b.blue
            ? `${b.blue.name} (${b.blue.record})${b.blue.country ? ` [${b.blue.country}]` : ""}${b.blue.gym ? ` of ${b.blue.gym}` : ""}`
            : "TBD"
          return `${i + 1}. ${red} vs ${blue}${b.weightClass ? ` (${b.weightClass})` : ""}${tag}`
        })
        .join("\n") + (undercardCount > 0 ? `\n+ ${undercardCount} more undercard bout${undercardCount === 1 ? "" : "s"}` : "")
    : "(no bouts on the card yet — keep the copy fight-card-agnostic)"

  const dateLine = (() => {
    const d = event.event_date as string
    const t = event.event_time as string | null
    if (!d) return "TBD"
    const parts = [d]
    if (t) parts.push(t.slice(0, 5))
    return parts.join(" ")
  })()

  const venueLine = [
    event.venue_name,
    event.venue_city,
    event.venue_province,
  ]
    .filter(Boolean)
    .join(", ") || "TBD"

  const system = `You are OckOck (Thai: อ๊อกอ๊อก), the marketing voice of a Thai Muay Thai gym promoting a fight event. You write copy that sounds like a real promoter at the gym, not a corporate marketing department. You handle Thai and English natively — when asked for Thai, write in genuine, natural Thai (สวัสดี, เจอกัน, สู้ๆ) without literal translations of English idioms.

# Your job

Generate one social post per (platform, language) combination requested. Tune length, structure, and tone to each platform.

${platformGuidance}

# Voice priors

- Sound like a coach who's been at it for years, not a brand. Warm. Confident. A little gritty.
- Reference SPECIFIC fighters by name when they're on the card. Use their records ("18-3") and gym ("of Channa Gym") to give the matchup weight.
- For Thai: write in genuine Thai. Don't translate English idioms literally. Use Muay Thai vocab naturally (มวยไทย, นักมวย, ค่ายมวย, ขึ้นชก).
- For English: write for a tourist + expat audience. Keep it punchy. Skip business-school marketing speak ("don't miss out", "limited time").
- NEVER invent fighters, records, dates, venues, prices, or promises that aren't in the facts below.

# Hashtag rules

- facebook: 3-5 hashtags, grouped on a separate line at the bottom of the caption
- instagram: 5-8 hashtags, grouped on a separate line at the bottom of the caption
- twitter: 2-3 hashtags, inline ok, must fit within character budget
- line: ZERO hashtags. LINE OA broadcasts don't use them.

For each draft, the hashtags array is the list WITHOUT the # symbol — the UI prepends it. Common Thai-relevant hashtags include: muaythai, มวยไทย, fightnight, thailand, [city name lower-cased], the gym name lower-cased, fyp (for tiktok/general), etc. Don't include #fyp on facebook — wrong platform vibe.

# Hard rules

- Don't fabricate. If the venue is unknown, say "TBD" or omit. If the date is in the past, refuse politely.
- Stay within the per-platform character budget. Twitter especially is HARD — count.
- Output ONE draft per (platform, language) pair the user requested. No more, no less.`

  const userPrompt = `Generate marketing copy for this event.

EVENT
- ${event.name}
- ${dateLine} · ${venueLine}
- Host: ${hostName ?? "TBD"}${hostSlug ? ` (https://ockock.app/g/${hostSlug})` : ""}
${cheapestPrice ? `- Tickets from ฿${cheapestPrice.toLocaleString()}` : "- Tickets: TBD"}

FIGHT CARD
${boutsBlock}

PLATFORMS REQUESTED
${platforms.join(", ")}

LANGUAGES REQUESTED
${languages.join(", ")}

${notes ? `PROMOTER NOTES\n${notes}\n` : ""}Produce exactly ${platforms.length * languages.length} drafts — one per (platform, language).`

  // ----- Call the model -----

  let aiResult
  try {
    aiResult = await generateObject({
      model: MODEL_VOICE,
      schema: ResponseSchema,
      system,
      prompt: userPrompt,
      temperature: 0.8,
    })
  } catch (err) {
    console.error("[marketing] AI call failed:", err)
    return NextResponse.json(
      { error: "The marketer is having a moment. Try again in a sec." },
      { status: 502 },
    )
  }

  // ----- Validate + filter the output -----
  // The model occasionally hallucinates extra platforms or returns
  // duplicate (platform, language) pairs. We trim to requested
  // combinations, last-write-wins per pair.
  const wanted = new Set(
    platforms.flatMap((p) => languages.map((l) => `${p}|${l}`)),
  )
  const byPair = new Map<
    string,
    { platform: Platform; language: Language; caption: string; hashtags: string[] }
  >()
  for (const d of aiResult.object.drafts) {
    const key = `${d.platform}|${d.language}`
    if (!wanted.has(key)) continue
    // For LINE, force-empty the hashtag array even if the model
    // forgot the rule — broadcasts don't render them.
    const hashtags = d.platform === "line" ? [] : (d.hashtags ?? []).slice(0, MAX_HASHTAGS)
    // Strip any leading # the model added defensively.
    const cleanHashtags = hashtags.map((h) => h.replace(/^#+/, "").trim()).filter(Boolean)
    byPair.set(key, {
      platform: d.platform,
      language: d.language,
      caption: d.caption.trim().slice(0, MAX_CAPTION_LENGTH),
      hashtags: cleanHashtags,
    })
  }

  const validated = Array.from(byPair.values())
  if (validated.length === 0) {
    return NextResponse.json(
      { error: "The marketer didn't return any usable drafts. Try again." },
      { status: 502 },
    )
  }

  // ----- Persist + return -----
  const rowsToInsert = validated.map((d) => ({
    event_id: eventId,
    platform: d.platform,
    language: d.language,
    caption: d.caption,
    hashtags: d.hashtags,
    prompt_version: PROMPT_VERSION,
    generated_by: auth.userId,
  }))

  const { data: inserted, error: insErr } = await serviceSupabase
    .from("marketing_drafts")
    .insert(rowsToInsert)
    .select("id, platform, language, caption, hashtags")

  if (insErr) {
    if (insErr.code === "42P01") {
      return NextResponse.json(
        {
          error:
            "Auto-Marketer isn't set up yet. Apply migration 068-marketing-drafts.sql and try again.",
        },
        { status: 503 },
      )
    }
    console.error("[marketing] persist failed:", insErr)
    return NextResponse.json(
      { error: "Couldn't save drafts. Try again." },
      { status: 500 },
    )
  }

  return NextResponse.json({
    drafts: inserted ?? [],
    prompt_version: PROMPT_VERSION,
  })
}
