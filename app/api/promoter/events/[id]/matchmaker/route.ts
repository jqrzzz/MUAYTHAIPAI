/**
 * POST /api/promoter/events/[id]/matchmaker
 *
 * The AI bout matchmaker — Door B's first AI-driven supply-side
 * feature. Given an event, asks Claude to propose ~4 bouts from the
 * pool of opted-in fighters that aren't already on the card. Each
 * suggestion lands in matchmaker_suggestions for the learning loop
 * regardless of whether the promoter accepts it.
 *
 * Body (all optional):
 *   {
 *     count?: number              // suggestions to generate (1-6, default 4)
 *     notes?: string              // promoter free-text hint
 *                                   // ("favor technical fighters", "no
 *                                   //  international", "main event candidates")
 *   }
 *
 * Returns:
 *   {
 *     suggestions: Array<{
 *       id: string
 *       fighter_red:  FighterCard
 *       fighter_blue: FighterCard
 *       weight_class: string | null
 *       scheduled_rounds: number
 *       reasoning: string
 *       estimated_draw: "low" | "medium" | "high"
 *       cross_gym: boolean        // would creating this bout fire
 *                                   // invitations vs. direct assignment
 *     }>
 *     fighter_pool_size: number   // size of pool we picked from
 *     prompt_version: string
 *   }
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { generateObject } from "ai"
import { z } from "zod"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"
import { MODEL_REASONING } from "@/lib/ai-models"
import { checkLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Bump when the prompt or model changes meaningfully so we can A/B
// later. Stored on every suggestion row.
const PROMPT_VERSION = "v1"

// Pool sizing: 30 is enough variety for Claude to reason over, small
// enough to keep prompt cost in cents. Sorted by record so we get
// the most-pairable fighters in the window.
const FIGHTER_POOL_SIZE = 30
const DEFAULT_SUGGESTIONS = 4
const MIN_SUGGESTIONS = 1
const MAX_SUGGESTIONS = 6
// Promoter notes get truncated to keep prompt-injection surface small
// without losing legitimate hints.
const MAX_NOTES_LENGTH = 500

// Service client used only for the suggestion INSERT — the regular
// user-scoped client would have to pass RLS, which it can, but the
// service client also lets us write the `generated_by` field
// reliably without a separate auth check.
const serviceSupabase = createServiceClient()

// Zod schema is what generateObject enforces on the LLM output.
// Field-level .describe() bleeds into the system prompt — keep
// descriptions tight + instructional.
const SuggestionSchema = z.object({
  red_fighter_id: z
    .string()
    .describe("Fighter ID for the red corner. Must be one of the fighter IDs in the AVAILABLE FIGHTERS list."),
  blue_fighter_id: z
    .string()
    .describe("Fighter ID for the blue corner. Must be one of the fighter IDs in the AVAILABLE FIGHTERS list. MUST NOT equal red_fighter_id."),
  weight_class: z
    .string()
    .nullable()
    .describe("Weight class for the bout, e.g. 'Lightweight (-60kg)'. Use the closer fighter's class if they differ slightly. Null if neither fighter has one set."),
  scheduled_rounds: z
    .number()
    .int()
    .min(3)
    .max(5)
    .describe("Number of rounds. Use 5 for headliners + cross-gym storylines, 3 for undercard bouts."),
  reasoning: z
    .string()
    .max(280)
    .describe("Two to three sentences explaining why this matchup draws. Reference specific record balance, gym rivalry, style contrast, or national appeal. Sound like a Thai fight promoter, not a chatbot."),
  estimated_draw: z
    .enum(["low", "medium", "high"])
    .describe("Honest demand signal. 'high' is reserved for genuinely compelling matchups (close records, name fighters, real storyline). Most bouts are medium."),
})

const ResponseSchema = z.object({
  suggestions: z
    .array(SuggestionSchema)
    .describe("The proposed bouts. Order from most-compelling to least."),
})

interface FighterRow {
  id: string
  display_name: string | null
  photo_url: string | null
  fight_record_wins: number | null
  fight_record_losses: number | null
  fight_record_draws: number | null
  weight_class: string | null
  weight_kg: number | null
  height_cm: number | null
  fighter_country: string | null
  org_id: string | null
  organizations: { id: string; name: string | null } | { id: string; name: string | null }[] | null
}

function fighterGymName(f: FighterRow): string | null {
  const o = Array.isArray(f.organizations) ? f.organizations[0] : f.organizations
  return o?.name ?? null
}

function fighterGymId(f: FighterRow): string | null {
  const o = Array.isArray(f.organizations) ? f.organizations[0] : f.organizations
  return o?.id ?? f.org_id ?? null
}

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

  // Generous per-user rate limit — generating is cheap but not free,
  // and a tight loop on regenerate could rack up tokens. Promoters
  // building a card legitimately hit this 5-15 times in a session.
  const gate = await checkLimit({
    key: `matchmaker:${auth.userId}`,
    max: 30,
    windowSeconds: 3600,
  })
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: 429, headers: gate.headers },
    )
  }

  const body = await request.json().catch(() => ({}))
  const count = Math.min(
    Math.max(typeof body.count === "number" ? body.count : DEFAULT_SUGGESTIONS, MIN_SUGGESTIONS),
    MAX_SUGGESTIONS,
  )
  const notes =
    typeof body.notes === "string" ? body.notes.trim().slice(0, MAX_NOTES_LENGTH) : ""

  // ---------- Gather context ----------

  // The event itself for prompt color (name + venue + date drive how
  // Claude reasons about scale + tone).
  const { data: event } = await supabase
    .from("fight_events")
    .select("name, event_date, venue_name, venue_city")
    .eq("id", eventId)
    .single()

  // Bouts already on the card. We exclude their fighters from the
  // pool so we don't suggest someone who's already booked, and we
  // pass a summary into the prompt so Claude knows what the card
  // already looks like (and can complement it).
  const { data: existingBouts } = await supabase
    .from("event_bouts")
    .select(`
      bout_order, is_main_event, weight_class,
      fighter_red:trainer_profiles!event_bouts_fighter_red_id_fkey ( id, display_name ),
      fighter_blue:trainer_profiles!event_bouts_fighter_blue_id_fkey ( id, display_name )
    `)
    .eq("event_id", eventId)
    .order("bout_order", { ascending: true })

  // Fighters under pending invitations for THIS event — also excluded
  // from the pool so we don't propose the same person twice. Defensive
  // against pre-migration 059: empty array if the table doesn't exist.
  const { data: pendingInvites } = await supabase
    .from("bout_invitations")
    .select("fighter_id, bout:event_bouts!bout_invitations_bout_id_fkey ( event_id )")
    .eq("status", "pending")

  const excludeFighterIds = new Set<string>()
  for (const b of existingBouts ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const red = Array.isArray((b as any).fighter_red) ? (b as any).fighter_red[0] : (b as any).fighter_red
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blue = Array.isArray((b as any).fighter_blue) ? (b as any).fighter_blue[0] : (b as any).fighter_blue
    if (red?.id) excludeFighterIds.add(red.id)
    if (blue?.id) excludeFighterIds.add(blue.id)
  }
  for (const inv of pendingInvites ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bout = Array.isArray((inv as any).bout) ? (inv as any).bout[0] : (inv as any).bout
    if (bout?.event_id === eventId && inv.fighter_id) {
      excludeFighterIds.add(inv.fighter_id)
    }
  }

  // The fighter pool. Open-to-fights + available + has a record we
  // can reason about. Sorted by wins so the meatiest matchmakers
  // float to the top of the window.
  const { data: pool, error: poolErr } = await supabase
    .from("trainer_profiles")
    .select(`
      id, display_name, photo_url,
      fight_record_wins, fight_record_losses, fight_record_draws,
      weight_class, weight_kg, height_cm, fighter_country, org_id,
      organizations ( id, name )
    `)
    .eq("open_to_fights", true)
    .eq("is_available", true)
    .order("fight_record_wins", { ascending: false })
    .limit(FIGHTER_POOL_SIZE + excludeFighterIds.size)

  if (poolErr) {
    console.error("[matchmaker] fighter pool fetch failed:", poolErr)
    return NextResponse.json(
      { error: "Couldn't load fighter pool. Try again." },
      { status: 500 },
    )
  }

  const availablePool: FighterRow[] = (pool ?? [])
    .filter((f) => !excludeFighterIds.has(f.id))
    .slice(0, FIGHTER_POOL_SIZE) as FighterRow[]

  if (availablePool.length < 2) {
    return NextResponse.json(
      {
        error:
          "Not enough fighters in the pool to suggest a bout. Encourage more fighters to enable Open-to-Fight on their profile.",
      },
      { status: 422 },
    )
  }

  // ---------- Build the prompt ----------

  const fighterLines = availablePool
    .map((f) => {
      const record = `${f.fight_record_wins ?? 0}-${f.fight_record_losses ?? 0}-${f.fight_record_draws ?? 0}`
      const stats = [
        f.weight_kg ? `${f.weight_kg}kg` : null,
        f.weight_class || null,
        f.height_cm ? `${f.height_cm}cm` : null,
        f.fighter_country || null,
      ]
        .filter(Boolean)
        .join(" · ")
      const gym = fighterGymName(f) ?? "Unaffiliated"
      return `- ${f.id} | ${f.display_name ?? "Unnamed"} (${record}) — ${stats || "no stats"} — ${gym}`
    })
    .join("\n")

  const existingBoutsSummary = (existingBouts ?? []).length
    ? (existingBouts ?? [])
        .map((b, i) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const red = Array.isArray((b as any).fighter_red) ? (b as any).fighter_red[0] : (b as any).fighter_red
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const blue = Array.isArray((b as any).fighter_blue) ? (b as any).fighter_blue[0] : (b as any).fighter_blue
          const main = b.is_main_event ? " [MAIN EVENT]" : ""
          const wc = b.weight_class ? ` (${b.weight_class})` : ""
          return `${i + 1}. ${red?.display_name ?? "TBD"} vs ${blue?.display_name ?? "TBD"}${wc}${main}`
        })
        .join("\n")
    : "(no bouts on the card yet — this is a clean slate)"

  const system = `You are an experienced Muay Thai matchmaker building a fight card for a Thai promoter. You think like a stadium veteran — you know which matchups put butts in seats. You speak like a professional, not a chatbot.

# How you reason about a good matchup

1. **Weight compatibility.** Fighters should be within ~3kg of each other. A 65kg vs 75kg matchup is a bad look. Use weight_kg if present, fall back to weight_class. If neither matches, don't pair them.

2. **Record balance.** Pair fighters whose records are competitive. 15-5 vs 18-3 = great. 30-2 vs 0-4 = a slaughter, audiences hate it. A small mismatch is OK if there's a storyline (gym rivalry, comeback fighter, undefeated streak).

3. **Cross-gym storylines draw.** Fighters from different gyms / regions / countries have more narrative tension. A Thai vs international matchup is gold for tourist-heavy venues. Same-gym matchups should be rare and explained.

4. **Style implied by record + experience.** High win-rate via low fight count = young phenom. Long record with even W/L = grizzled veteran. Reference these archetypes in your reasoning when it fits.

5. **Card composition.** If the promoter already has main-event-class bouts on the card, suggest undercard quality (3 rounds, building fighters). If the card is empty, propose at least one headline-worthy matchup.

# Output rules

- Generate exactly ${count} suggestions, ordered from most-compelling first.
- NEVER repeat a fighter between bouts in your output. Each fighter ID appears in at most one suggestion.
- NEVER suggest a bout where red_fighter_id === blue_fighter_id.
- Reasoning is two to three sentences. Be specific (cite records, gyms, weights) — generic "this will be exciting" is a fail.
- estimated_draw 'high' is for matchups with a real story. Most matchups are medium.`

  const userPrompt = `Build me ${count} bout suggestions for this event.

EVENT
- ${event?.name ?? "Untitled event"}
- ${event?.event_date ?? "TBD"}${event?.venue_name ? ` · ${event.venue_name}` : ""}${event?.venue_city ? `, ${event.venue_city}` : ""}

ALREADY ON THE CARD
${existingBoutsSummary}

${notes ? `PROMOTER NOTES\n${notes}\n` : ""}AVAILABLE FIGHTERS (id | name (record) — stats — gym)
${fighterLines}`

  // ---------- Call the model ----------

  let aiResult
  try {
    aiResult = await generateObject({
      model: MODEL_REASONING,
      schema: ResponseSchema,
      system,
      prompt: userPrompt,
      temperature: 0.7,
    })
  } catch (err) {
    console.error("[matchmaker] AI call failed:", err)
    return NextResponse.json(
      { error: "The matchmaker is having a moment. Try again in a sec." },
      { status: 502 },
    )
  }

  // ---------- Validate + dedup the model output ----------

  const fighterById = new Map(availablePool.map((f) => [f.id, f]))
  const seenFighters = new Set<string>()
  const validatedSuggestions: Array<{
    red_fighter_id: string
    blue_fighter_id: string
    weight_class: string | null
    scheduled_rounds: number
    reasoning: string
    estimated_draw: "low" | "medium" | "high"
  }> = []

  for (const s of aiResult.object.suggestions) {
    if (s.red_fighter_id === s.blue_fighter_id) continue
    if (!fighterById.has(s.red_fighter_id)) continue
    if (!fighterById.has(s.blue_fighter_id)) continue
    if (seenFighters.has(s.red_fighter_id) || seenFighters.has(s.blue_fighter_id)) continue
    seenFighters.add(s.red_fighter_id)
    seenFighters.add(s.blue_fighter_id)
    validatedSuggestions.push(s)
  }

  if (validatedSuggestions.length === 0) {
    return NextResponse.json(
      { error: "The matchmaker couldn't propose a clean card. Try again or adjust your notes." },
      { status: 502 },
    )
  }

  // ---------- Persist + return ----------

  const rowsToInsert = validatedSuggestions.map((s) => ({
    event_id: eventId,
    fighter_red_id: s.red_fighter_id,
    fighter_blue_id: s.blue_fighter_id,
    weight_class: s.weight_class,
    scheduled_rounds: s.scheduled_rounds,
    reasoning: s.reasoning,
    estimated_draw: s.estimated_draw,
    prompt_version: PROMPT_VERSION,
    generated_by: auth.userId,
  }))

  const { data: inserted, error: insErr } = await serviceSupabase
    .from("matchmaker_suggestions")
    .insert(rowsToInsert)
    .select("id, fighter_red_id, fighter_blue_id, weight_class, scheduled_rounds, reasoning, estimated_draw")

  if (insErr) {
    // 42P01 = table missing (migration 066 not applied yet). We
    // intentionally fail here rather than serving transient
    // suggestions: without the row, the accept flow has no way to
    // verify or persist the decision, so half the feature would be
    // broken and silently lose the learning trail. Surface the
    // setup gap instead.
    if (insErr.code === "42P01") {
      return NextResponse.json(
        {
          error:
            "AI Matchmaker isn't set up yet. Apply migration 066-matchmaker-suggestions.sql and try again.",
        },
        { status: 503 },
      )
    }
    console.error("[matchmaker] persist failed:", insErr)
    return NextResponse.json(
      { error: "Couldn't save suggestions. Try again." },
      { status: 500 },
    )
  }

  const suggestions = (inserted ?? []).map((row) => {
    const red = fighterById.get(row.fighter_red_id!)!
    const blue = fighterById.get(row.fighter_blue_id!)!
    return {
      id: row.id,
      transient: false,
      fighter_red: formatFighter(red),
      fighter_blue: formatFighter(blue),
      weight_class: row.weight_class,
      scheduled_rounds: row.scheduled_rounds,
      reasoning: row.reasoning,
      estimated_draw: row.estimated_draw,
      cross_gym: fighterGymId(red) !== fighterGymId(blue),
    }
  })

  return NextResponse.json({
    suggestions,
    fighter_pool_size: availablePool.length,
    prompt_version: PROMPT_VERSION,
  })
}

function formatFighter(f: FighterRow) {
  return {
    id: f.id,
    display_name: f.display_name ?? "Unnamed",
    photo_url: f.photo_url,
    record: `${f.fight_record_wins ?? 0}-${f.fight_record_losses ?? 0}-${f.fight_record_draws ?? 0}`,
    weight_class: f.weight_class,
    weight_kg: f.weight_kg,
    fighter_country: f.fighter_country,
    gym_name: fighterGymName(f),
    gym_id: fighterGymId(f),
  }
}
