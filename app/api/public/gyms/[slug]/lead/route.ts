/**
 * POST /api/public/gyms/[slug]/lead
 *
 * Public lead-form endpoint for the website builder. Anonymous —
 * a visitor on /gyms/[slug] fills out the form and submits.
 *
 * Flow:
 *   1. Resolve org from slug + load gym knowledge
 *   2. Find or create a public_inbox group
 *   3. Create a 'web' conversation keyed by visitor email
 *   4. Log the inbound lead message (with structured contact info in metadata)
 *   5. Generate an AI draft reply in gym voice using FAQs/services context
 *   6. Insert the draft as outbound + draft_status='pending' + needs_review=true
 *      so it surfaces in /admin → Inbox with Approve/Reject buttons
 *   7. Update conversation last_message_at + status='awaiting_human'
 *
 * The form section component handles rate limiting on the client; we
 * also enforce a hard cap on body size + simple email format check
 * server-side to prevent obvious abuse.
 */
import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { z } from "zod"
import { generateText } from "ai"
import { ensureChatGroups } from "@/lib/chat/bootstrap"
import { loadGymKnowledge } from "@/lib/chat/knowledge"
import { MODEL_VOICE } from "@/lib/ai-models"
import { checkLimit, ipFromRequest } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const BodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(240),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1).max(2000),
  /** Optional — useful for analytics in v2 (which page they were on, etc.) */
  source_url: z.string().trim().max(500).optional(),
})

function getServiceClient() {
  return createServiceClient()
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  // Server-side rate limit — the form has client-side throttling but
  // that's trivial to bypass. 5 leads per IP per hour per gym caps a
  // bot while leaving plenty of headroom for legitimate visitors.
  const ip = ipFromRequest(request)
  const gate = await checkLimit({
    key: `lead:${slug}:${ip}`,
    max: 5,
    windowSeconds: 3600,
  })
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: 429, headers: gate.headers },
    )
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid form data", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { name, email, phone, message, source_url } = parsed.data

  const supabase = getServiceClient()

  // 1. Resolve org
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()

  if (!org) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  // 2. Find or create public_inbox group (self-heal for legacy gyms)
  let { data: group } = await supabase
    .from("mtp_chat_groups")
    .select("id")
    .eq("org_id", org.id)
    .eq("purpose", "public_inbox")
    .eq("is_active", true)
    .maybeSingle()

  if (!group) {
    await ensureChatGroups(supabase, org.id)
    const retry = await supabase
      .from("mtp_chat_groups")
      .select("id")
      .eq("org_id", org.id)
      .eq("purpose", "public_inbox")
      .eq("is_active", true)
      .maybeSingle()
    group = retry.data
  }

  if (!group) {
    return NextResponse.json(
      { error: "This gym hasn't finished setup yet — try again soon." },
      { status: 503 },
    )
  }

  // 3. Find or create conversation. Key on email so a visitor who fills
  //    out the form a second time gets threaded to the same conversation.
  const threadId = `lead:${email.toLowerCase()}`

  let { data: convo } = await supabase
    .from("mtp_conversations")
    .select("id")
    .eq("org_id", org.id)
    .eq("channel", "web")
    .eq("external_thread_id", threadId)
    .maybeSingle()

  if (!convo) {
    const { data: created, error: createErr } = await supabase
      .from("mtp_conversations")
      .insert({
        org_id: org.id,
        group_id: group.id,
        channel: "web",
        external_thread_id: threadId,
        status: "awaiting_human",
      })
      .select("id")
      .single()
    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }
    convo = created
  }

  const now = new Date().toISOString()

  // 4. Log the inbound lead. Body is human-readable; structured contact
  //    info goes in metadata for the inbox UI to surface later.
  const inboundBody =
    `New lead from ${name}\n` +
    `Email: ${email}` +
    (phone ? `\nPhone: ${phone}` : "") +
    (source_url ? `\nFrom: ${source_url}` : "") +
    `\n\n${message}`

  await supabase.from("mtp_communication_log").insert({
    org_id: org.id,
    conversation_id: convo.id,
    channel: "web",
    direction: "inbound",
    sender: email,
    body: inboundBody,
    handled_by: null,
    draft_status: null,
    needs_review: true, // surface to operator immediately
    metadata: {
      lead_form: true,
      name,
      email,
      phone: phone ?? null,
      source_url: source_url ?? null,
    },
    created_at: now,
  })

  // 5. Generate an AI draft reply. Best-effort — if the gateway is down
  //    or knowledge is missing, we still log a useful fallback so the
  //    operator can edit + send.
  let draftBody =
    `Hi ${name},\n\n` +
    `Thanks for reaching out to ${org.name}! We got your message and will get back to you within a day.\n\n` +
    `Train hard,\nThe ${org.name} team`

  try {
    const kb = await loadGymKnowledge(supabase, org.id)
    if (kb) {
      const knowledgeBlurb = [
        kb.orgName ? `Gym name: ${kb.orgName}` : "",
        kb.city ? `Location: ${kb.city}, Thailand` : "",
        kb.services?.length
          ? `Services we offer:\n${kb.services
              .slice(0, 8)
              .map(
                (s) =>
                  `- ${s.name}${s.price_thb ? ` (฿${s.price_thb})` : ""}${
                    s.description ? `: ${s.description.slice(0, 120)}` : ""
                  }`,
              )
              .join("\n")}`
          : "",
        kb.faqs?.length
          ? `Common FAQs:\n${kb.faqs
              .slice(0, 6)
              .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
              .join("\n\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n")

      const sys = `You are drafting a reply on behalf of ${org.name}, a Muay Thai gym in Thailand. The visitor just submitted a contact form on the gym's website.

Your reply should:
- Greet them by first name.
- Acknowledge their question warmly (1 sentence).
- If their question is about services, schedule, pricing, or location AND you have the answer in the knowledge below, answer it directly.
- If you don't have a confident answer, say "let me check with the team and get back to you within a day" — never make up specifics.
- Keep it under 6 sentences. Friendly, confident, a little gritty. Like a coach.
- Sign off as "The ${org.name} team" (or just first-person if it feels natural).
- No marketing fluff. No emojis unless natural. No bullet points.

The visitor will receive this reply by email after the gym owner approves it. Write it as a complete email body (no subject line).

Knowledge available:
${knowledgeBlurb || "(no extra knowledge — be honest about needing to check with the team)"}`

      const result = await generateText({
        model: MODEL_VOICE,
        system: sys,
        prompt: `Visitor name: ${name}\nVisitor email: ${email}\n\nTheir message:\n${message}\n\nWrite the reply.`,
      })

      if (result.text?.trim()) {
        draftBody = result.text.trim()
      }
    }
  } catch (err) {
    console.error("[public/lead] AI draft error:", err)
    // keep fallback draftBody
  }

  // 6. Log the AI draft. needs_review=true + draft_status='pending'
  //    surfaces it in /admin → Inbox with Approve/Reject inline.
  await supabase.from("mtp_communication_log").insert({
    org_id: org.id,
    conversation_id: convo.id,
    channel: "web",
    direction: "outbound",
    recipient: email,
    body: draftBody,
    handled_by: "ai",
    draft_status: "pending",
    needs_review: true,
    metadata: { lead_form: true, recipient_name: name },
    created_at: new Date().toISOString(),
  })

  // 7. Update the conversation
  await supabase
    .from("mtp_conversations")
    .update({
      status: "awaiting_human",
      last_message_at: now,
      last_message_preview: `New lead: ${name} — ${message.slice(0, 80)}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", convo.id)

  return NextResponse.json({ ok: true })
}
