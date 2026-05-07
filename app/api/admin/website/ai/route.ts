/**
 * "Talk to OckOck and change your website" — the conversational editor.
 *
 * Flow:
 *  1. Operator types a request (e.g. "make my about section friendlier",
 *     "change my morning class to 7am", "add a testimonial from Khun Pong")
 *  2. We send the current website + recent conversation to Claude/GPT
 *     with a structured-output schema describing the actions it can take
 *  3. Apply the returned actions to the gym_websites row
 *  4. Log both turns + the actions to gym_website_ai_messages
 *  5. Return the updated website + the assistant's reply text
 *
 * Actions supported in v1:
 *  - update_section_props (change any prop on an existing section)
 *  - replace_section_text (rewrite a text-heavy section in a new tone)
 *  - add_section (append a new section to the end)
 *  - remove_section (delete a section by id)
 *  - reorder_sections (set the new order by id list)
 *  - update_theme (change colors, fonts, logo, etc.)
 *
 * v2 ideas: image generation, image upload from URL, multi-step plans.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "ai"
import { requireGymAdmin } from "@/lib/auth-helpers"
import { MODEL_VOICE } from "@/lib/ai-models"
import {
  newSectionId,
  type WebsiteSection,
  type WebsiteTheme,
} from "@/lib/website-sections"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const MODEL = MODEL_VOICE

const ActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("update_section_props"),
    section_id: z.string(),
    /** Sparse object — only the props to change. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: z.record(z.string(), z.any()),
  }),
  z.object({
    type: z.literal("replace_section_text"),
    section_id: z.string(),
    /** The whole new body text for that section. */
    body: z.string(),
  }),
  z.object({
    type: z.literal("add_section"),
    section_type: z.enum([
      "hero",
      "about",
      "hours",
      "contact",
      "classes",
      "trainers",
      "photos",
      "testimonials",
      "cta",
      "rich_text",
    ]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: z.record(z.string(), z.any()),
    position: z
      .enum(["start", "end"])
      .optional()
      .describe("Where to insert the new section (default: end)"),
  }),
  z.object({
    type: z.literal("remove_section"),
    section_id: z.string(),
  }),
  z.object({
    type: z.literal("reorder_sections"),
    /** New order of section IDs, all of them, no duplicates. */
    section_ids: z.array(z.string()),
  }),
  z.object({
    type: z.literal("update_theme"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    theme: z.record(z.string(), z.any()),
  }),
])

type Action = z.infer<typeof ActionSchema>

const ResponseSchema = z.object({
  reply: z
    .string()
    .describe(
      "1-3 sentence acknowledgement explaining what you did, in OckOck's friendly voice. Greet the operator like you're their teammate.",
    ),
  actions: z
    .array(ActionSchema)
    .describe(
      "Concrete edits to apply. Empty array if you couldn't determine the change or if the operator just asked a question.",
    ),
})

const BodySchema = z.object({
  message: z.string().min(1).max(2000),
  /** Optional client-side history. We also pull last N from DB. */
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
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
  const { message } = parsed.data

  // Pull current website
  const { data: website } = await supabase
    .from("gym_websites")
    .select("*")
    .eq("org_id", orgId)
    .single()

  if (!website) {
    return NextResponse.json(
      { error: "No website found — load /api/admin/website first" },
      { status: 404 },
    )
  }

  // Pull last 12 turns of history for context
  const { data: pastTurns } = await supabase
    .from("gym_website_ai_messages")
    .select("role, content")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(12)
  const historyAsc = (pastTurns ?? []).reverse()

  // Build the prompt
  const systemPrompt = `You are OckOck, the friendly AI assistant for Muay Thai gym owners. You help them edit their website by chatting in plain language. The operator's gym is "${website.org_id}".

Current website state (JSON):
${JSON.stringify(
  {
    status: website.status,
    sections: website.sections,
    theme: website.theme,
  },
  null,
  2,
)}

When the operator asks for a change, return:
- reply: a short, warm acknowledgement (1-3 sentences)
- actions: zero or more concrete edits

Section types you can work with: hero, about, hours, contact, classes, trainers, photos, testimonials, cta, rich_text.

Section ids are the existing ones in the JSON above — use those exactly when updating or removing. Don't invent ids.

If the operator asks something you can't do (image generation, custom code, complex layouts), say so warmly and suggest they contact support. Don't fabricate actions you can't execute.

If they're just asking a question (not a change), reply but return actions: [].`

  let aiResponse: { reply: string; actions: Action[] }
  try {
    const result = await generateObject({
      model: MODEL,
      schema: ResponseSchema,
      system: systemPrompt,
      messages: [
        ...historyAsc.map((t) => ({
          role: t.role as "user" | "assistant",
          content: t.content,
        })),
        { role: "user" as const, content: message },
      ],
    })
    aiResponse = result.object
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 502 },
    )
  }

  // Apply actions to the sections + theme
  let sections = (website.sections ?? []) as WebsiteSection[]
  let theme = (website.theme ?? {}) as WebsiteTheme

  for (const action of aiResponse.actions) {
    if (action.type === "update_section_props") {
      sections = sections.map((s) =>
        s.id === action.section_id
          ? ({ ...s, props: { ...s.props, ...action.props } } as WebsiteSection)
          : s,
      )
    } else if (action.type === "replace_section_text") {
      sections = sections.map((s) => {
        if (s.id !== action.section_id) return s
        // Most text-heavy sections store body in props.body. Update if present.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const props = { ...(s.props as any), body: action.body }
        return { ...s, props } as WebsiteSection
      })
    } else if (action.type === "add_section") {
      const newSection = {
        id: newSectionId(),
        type: action.section_type,
        props: action.props,
      } as WebsiteSection
      if (action.position === "start") {
        sections = [newSection, ...sections]
      } else {
        sections = [...sections, newSection]
      }
    } else if (action.type === "remove_section") {
      sections = sections.filter((s) => s.id !== action.section_id)
    } else if (action.type === "reorder_sections") {
      const lookup = new Map(sections.map((s) => [s.id, s]))
      const reordered = action.section_ids
        .map((id) => lookup.get(id))
        .filter((s): s is WebsiteSection => !!s)
      // Append any sections the AI forgot, so we never lose data
      const seen = new Set(action.section_ids)
      for (const s of sections) if (!seen.has(s.id)) reordered.push(s)
      sections = reordered
    } else if (action.type === "update_theme") {
      theme = { ...theme, ...(action.theme as WebsiteTheme) }
    }
  }

  // Persist the updated website
  let updatedWebsite = website
  if (aiResponse.actions.length > 0) {
    const { data: updated, error: updateErr } = await supabase
      .from("gym_websites")
      .update({ sections, theme })
      .eq("org_id", orgId)
      .select()
      .single()
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }
    if (updated) updatedWebsite = updated
  }

  // Log both turns
  await supabase.from("gym_website_ai_messages").insert([
    {
      org_id: orgId,
      user_id: user.id,
      role: "user",
      content: message,
    },
    {
      org_id: orgId,
      user_id: user.id,
      role: "assistant",
      content: aiResponse.reply,
      actions: aiResponse.actions,
    },
  ])

  return NextResponse.json({
    reply: aiResponse.reply,
    actions: aiResponse.actions,
    website: updatedWebsite,
  })
}

/**
 * GET /api/admin/website/ai → return last N turns for chat hydration
 */
export async function GET() {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const { data: turns } = await supabase
    .from("gym_website_ai_messages")
    .select("id, role, content, actions, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true })
    .limit(50)

  return NextResponse.json({ turns: turns ?? [] })
}
