/**
 * Owner AI — the private operator persona.
 *
 * Used from owner_assist chat groups (ScootScoot pattern: a LINE group
 * with the gym owner + the bot). Lets Wisarut (or any gym owner) run
 * day-to-day operations from chat without learning a new dashboard:
 *
 *   "what's on today?"
 *   "any unread messages?"
 *   "draft a reply to the German guy asking about private sessions"
 *   "show me this week's bookings"
 *
 * Unlike the concierge, owner AI:
 *   - Is bound to an authenticated user (mtp_chat_group_members.user_id is
 *     set, role in ('owner','admin')). The engine enforces this — a
 *     stranger posting into an owner_assist group gets dropped.
 *   - Answers in the operator's language (whatever they type in — Thai
 *     or English for Wisarut), no greeting formality.
 *   - Reads across the inbox, bookings, and (later) revenue / schedule.
 *   - Drafts replies to customers but never sends them autonomously —
 *     sends land in mtp_communication_log as draft_status='pending' and
 *     the owner approves via the web inbox (Wave 8d) or a one-tap
 *     confirm deeplink (also 8d).
 *
 * Scope in Wave 8c: read tools + draft_reply. Write actions (send,
 * refund, publish) ship in 8d behind the action-token deeplink.
 */

import { generateText, stepCountIs, tool } from "ai"
import type { SupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"
import { createActionToken } from "../actions/tokens"

export type OwnerAIHistoryEntry = {
  direction: "inbound" | "outbound"
  body: string
}

export type OwnerAIInput = {
  supabase: SupabaseClient
  orgId: string
  orgName: string
  /** The owner's users.id (bound via mtp_chat_group_members.user_id). */
  userId: string
  ownerDisplayName: string | null
  /** This conversation's id (the owner↔AI thread). */
  ownerConversationId: string
  userMessage: string
  history: OwnerAIHistoryEntry[]
  /** URLs of media the owner sent in this message (already stored in Supabase). */
  currentMediaUrls?: string[]
}

export type OwnerAIOutput = {
  replyText?: string
  escalated?: boolean
  needsReview?: boolean
  meta?: Record<string, unknown>
}

const MODEL = "openai/gpt-4o-mini"
const MAX_TOOL_STEPS = 6
const MAX_OUTPUT_TOKENS = 800

export async function runOwnerAI(input: OwnerAIInput): Promise<OwnerAIOutput> {
  const { supabase, orgId, orgName, ownerConversationId } = input

  const systemPrompt = buildOwnerSystemPrompt(input)

  const tools = {
    summarize_today: tool({
      description:
        "Get today's operational snapshot for the gym: new inbound inquiries, pending draft replies, today's bookings, unread threads. Use whenever the owner asks 'what's going on', 'what's today', 'status', or similar.",
      inputSchema: z.object({}),
      execute: async () => {
        const today = new Date()
        const todayStart = new Date(today)
        todayStart.setHours(0, 0, 0, 0)

        const [
          { data: todayBookings },
          { data: todayInbound },
          { data: pendingDrafts },
          { data: awaitingHuman },
        ] = await Promise.all([
          supabase
            .from("bookings")
            .select("id, booking_date, booking_time, status, guest_name, services(name)")
            .eq("org_id", orgId)
            .eq("booking_date", todayStart.toISOString().slice(0, 10))
            .order("booking_time", { ascending: true }),
          supabase
            .from("mtp_communication_log")
            .select("id, conversation_id, body, created_at, channel")
            .eq("org_id", orgId)
            .eq("direction", "inbound")
            .gte("created_at", todayStart.toISOString())
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("mtp_communication_log")
            .select("id, conversation_id, body, created_at")
            .eq("org_id", orgId)
            .eq("draft_status", "pending")
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("mtp_conversations")
            .select("id, channel, last_message_preview, last_message_at")
            .eq("org_id", orgId)
            .eq("status", "awaiting_human")
            .order("last_message_at", { ascending: false })
            .limit(20),
        ])

        return {
          bookings_today: (todayBookings ?? []).map((b: unknown) => {
            const row = b as {
              id: string
              booking_time: string | null
              status: string
              guest_name: string | null
              services: { name: string }[] | { name: string } | null
            }
            const serviceName = Array.isArray(row.services)
              ? row.services[0]?.name
              : row.services?.name
            return {
              id: row.id,
              time: row.booking_time,
              status: row.status,
              who: row.guest_name ?? "—",
              service: serviceName ?? "—",
            }
          }),
          inbound_today: (todayInbound ?? []).length,
          pending_drafts: (pendingDrafts ?? []).length,
          awaiting_human: (awaitingHuman ?? []).map((c: unknown) => {
            const row = c as {
              id: string
              channel: string
              last_message_preview: string | null
              last_message_at: string | null
            }
            return row
          }),
        }
      },
    }),

    list_pending_drafts: tool({
      description:
        "List draft replies the concierge has prepared for owner approval. Use when the owner asks 'what's pending', 'anything to approve', or wants to review drafts.",
      inputSchema: z.object({
        limit: z.number().min(1).max(20).default(10),
      }),
      execute: async ({ limit }) => {
        const { data } = await supabase
          .from("mtp_communication_log")
          .select(
            "id, conversation_id, body, created_at, mtp_conversations(id, channel, last_message_preview)",
          )
          .eq("org_id", orgId)
          .eq("draft_status", "pending")
          .order("created_at", { ascending: false })
          .limit(limit)
        return { count: data?.length ?? 0, drafts: data ?? [] }
      },
    }),

    get_conversation: tool({
      description:
        "Fetch the full message history of one conversation (thread) by id. Use before drafting a reply so you have the full context.",
      inputSchema: z.object({
        conversation_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(30),
      }),
      execute: async ({ conversation_id, limit }) => {
        const { data: convo } = await supabase
          .from("mtp_conversations")
          .select("id, channel, status, last_message_at, external_thread_id")
          .eq("id", conversation_id)
          .eq("org_id", orgId)
          .maybeSingle()
        if (!convo) return { error: "not_found" }

        const { data: messages } = await supabase
          .from("mtp_communication_log")
          .select("id, direction, body, created_at, handled_by, draft_status")
          .eq("conversation_id", conversation_id)
          .eq("org_id", orgId)
          .order("created_at", { ascending: true })
          .limit(limit)

        return { conversation: convo, messages: messages ?? [] }
      },
    }),

    search_conversations: tool({
      description:
        "Search recent conversations by free-text match on last_message_preview, or filter by status.",
      inputSchema: z.object({
        query: z.string().optional(),
        status: z.enum(["open", "awaiting_human", "closed"]).optional(),
        limit: z.number().min(1).max(20).default(10),
      }),
      execute: async ({ query, status, limit }) => {
        let q = supabase
          .from("mtp_conversations")
          .select("id, channel, status, last_message_preview, last_message_at")
          .eq("org_id", orgId)
          .order("last_message_at", { ascending: false })
          .limit(limit)
        if (status) q = q.eq("status", status)
        if (query) q = q.ilike("last_message_preview", `%${query}%`)
        const { data } = await q
        return { count: data?.length ?? 0, conversations: data ?? [] }
      },
    }),

    draft_reply: tool({
      description:
        "Compose a draft reply to send into another conversation (e.g. a visitor thread). The draft is saved with draft_status='pending' and awaits owner approval in the web inbox — it is NOT sent immediately. Returns the draft id for reference.",
      inputSchema: z.object({
        conversation_id: z
          .string()
          .uuid()
          .describe("The target conversation the draft replies to."),
        body: z
          .string()
          .min(1)
          .max(2000)
          .describe("The exact reply text to send (in the visitor's language)."),
      }),
      execute: async ({ conversation_id, body }) => {
        // Verify the target conversation belongs to this org (defense in
        // depth — the supabase client is service-role).
        const { data: convo } = await supabase
          .from("mtp_conversations")
          .select("id, channel")
          .eq("id", conversation_id)
          .eq("org_id", orgId)
          .maybeSingle()
        if (!convo) {
          return { ok: false, error: "conversation_not_found" }
        }

        const { data: draft, error } = await supabase
          .from("mtp_communication_log")
          .insert({
            org_id: orgId,
            conversation_id,
            channel: convo.channel,
            direction: "outbound",
            body,
            metadata: {
              drafted_by_owner_ai: true,
              proposed_in_conversation: ownerConversationId,
            },
            handled_by: "ai",
            needs_review: true,
            draft_status: "pending",
          })
          .select("id")
          .single()

        if (error || !draft) {
          return { ok: false, error: error?.message ?? "insert_failed" }
        }
        return {
          ok: true,
          draft_id: draft.id,
          note: "Saved as pending draft. Owner must approve via the inbox before it sends.",
        }
      },
    }),

    propose_send_draft: tool({
      description:
        "Propose sending a pending draft right now. Creates a single-use, time-limited confirmation link the owner can tap from chat to approve and send in one action. The draft does NOT send until the owner taps the link. Use right after draft_reply, or when the owner says 'send draft X' / 'approve the German one'.",
      inputSchema: z.object({
        draft_id: z
          .string()
          .uuid()
          .describe("Id of the pending draft (mtp_communication_log.id)."),
        preview: z
          .string()
          .min(1)
          .max(1000)
          .describe(
            "Short, human-readable description for the confirm page. Include the recipient's name or channel and a snippet of the reply.",
          ),
      }),
      execute: async ({ draft_id, preview }) => {
        // Confirm the draft exists and is pending for this org.
        const { data: draft } = await supabase
          .from("mtp_communication_log")
          .select("id, org_id, draft_status, direction")
          .eq("id", draft_id)
          .eq("org_id", orgId)
          .maybeSingle()
        if (!draft) return { ok: false, error: "draft_not_found" }
        if (draft.direction !== "outbound" || draft.draft_status !== "pending") {
          return { ok: false, error: "draft_not_pending" }
        }

        try {
          const token = await createActionToken({
            supabase,
            orgId,
            userId: input.userId,
            actionType: "send_pending_draft",
            params: { draft_id },
            preview,
            ttlMinutes: 15,
            proposedByConversation: ownerConversationId,
          })
          return {
            ok: true,
            confirm_url: token.deeplinkUrl,
            expires_at: token.expiresAt,
            note: "Share the confirm_url with the owner. Tapping it from a logged-in browser will send the draft.",
          }
        } catch (err) {
          return {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          }
        }
      },
    }),

    get_gym_context: tool({
      description:
        "Load the gym's details for content creation: name, location, description, services, prices. Call this before writing social media content so you include accurate info.",
      inputSchema: z.object({}),
      execute: async () => {
        const [{ data: org }, { data: services }] = await Promise.all([
          supabase
            .from("organizations")
            .select("name, city, province, description")
            .eq("id", orgId)
            .single(),
          supabase
            .from("services")
            .select("name, price_thb, category")
            .eq("org_id", orgId)
            .eq("is_active", true),
        ])
        return {
          gym: org ?? { name: input.orgName },
          services:
            services?.map((s: { name: string; price_thb: number; category: string }) => ({
              name: s.name,
              price: `฿${s.price_thb}`,
              category: s.category,
            })) ?? [],
        }
      },
    }),

    get_recent_media: tool({
      description:
        "Get URLs of images/videos the owner recently shared in this chat. Use when the owner mentions 'this photo', 'that picture', or wants to use a previously shared image for content.",
      inputSchema: z.object({
        limit: z.number().min(1).max(10).default(5),
      }),
      execute: async ({ limit }) => {
        const { data } = await supabase
          .from("mtp_communication_log")
          .select("id, metadata, created_at")
          .eq("conversation_id", ownerConversationId)
          .eq("direction", "inbound")
          .order("created_at", { ascending: false })
          .limit(limit * 3)

        const mediaUrls: { url: string; timestamp: string }[] = []
        for (const row of data ?? []) {
          const meta = row.metadata as Record<string, unknown> | null
          const urls = meta?.stored_media_urls
          if (Array.isArray(urls)) {
            for (const url of urls) {
              if (typeof url === "string") {
                mediaUrls.push({ url, timestamp: row.created_at })
              }
            }
          }
          if (mediaUrls.length >= limit) break
        }
        return { media: mediaUrls.slice(0, limit) }
      },
    }),

    save_social_post: tool({
      description:
        "Save a social media post to the content calendar. You write the caption and hashtags. The post saves as a draft the owner can review in Content Studio or approve to queue.",
      inputSchema: z.object({
        caption: z
          .string()
          .min(1)
          .max(2000)
          .describe("The post caption/text you composed"),
        hashtags: z
          .array(z.string())
          .default([])
          .describe("Hashtags without the # symbol"),
        platforms: z
          .array(z.string())
          .default(["instagram"])
          .describe("Target platforms: instagram, facebook, tiktok"),
        content_type: z
          .enum(["post", "story", "reel", "blog", "email"])
          .default("post"),
        media_url: z
          .string()
          .optional()
          .describe(
            "URL of attached image/video. Use a URL from currentMediaUrls or get_recent_media.",
          ),
        campaign: z.string().optional(),
      }),
      execute: async ({
        caption,
        hashtags,
        platforms,
        content_type,
        media_url,
        campaign,
      }) => {
        const { data: post, error } = await supabase
          .from("social_posts")
          .insert({
            org_id: orgId,
            created_by: input.userId,
            platform: platforms,
            content_type,
            caption,
            hashtags,
            media_url: media_url || null,
            status: "draft",
            campaign: campaign || null,
            ai_generated: true,
            ai_prompt: `Chat: ${input.userMessage.slice(0, 200)}`,
          })
          .select("id, status")
          .single()

        if (error) return { ok: false, error: error.message }
        return {
          ok: true,
          post_id: post.id,
          status: "draft",
          note: "Saved as draft. Owner can review in Content Studio or say 'queue it' to schedule.",
        }
      },
    }),

    list_social_posts: tool({
      description:
        "List recent social media posts from the content calendar. Use when the owner asks about their posts, content, or what's scheduled.",
      inputSchema: z.object({
        status: z.enum(["draft", "scheduled", "posted"]).optional(),
        limit: z.number().min(1).max(10).default(5),
      }),
      execute: async ({ status, limit }) => {
        let query = supabase
          .from("social_posts")
          .select(
            "id, platform, content_type, caption, status, created_at, campaign, media_url",
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(limit)

        if (status) query = query.eq("status", status)

        const { data } = await query
        return {
          count: data?.length ?? 0,
          posts: (data ?? []).map(
            (p: {
              id: string
              platform: string[]
              content_type: string
              caption: string
              status: string
              created_at: string
              campaign: string | null
              media_url: string | null
            }) => ({
              id: p.id,
              platforms: p.platform,
              type: p.content_type,
              caption_preview:
                p.caption.slice(0, 100) +
                (p.caption.length > 100 ? "..." : ""),
              status: p.status,
              has_media: !!p.media_url,
              campaign: p.campaign,
              created: p.created_at,
            }),
          ),
        }
      },
    }),
  }

  const messages = buildConversationMessages(input)

  try {
    const result = await generateText({
      model: MODEL,
      system: systemPrompt,
      messages,
      tools,
      stopWhen: stepCountIs(MAX_TOOL_STEPS),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.3, // operator mode — keep it crisp
    })

    const replyText = result.text?.trim()
    return {
      replyText: replyText || undefined,
      meta: {
        model: MODEL,
        steps: result.steps?.length ?? 0,
        usage: result.usage,
        owner_ai: true,
      },
    }
  } catch (err) {
    console.error("[chat/owner-ai] AI call failed:", err)
    return {
      replyText:
        "Owner AI is temporarily unavailable (AI gateway error). Your message has been logged; try again in a minute, or check the inbox directly.",
      needsReview: true,
      meta: {
        model: MODEL,
        error: err instanceof Error ? err.message : String(err),
        fallback: "owner_unavailable",
      },
    }
  }
}

function buildOwnerSystemPrompt(input: OwnerAIInput): string {
  const who = input.ownerDisplayName
    ? `You are assisting ${input.ownerDisplayName}`
    : "You are assisting the gym owner"

  const mediaNote =
    input.currentMediaUrls?.length
      ? `\n\n# Media just shared\nThe owner just sent ${input.currentMediaUrls.length} image(s):\n${input.currentMediaUrls.map((url, i) => `${i + 1}. ${url}`).join("\n")}\nYou can attach these to social posts via save_social_post's media_url field.`
      : ""

  return `You are the operator-side AI for ${input.orgName}. ${who}.

# Mode
Operator-mode, not hospitality. No "Sawadee", no emoji pageantry. Be crisp, useful, and honest. Reply in the owner's language (Thai or English, whichever they used last).

# Capabilities
- Inbox summary (today's inquiries, pending drafts, awaiting-human threads)
- Read a full conversation thread
- Search recent conversations by text or status
- Draft a reply to a visitor thread (draft-only)
- Propose sending a draft: creates a single-tap confirm link the owner opens in a browser
- Today's bookings
- Create social media content: write captions, pick hashtags, attach photos, save to Content Studio
- List and manage social media posts from the content calendar

# Content creation flow
When the owner wants to create a social media post:
1. If they sent a photo, you already have the URL (see Media section below). If they mention old photos, call get_recent_media.
2. Call get_gym_context to load gym details (services, location, etc.) for accurate content.
3. Write a compelling caption in the right style for the platform (Instagram: hashtags + line breaks, TikTok: short + punchy, Facebook: conversational).
4. Call save_social_post with the caption, hashtags, platforms, and media_url.
5. Show the owner what you created. They can say "queue it" or "change X" or check Content Studio.

When writing social media content:
- Authentic voice, never corporate or salesy
- Include a subtle call to action
- Reference real gym details (services, location, prices) from get_gym_context
- For Instagram: 3-8 relevant hashtags
- For TikTok: short, hook-first, under 150 chars main line
- For Facebook: conversational, 1-3 hashtags max

# Safety
- You never send customer replies directly. draft_reply stages the reply; propose_send_draft mints a confirm link; only the owner's tap actually sends it.
- Social posts save as drafts — never auto-publish. The owner reviews in Content Studio.
- If the owner asks you to do something you can't yet (refunds, publishing to social platforms, billing, schedule changes), tell them plainly and suggest the web console.
- Do not reveal other gyms' data. All tools are scoped to this org.
- If you don't know, say so. Don't invent numbers, names, or bookings.

# Sending a drafted reply (common flow)
1. Owner asks you to draft a reply.
2. Call draft_reply — get a draft_id back. Show the draft text to the owner.
3. If the owner says "send it" / "approve" / "ส่งเลย" / thumbs up, call propose_send_draft with that draft_id and a short preview.
4. Reply with the confirm_url so the owner can tap once in their browser.

# Output style
- Plain text suitable for a chat bubble.
- Short. The owner is on a phone.
- When you list items, use line breaks, not Markdown tables.
- When you draft something, quote the draft back to the owner for a final look before they approve in the inbox.${mediaNote}`
}

function buildConversationMessages(
  input: OwnerAIInput,
): Array<{ role: "user" | "assistant"; content: string }> {
  const recent = input.history.slice(-20)
  const messages: Array<{ role: "user" | "assistant"; content: string }> = []
  for (const entry of recent) {
    if (!entry.body) continue
    messages.push({
      role: entry.direction === "inbound" ? "user" : "assistant",
      content: entry.body,
    })
  }
  const last = messages[messages.length - 1]
  if (!last || last.role !== "user" || last.content !== input.userMessage) {
    messages.push({ role: "user", content: input.userMessage })
  }
  return messages
}
