/**
 * Discovery invite email — sent when the platform admin invites a
 * discovered gym to claim their listing on MUAYTHAIPAI.
 *
 * Uses Resend if RESEND_API_KEY is configured. Otherwise no-ops and
 * the operator copies the link manually from the dashboard.
 */

import { Resend } from "resend"
import { env, hasEnv } from "@/lib/env"

export interface DiscoveryInviteEmail {
  to: string
  gymName: string
  inviteUrl: string
  city?: string | null
  province?: string | null
  fromName?: string
  fromAddress?: string
}

export async function sendDiscoveryInvite(data: DiscoveryInviteEmail): Promise<{
  sent: boolean
  reason?: string
  id?: string
}> {
  if (!hasEnv("RESEND_API_KEY")) {
    return { sent: false, reason: "RESEND_API_KEY not set" }
  }

  const resend = new Resend(env.resend.apiKey())
  const fromName = data.fromName || "MUAYTHAIPAI Network"
  const fromAddress = data.fromAddress || "network@muaythaipai.com"

  const subject = `You're invited to join the MUAYTHAIPAI network — ${data.gymName}`
  const locationLine = [data.city, data.province].filter(Boolean).join(", ")

  const text = `Sawadee from MUAYTHAIPAI,

We're building a country-wide network of Muay Thai gyms in Thailand and we'd love for ${data.gymName}${locationLine ? ` in ${locationLine}` : ""} to be part of it.

Joining gives you:
  • A free listing on the official certification platform
  • Booking, trainer, and student tools — 30-day trial, no card
  • Access to the Naga–Garuda national certification system
  • Visibility to traveling students moving between gyms

Claim your listing here:
${data.inviteUrl}

If you have any questions, just reply to this email.

— MUAYTHAIPAI Network`

  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0a0a0a;color:#e7e5e4;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#171717;border:1px solid #292524;border-radius:12px;padding:32px;">
    <h1 style="font-size:22px;color:#fff;margin:0 0 16px;">Sawadee — you're invited 🥊</h1>
    <p style="line-height:1.6;color:#d4d4d4;margin:0 0 12px;">
      We're building a country-wide network of Muay Thai gyms in Thailand
      and we'd love for <strong style="color:#fff;">${escape(data.gymName)}</strong>${
        locationLine ? ` in ${escape(locationLine)}` : ""
      } to be part of it.
    </p>
    <ul style="line-height:1.8;color:#d4d4d4;padding-left:18px;margin:16px 0;">
      <li>Free listing on the official certification platform</li>
      <li>Booking, trainer &amp; student tools — 30-day trial, no card</li>
      <li>Access to the Naga–Garuda national certification system</li>
      <li>Visibility to travelling students moving between gyms</li>
    </ul>
    <div style="margin:28px 0;text-align:center;">
      <a href="${escape(data.inviteUrl)}"
         style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;">
        Claim ${escape(data.gymName)}
      </a>
    </div>
    <p style="font-size:12px;color:#737373;margin:24px 0 0;line-height:1.6;">
      If the button doesn't work, copy and paste this URL:<br/>
      <span style="color:#a8a29e;word-break:break-all;">${escape(data.inviteUrl)}</span>
    </p>
  </div>
  <p style="text-align:center;color:#525252;font-size:12px;margin-top:24px;">
    MUAYTHAIPAI · Thailand's Muay Thai network
  </p>
</body></html>`

  try {
    const result = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: data.to,
      subject,
      html,
      text,
    })
    if (result.error) {
      return { sent: false, reason: result.error.message }
    }
    return { sent: true, id: result.data?.id }
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : String(err) }
  }
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
