/**
 * Campaign email sender — Resend wrapper for one personalized
 * campaign_send. Renders the operator-edited markdown body to a
 * minimal HTML wrapper, returns provider id or error.
 */

import { Resend } from "resend"
import { env, hasEnv } from "@/lib/env"

export interface CampaignEmailInput {
  to: string
  fromName?: string | null
  fromEmail?: string | null
  subject: string
  bodyMarkdown: string
}

export async function sendCampaignEmail(input: CampaignEmailInput): Promise<{
  ok: boolean
  provider_id?: string
  error?: string
}> {
  if (!hasEnv("RESEND_API_KEY")) {
    return { ok: false, error: "RESEND_API_KEY not set" }
  }

  const resend = new Resend(env.resend.apiKey())
  const fromName = input.fromName || "MUAYTHAIPAI Network"
  const fromEmail = input.fromEmail || "network@muaythaipai.com"

  const html = renderHtml(input.bodyMarkdown)

  try {
    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: input.to,
      subject: input.subject,
      html,
      text: input.bodyMarkdown,
    })
    if (result.error) {
      return { ok: false, error: result.error.message }
    }
    return { ok: true, provider_id: result.data?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Tiny markdown-to-HTML for outreach. Only handles paragraphs, line
 * breaks, **bold**, *italic*, and [text](url) links. Anything more
 * complex falls back to <pre> formatting safely. Output is wrapped
 * in our standard email shell.
 */
function renderHtml(md: string): string {
  const inner = md
    .split(/\n{2,}/)
    .map((para) => {
      const safe = escape(para.trim())
      const linked = safe
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          (_, text, url) => `<a href="${escape(url)}" style="color:#f97316;">${text}</a>`
        )
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br/>")
      return `<p style="margin:0 0 14px;line-height:1.6;color:#d4d4d4;">${linked}</p>`
    })
    .join("\n")

  return `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0a0a0a;color:#e7e5e4;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#171717;border:1px solid #292524;border-radius:12px;padding:32px;">
    ${inner}
  </div>
  <p style="text-align:center;color:#525252;font-size:12px;margin-top:24px;">
    MUAYTHAIPAI · Thailand's Muay Thai network
  </p>
</body></html>`
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
