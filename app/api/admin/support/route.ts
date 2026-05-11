/**
 * Support ticket submission from /admin (gym side).
 *
 * POST /api/admin/support
 *   body: { subject, body, source_url? }
 *
 * Flow:
 *   1. Auth check (gym admin/owner)
 *   2. AI classifies the message → {category, priority, summary, draft_reply}
 *      - Priority drives SLA target
 *      - Category drives routing/sorting
 *      - draft_reply lets the operator approve in one tap
 *   3. Find or create the gym's owner_assist chat group + a 'support' conversation
 *   4. Insert the ticket row with AI metadata
 *   5. Log the inbound message + AI draft reply to mtp_communication_log
 *      (draft_status='pending' so it appears in the standard inbox draft UI)
 *
 * GET /api/admin/support — gym admin sees their own tickets
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "ai"
import { requireGymAdmin } from "@/lib/auth-helpers"
import { ensureChatGroups } from "@/lib/chat/bootstrap"
import { MODEL_FAST, MODEL_VOICE } from "@/lib/ai-models"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const SLA_HOURS: Record<string, number> = {
  urgent: 1,
  high: 6,
  normal: 24,
  low: 72,
}

const BodySchema = z.object({
  subject: z.string().trim().min(2).max(200),
  body: z.string().trim().min(5).max(4000),
  source_url: z.string().trim().max(500).optional(),
})

const ClassificationSchema = z.object({
  category: z.enum(["billing", "setup", "feature", "bug", "urgent", "other"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  summary: z
    .string()
    .max(140)
    .describe(
      "One-sentence summary the operator sees in the queue. Plain language, no marketing fluff.",
    ),
  draft_reply: z
    .string()
    .describe(
      "First draft of a reply, in MUAYTHAIPAI's voice. Friendly, direct, helpful. Acknowledge the issue, give a concrete next step. 2-5 sentences. Sign off as 'Team MUAYTHAIPAI'.",
    ),
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
  const { subject, body, source_url } = parsed.data

  // Pull a bit of org context so the AI's draft is relevant
  const { data: org } = await supabase
    .from("organizations")
    .select("name, city")
    .eq("id", orgId)
    .single()

  // 1. Classify + draft via AI. Best-effort — if it fails, still create
  //    the ticket with safe defaults so the gym admin isn't blocked.
  let classification: z.infer<typeof ClassificationSchema> = {
    category: "other",
    priority: "normal",
    summary: subject.slice(0, 140),
    draft_reply:
      `Hi ${user.email?.split("@")[0] ?? "there"},\n\n` +
      `Thanks for reaching out — we got your message and we'll be back in touch within 24 hours.\n\n` +
      `Team MUAYTHAIPAI`,
  }

  try {
    const result = await generateObject({
      model: MODEL_VOICE,
      schema: ClassificationSchema,
      system: `You triage and reply to support requests for MUAYTHAIPAI, a SaaS for Muay Thai gyms. The message is from a gym owner or admin.

Platform context:
- Pricing: $29/mo per gym
- Features: bookings (Stripe + cash), trainer commissions, certificates (Naga-Garuda ladder), website builder with AI editor, social media composer, packages, waivers, lead capture
- Common issues: Stripe Connect setup, website not publishing, trainer commission rules, bulk student import, OckOck AI not responding

Categorize:
- billing: invoice, payment failed, refund, subscription, Stripe
- setup: onboarding, configuration, "how do I"
- feature: requesting a new feature
- bug: something broken or unexpected behavior
- urgent: revenue blocking, data loss, security
- other: anything else

Priority:
- urgent: bookings broken, payment failing, data loss, security incident
- high: feature broken (not blocking revenue)
- normal: setup question, configuration, feature ask
- low: nice-to-have, no rush

Draft a reply in MUAYTHAIPAI's voice — friendly, direct, helpful. Acknowledge their issue and give a concrete next step. Don't promise specific timelines. Sign off as "Team MUAYTHAIPAI". 2-5 sentences max.

Gym name: ${org?.name ?? "this gym"}${org?.city ? ` (${org.city})` : ""}`,
      prompt: `Subject: ${subject}\n\nBody:\n${body}`,
    })
    classification = result.object
  } catch (err) {
    console.error("[support/submit] AI classification failed:", err)
    // keep fallback
  }

  // 2. Find or create the owner_assist chat group (different from
  //    public_inbox which is for end-customers). support tickets live
  //    in owner_assist so they don't get mixed with website chat.
  let { data: group } = await supabase
    .from("mtp_chat_groups")
    .select("id")
    .eq("org_id", orgId)
    .eq("purpose", "owner_assist")
    .eq("is_active", true)
    .maybeSingle()

  if (!group) {
    await ensureChatGroups(supabase, orgId)
    const retry = await supabase
      .from("mtp_chat_groups")
      .select("id")
      .eq("org_id", orgId)
      .eq("purpose", "owner_assist")
      .eq("is_active", true)
      .maybeSingle()
    group = retry.data
  }
  if (!group) {
    return NextResponse.json(
      { error: "Chat infrastructure not set up — try again in a moment." },
      { status: 503 },
    )
  }

  // 3. Create a new conversation for this ticket. Each ticket = one thread.
  const threadId = `support:${orgId}:${Date.now()}`
  const { data: convo, error: convoErr } = await supabase
    .from("mtp_conversations")
    .insert({
      org_id: orgId,
      group_id: group.id,
      channel: "web",
      external_thread_id: threadId,
      status: "awaiting_human",
    })
    .select("id")
    .single()
  if (convoErr || !convo) {
    return NextResponse.json(
      { error: convoErr?.message ?? "Failed to create conversation" },
      { status: 500 },
    )
  }

  // 4. Compute SLA window from priority
  const slaHours = SLA_HOURS[classification.priority] ?? 24
  const sla_due_at = new Date(Date.now() + slaHours * 3600 * 1000).toISOString()

  // 5. Insert the ticket
  const { data: ticket, error: ticketErr } = await supabase
    .from("support_tickets")
    .insert({
      org_id: orgId,
      user_id: user.id,
      conversation_id: convo.id,
      subject,
      initial_body: body,
      source_url: source_url ?? null,
      category: classification.category,
      priority: classification.priority,
      ai_summary: classification.summary,
      sla_due_at,
      status: "open",
    })
    .select()
    .single()

  if (ticketErr) {
    return NextResponse.json({ error: ticketErr.message }, { status: 500 })
  }

  // 6. Log the inbound message + AI draft reply to the conversation log.
  //    The draft_status='pending' surfaces it in /platform-admin → Support
  //    with Approve / Edit buttons.
  const now = new Date().toISOString()
  await supabase.from("mtp_communication_log").insert([
    {
      org_id: orgId,
      conversation_id: convo.id,
      channel: "web",
      direction: "inbound",
      sender: user.email ?? user.id,
      body: `Subject: ${subject}\n\n${body}`,
      handled_by: null,
      draft_status: null,
      needs_review: true,
      metadata: {
        support_ticket: true,
        ticket_id: ticket.id,
        source_url: source_url ?? null,
      },
      created_at: now,
    },
    {
      org_id: orgId,
      conversation_id: convo.id,
      channel: "web",
      direction: "outbound",
      recipient: user.email ?? user.id,
      body: classification.draft_reply,
      handled_by: "ai",
      draft_status: "pending",
      needs_review: true,
      metadata: {
        support_ticket: true,
        ticket_id: ticket.id,
        ai_drafted: true,
      },
      created_at: new Date().toISOString(),
    },
  ])

  await supabase
    .from("mtp_conversations")
    .update({
      last_message_at: now,
      last_message_preview: `[${classification.priority}] ${subject}`.slice(0, 120),
      status: "awaiting_human",
    })
    .eq("id", convo.id)

  return NextResponse.json({
    ticket: {
      id: ticket.id,
      subject,
      category: classification.category,
      priority: classification.priority,
      sla_due_at,
      status: "open",
    },
  })
}

export async function GET() {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const { supabase, orgId } = auth

  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, category, priority, status, sla_due_at, ai_summary, created_at, resolved_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ tickets: data ?? [] })
}

// suppress unused-import linter for MODEL_FAST kept around for future
// classification optimizations
void MODEL_FAST
