/**
 * send_announcement handler.
 *
 * The owner asks OckOck to "let everyone know morning class is cancelled
 * tomorrow" or "tell the Naga group about Saturday's seminar." OckOck
 * drafts the body, mints an action token, and shows the owner a
 * confirm-and-send link. Tap the link → this handler runs.
 *
 * params shape:
 *   {
 *     subject: string,        // 1-150 chars, used as email subject
 *     body: string,           // 1-4000 chars, plain text email body
 *     target: "all_students"  // For v1, targets every user who has ever
 *                             // booked with this gym. Future targets:
 *                             // "level:naga", "active_30d", etc.
 *   }
 *
 * On success:
 *   - Each recipient gets an email via Resend
 *   - One mtp_communication_log row per recipient (channel='web',
 *     direction='outbound', handled_by='ai', external_message_id =
 *     the Resend send id)
 *   - Returns a summary { sent, skipped, errors } so the confirm page
 *     can show "OckOck sent to 47 students. 2 skipped (no email)."
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import type { ActionHandler, ActionHandlerResult } from "../types"

// Cap so a runaway tool can't spam thousands at once. Larger blasts
// should land via campaigns infrastructure (lib/campaigns/...) which
// has rate limits + open-tracking.
const MAX_RECIPIENTS = 500

type Recipient = {
  user_id: string
  email: string
  full_name: string | null
}

async function loadRecipients(
  supabase: SupabaseClient,
  orgId: string,
  target: string,
): Promise<Recipient[]> {
  // v1: only "all_students" — every distinct user who has booked at
  // this gym at least once. Defensive de-dup since one user can have
  // many bookings.
  if (target !== "all_students") return []

  const { data: bookings } = await supabase
    .from("bookings")
    .select("user_id, users(id, email, full_name)")
    .eq("org_id", orgId)
    .not("user_id", "is", null)
    .limit(2000)

  const seen = new Set<string>()
  const out: Recipient[] = []
  for (const row of bookings ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = (row as any).users
    const u = Array.isArray(users) ? users[0] : users
    if (!u?.id || !u?.email || seen.has(u.id)) continue
    seen.add(u.id)
    out.push({ user_id: u.id, email: u.email, full_name: u.full_name ?? null })
    if (out.length >= MAX_RECIPIENTS) break
  }
  return out
}

export const sendAnnouncementHandler: ActionHandler = {
  type: "send_announcement",
  label: "Send announcement to students",

  async execute(
    supabase: SupabaseClient,
    params: Record<string, unknown>,
    context: { orgId: string; userId: string },
  ): Promise<ActionHandlerResult> {
    const subject = typeof params.subject === "string" ? params.subject : ""
    const body = typeof params.body === "string" ? params.body : ""
    const target =
      typeof params.target === "string" ? params.target : "all_students"

    if (!subject.trim() || subject.length > 150) {
      return { ok: false, error: "subject_invalid" }
    }
    if (!body.trim() || body.length > 4000) {
      return { ok: false, error: "body_invalid" }
    }

    // Look up the gym name for the email "from" + signature.
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", context.orgId)
      .maybeSingle()
    const gymName = (org?.name as string) || "Your gym"

    const recipients = await loadRecipients(supabase, context.orgId, target)
    if (recipients.length === 0) {
      return {
        ok: false,
        error: "no_recipients",
      }
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return { ok: false, error: "resend_not_configured" }
    }
    const resend = new Resend(apiKey)
    const fromAddress =
      process.env.RESEND_FROM_ADDRESS ||
      `${gymName} <hello@muaythaipai.com>`

    let sent = 0
    let failed = 0
    const sentAt = new Date().toISOString()
    const failures: string[] = []

    // Build a single shared HTML wrapper. Plain text fallback uses the
    // same body — OckOck's drafts are already plain text from the chat.
    const htmlBody = `<div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.55;color:#222;max-width:560px">
${body
  .split("\n")
  .map((line) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`)
  .join("")}
<p style="margin:24px 0 0;color:#888;font-size:12px">— ${escapeHtml(gymName)}</p>
</div>`

    for (const r of recipients) {
      try {
        const result = await resend.emails.send({
          from: fromAddress,
          to: r.email,
          subject,
          text: body,
          html: htmlBody,
        })
        if (result.error) {
          failed++
          failures.push(`${r.email}: ${result.error.message}`)
          continue
        }
        sent++
        // Best-effort logging: don't block on log insert failures.
        await supabase
          .from("mtp_communication_log")
          .insert({
            org_id: context.orgId,
            conversation_id: null,
            channel: "web",
            direction: "outbound",
            recipient: r.email,
            body: `[${subject}] ${body}`,
            metadata: {
              announcement: true,
              target,
              user_id: r.user_id,
              sent_by_user: context.userId,
              resend_id: result.data?.id,
            },
            handled_by: "ai",
            draft_status: "approved",
            needs_review: false,
            external_message_id: result.data?.id ?? null,
            created_at: sentAt,
          })
          .then(() => {})
      } catch (err) {
        failed++
        failures.push(
          `${r.email}: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }

    return {
      ok: true,
      result: {
        target,
        recipients: recipients.length,
        sent,
        failed,
        // Keep the failure list short — the confirm page just shows a
        // summary, the inbox carries the per-recipient log rows for audit.
        sample_failures: failures.slice(0, 5),
      },
    }
  },
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
