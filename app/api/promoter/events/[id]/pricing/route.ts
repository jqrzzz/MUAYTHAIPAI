/**
 * POST /api/promoter/events/[id]/pricing
 *
 * The AI Pricing Oracle — Door B's second AI feature. Given an
 * event + a specific ticket tier (existing or proposed), returns
 * a price recommendation derived from comparable past events the
 * promoter has run, weighted by venue / city / season similarity.
 *
 * Cold-start case (no comparable history yet): falls back to Thai
 * market priors embedded in the prompt, returns confidence='low'
 * with signal='cold-start'.
 *
 * Body:
 *   {
 *     tier_id?:                string  // omit when sizing a new tier
 *     tier_name:                string  // required — "VIP", "GA", etc
 *     current_price_thb?:       number  // promoter's current/proposed price
 *     current_quantity_total?:  number
 *   }
 *
 * Returns:
 *   {
 *     recommendation: {
 *       id:                          string
 *       recommended_price_thb:       number
 *       recommended_quantity_total:  number | null
 *       projected_sold:              number | null
 *       confidence:                  "low" | "medium" | "high"
 *       signal:                      "underpriced" | "overpriced" | "on-target" | "cold-start"
 *       reasoning:                   string
 *     }
 *     comparables: Array<{
 *       event_name:   string
 *       venue:        string | null
 *       city:         string | null
 *       date:         string
 *       tier_name:    string
 *       price_thb:    number
 *       sold:         number
 *       sold_percent: number
 *     }>
 *     prompt_version: string
 *   }
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { generateObject } from "ai"
import { z } from "zod"
import { getPromoterAuth, verifyEventOwnership } from "@/lib/auth-helpers"
import { MODEL_REASONING } from "@/lib/ai-models"
import { checkLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PROMPT_VERSION = "v1"
// How many recent same-org events to pull as candidate comparables.
// We then trim to the top-N most-similar by venue / city / season.
const COMPARABLE_CANDIDATE_POOL = 30
const COMPARABLE_SAMPLE_LIMIT = 8
const MAX_TIER_NAME_LENGTH = 80
const MIN_PRICE = 50
const MAX_PRICE = 100_000

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const RecommendationSchema = z.object({
  recommended_price_thb: z
    .number()
    .int()
    .min(MIN_PRICE)
    .max(MAX_PRICE)
    .describe(
      "Recommended ticket price in Thai baht. Integer, between 50 and 100,000. Round to nearest 50 for prices under 1000, nearest 100 above.",
    ),
  recommended_quantity_total: z
    .number()
    .int()
    .min(0)
    .max(100_000)
    .nullable()
    .describe(
      "Recommended quantity of seats/spots for this tier. Null if no opinion (e.g., for a tier name that's purely about pricing).",
    ),
  projected_sold: z
    .number()
    .int()
    .min(0)
    .max(100_000)
    .nullable()
    .describe(
      "Best-guess number sold at the recommended price + quantity. Null if too uncertain (low confidence + cold-start usually).",
    ),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe(
      "low = no good comparables, prior-based guess. medium = some comparables but they're old or distant. high = strong comparables at the same venue or city in recent months.",
    ),
  signal: z
    .enum(["underpriced", "overpriced", "on-target", "cold-start"])
    .describe(
      "Compare recommended to current_price_thb if provided. 'cold-start' is reserved for confidence='low' AND no comparable events. on-target = within 5% of current. underpriced/overpriced for >5% deviation.",
    ),
  reasoning: z
    .string()
    .max(400)
    .describe(
      "Two to four sentences. If you used comparables, cite at least one specifically ('At Channa Stadium in March, VIP at ฿1500 sold 85%'). If cold-start, name the priors you used ('Local Pai gym fights typically run ฿300-500 GA'). Sound like a market analyst, not a chatbot.",
    ),
})

const ResponseSchema = z.object({
  recommendation: RecommendationSchema,
})

interface ComparableEvent {
  event_name: string
  venue: string | null
  city: string | null
  date: string
  tier_name: string
  price_thb: number
  sold: number
  quantity_total: number
  sold_percent: number
  same_venue: boolean
  same_city: boolean
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

  // Per-user rate limit. Pricing checks are cheap but not free;
  // a tight regenerate loop could rack up tokens.
  const gate = await checkLimit({
    key: `pricing-oracle:${auth.userId}`,
    max: 40,
    windowSeconds: 3600,
  })
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: 429, headers: gate.headers },
    )
  }

  const body = await request.json().catch(() => ({}))
  const tierId = typeof body.tier_id === "string" ? body.tier_id : null
  const tierName =
    typeof body.tier_name === "string"
      ? body.tier_name.trim().slice(0, MAX_TIER_NAME_LENGTH)
      : ""
  if (!tierName) {
    return NextResponse.json(
      { error: "tier_name is required (e.g. 'VIP', 'General Admission')" },
      { status: 400 },
    )
  }
  const currentPrice =
    typeof body.current_price_thb === "number" && body.current_price_thb > 0
      ? Math.floor(body.current_price_thb)
      : null
  const currentQuantity =
    typeof body.current_quantity_total === "number" && body.current_quantity_total > 0
      ? Math.floor(body.current_quantity_total)
      : null

  // ---------- Gather context: the current event ----------

  const { data: event } = await supabase
    .from("fight_events")
    .select("name, event_date, venue_name, venue_city, venue_province, max_capacity")
    .eq("id", eventId)
    .single()

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  // Bout count + headliner record give the model a sense of card
  // strength, which is a real pricing signal (a stacked card with
  // veteran headliners commands more than a 4-bout undercard show).
  const { data: bouts } = await supabase
    .from("event_bouts")
    .select(`
      is_main_event,
      fighter_red:trainer_profiles!event_bouts_fighter_red_id_fkey ( fight_record_wins, fight_record_losses ),
      fighter_blue:trainer_profiles!event_bouts_fighter_blue_id_fkey ( fight_record_wins, fight_record_losses )
    `)
    .eq("event_id", eventId)

  const boutCount = bouts?.length ?? 0
  const mainEventCount = (bouts ?? []).filter((b) => b.is_main_event).length
  const cardSummary = (() => {
    if (boutCount === 0) return "No bouts on the card yet"
    const parts = [`${boutCount} bout${boutCount === 1 ? "" : "s"}`]
    if (mainEventCount > 0)
      parts.push(`${mainEventCount} main event${mainEventCount === 1 ? "" : "s"}`)
    return parts.join(" · ")
  })()

  // ---------- Gather context: comparable past events ----------
  //
  // Strategy: pull the most recent N events from this org PLUS any
  // events at the same venue (cross-org if applicable for shared
  // venues), then score each by similarity and trim to top K.
  // Score: same venue +3, same city +2, within 30 days same year +1,
  // within capacity ±50% +1.
  const { data: candidates } = await supabase
    .from("fight_events")
    .select(`
      id, name, event_date, venue_name, venue_city, max_capacity,
      event_tickets ( tier_name, price_thb, quantity_total, quantity_sold )
    `)
    .neq("id", eventId)
    .eq("org_id", auth.orgId)
    .order("event_date", { ascending: false })
    .limit(COMPARABLE_CANDIDATE_POOL)

  const comparables: ComparableEvent[] = []
  for (const ev of candidates ?? []) {
    const tiers = (ev.event_tickets ?? []) as Array<{
      tier_name: string | null
      price_thb: number | null
      quantity_total: number | null
      quantity_sold: number | null
    }>
    // Only count events that actually sold tickets — a draft with
    // zero sales is noise, not signal.
    const hasSales = tiers.some((t) => (t.quantity_sold ?? 0) > 0)
    if (!hasSales) continue

    for (const t of tiers) {
      if (!t.tier_name || !t.price_thb) continue
      const sold = t.quantity_sold ?? 0
      const total = t.quantity_total ?? 0
      if (sold === 0 && total === 0) continue
      const soldPct = total > 0 ? Math.round((sold / total) * 100) : 0
      comparables.push({
        event_name: ev.name,
        venue: ev.venue_name,
        city: ev.venue_city,
        date: ev.event_date,
        tier_name: t.tier_name,
        price_thb: t.price_thb,
        sold,
        quantity_total: total,
        sold_percent: soldPct,
        same_venue:
          !!event.venue_name && !!ev.venue_name && event.venue_name === ev.venue_name,
        same_city:
          !!event.venue_city && !!ev.venue_city && event.venue_city === ev.venue_city,
      })
    }
  }

  // Score + trim.
  const scored = comparables.map((c) => {
    let score = 0
    if (c.same_venue) score += 3
    if (c.same_city) score += 2
    // Tier-name similarity (lowercased substring match) is the
    // strongest signal for a same-tier comparable.
    const sameTierName =
      c.tier_name.toLowerCase().includes(tierName.toLowerCase()) ||
      tierName.toLowerCase().includes(c.tier_name.toLowerCase())
    if (sameTierName) score += 4
    return { c, score }
  })
  scored.sort((a, b) => b.score - a.score)
  const topComparables = scored.slice(0, COMPARABLE_SAMPLE_LIMIT).map((s) => s.c)

  // ---------- Build the prompt ----------

  const comparablesBlock = topComparables.length
    ? topComparables
        .map((c) => {
          const tags = [
            c.same_venue ? "SAME-VENUE" : null,
            c.same_city && !c.same_venue ? "SAME-CITY" : null,
          ]
            .filter(Boolean)
            .join(" ")
          const venue = c.venue ?? "unknown venue"
          const city = c.city ?? "unknown city"
          return `- ${c.event_name} @ ${venue} (${city}), ${c.date} — ${c.tier_name}: ฿${c.price_thb} × ${c.quantity_total} cap, sold ${c.sold} (${c.sold_percent}%) ${tags}`.trim()
        })
        .join("\n")
    : "(no comparable sold-out events in this org's history yet — cold-start)"

  const system = `You are a ticket pricing analyst for Muay Thai events in Thailand. You think in baht. You read comparable past sales like a market-maker reads order flow.

# How you reason about price

1. **Comparables first.** If we have past events at the same venue or in the same city, those are the strongest signal. Same-venue + same-tier-name + recent = high confidence. Cross-city or old = lower confidence.

2. **Sell-through percent matters more than absolute sold.** A 200-cap tier that sold 100% at ฿800 tells you ฿800 was UNDER-priced (would've sold more). A 1000-cap tier that sold 30% at ฿2000 tells you it was OVER-priced.

3. **Card strength informs ceiling.** A card with multiple main events + veteran fighters supports higher prices than a 4-bout undercard show. The event metadata below tells you what they're putting on.

4. **Tier name conventions** in Thailand:
   - "General Admission" / "GA" / "Standing" = cheapest, biggest quantity
   - "Premium" / "Reserved" = mid-tier seating
   - "VIP" / "Ringside" / "Cage-side" = highest, often near the ring with a table or drinks
   - "Sponsor" / "Table" = corporate, lowest quantity, highest price
   Use the tier_name to anchor the price level.

5. **Cold-start priors** — when there are NO comparable events in this org's history, use these Thai market reference points:
   - **Local gym fights (Pai, Chiang Mai outskirts, small Krabi):** GA ฿200-500, Premium ฿500-1000, VIP ฿1000-2000
   - **Tourist-heavy local venues (Pai, Koh Samui, Phuket):** GA ฿400-800, VIP ฿1500-3000 (tourists pay more)
   - **Bangkok local gym events:** GA ฿300-600, Premium ฿800-1500, VIP ฿1500-3500
   - **Stadium-class shows (Channel 7, Workpoint stadiums):** GA ฿500-1500, VIP ฿2000-5000
   - **Major / ONE / Lumpinee / Rajadamnern:** GA ฿1000-3000, VIP ฿5000-20,000
   These are GENERAL — adjust up if the card has multiple main events with strong records.

6. **Round prices sensibly.** Under ฿1000: round to nearest ฿50. Over ฿1000: round to nearest ฿100. Don't recommend ฿1273.

# Output rules

- Recommend the price you'd actually set if it were your event. No fence-sitting "somewhere between 1000 and 2000".
- If the promoter's current price is within 5% of your rec, use signal='on-target' even if you have a slight preference — don't churn their pricing for marginal gains.
- 'cold-start' signal is for confidence='low' AND zero comparables. Don't use 'cold-start' if you have comparables, even weak ones.
- Reasoning must cite the SPECIFIC inputs you used. Generic "based on market" is a fail.`

  const eventBlock = [
    `- ${event.name}`,
    `- ${event.event_date}${event.venue_name ? ` · ${event.venue_name}` : ""}${event.venue_city ? `, ${event.venue_city}` : ""}${event.venue_province ? `, ${event.venue_province}` : ""}`,
    event.max_capacity ? `- Venue capacity: ${event.max_capacity}` : null,
    `- Fight card: ${cardSummary}`,
  ]
    .filter(Boolean)
    .join("\n")

  const tierBlock = [
    `- Tier name: ${tierName}`,
    currentPrice ? `- Current/proposed price: ฿${currentPrice}` : "- No current price set",
    currentQuantity ? `- Current quantity: ${currentQuantity}` : "- No quantity set yet",
  ].join("\n")

  const userPrompt = `Recommend pricing for this ticket tier.

EVENT
${eventBlock}

TIER TO PRICE
${tierBlock}

COMPARABLE PAST EVENTS (same org, sorted by similarity)
${comparablesBlock}`

  // ---------- Call the model ----------

  let aiResult
  try {
    aiResult = await generateObject({
      model: MODEL_REASONING,
      schema: ResponseSchema,
      system,
      prompt: userPrompt,
      temperature: 0.3, // pricing is structured reasoning — keep it stable
    })
  } catch (err) {
    console.error("[pricing] AI call failed:", err)
    return NextResponse.json(
      { error: "The pricing oracle is having a moment. Try again in a sec." },
      { status: 502 },
    )
  }

  const rec = aiResult.object.recommendation

  // ---------- Server-side sanity check ----------
  // Claude occasionally returns wildly out-of-range prices; bound them
  // to a sane envelope (50 to 50k baht) before persistence + display.
  const safePrice = Math.max(MIN_PRICE, Math.min(50_000, rec.recommended_price_thb))

  // ---------- Persist + return ----------

  const { data: inserted, error: insErr } = await serviceSupabase
    .from("pricing_recommendations")
    .insert({
      event_id: eventId,
      tier_id: tierId,
      tier_name: tierName,
      recommended_price_thb: safePrice,
      recommended_quantity_total: rec.recommended_quantity_total,
      projected_sold: rec.projected_sold,
      confidence: rec.confidence,
      signal: rec.signal,
      reasoning: rec.reasoning,
      current_price_thb: currentPrice,
      current_quantity_total: currentQuantity,
      comparable_event_count: topComparables.length,
      prompt_version: PROMPT_VERSION,
      generated_by: auth.userId,
    })
    .select("id")
    .single()

  if (insErr) {
    if (insErr.code === "42P01") {
      return NextResponse.json(
        {
          error:
            "Pricing Oracle isn't set up yet. Apply migration 067-pricing-recommendations.sql and try again.",
        },
        { status: 503 },
      )
    }
    console.error("[pricing] persist failed:", insErr)
    return NextResponse.json(
      { error: "Couldn't save recommendation. Try again." },
      { status: 500 },
    )
  }

  return NextResponse.json({
    recommendation: {
      id: inserted.id,
      recommended_price_thb: safePrice,
      recommended_quantity_total: rec.recommended_quantity_total,
      projected_sold: rec.projected_sold,
      confidence: rec.confidence,
      signal: rec.signal,
      reasoning: rec.reasoning,
    },
    comparables: topComparables.map((c) => ({
      event_name: c.event_name,
      venue: c.venue,
      city: c.city,
      date: c.date,
      tier_name: c.tier_name,
      price_thb: c.price_thb,
      sold: c.sold,
      sold_percent: c.sold_percent,
    })),
    prompt_version: PROMPT_VERSION,
  })
}
