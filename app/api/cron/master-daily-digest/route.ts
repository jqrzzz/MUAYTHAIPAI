/**
 * Master daily digest email.
 *
 * Sends every platform admin a morning summary of what happened across
 * the network in the last 24 hours, plus what's pending their attention.
 * Goal: the operator gets the gist + a deep link to /platform-admin/today
 * even if they don't open the dashboard. Reliable cadence for a solo
 * backpack operator running a Thailand-wide network.
 *
 * Sections:
 *   - Discovered last 24h (count + top cities)
 *   - Onboarded last 24h (new signed-up gyms)
 *   - Pending invites needing nudge
 *   - Pending discovered gyms with website but no extraction
 *   - Trials ending in 7 days
 *   - Cert signoffs + new certs across the network (24h)
 *
 * Recipients: every user with users.is_platform_admin = TRUE who has
 * an email. Usually one human (you).
 *
 * Auth: Vercel cron Bearer ${CRON_SECRET}, same as other crons.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://muaythaipai.com"
const DAY = 86400_000

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase credentials")
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

type DiscoveredRow = {
  id: string
  name: string
  city: string | null
  province: string | null
  status: string
}

type OrgRow = { id: string; name: string; city: string | null; created_at: string }

type SubRow = {
  org_id: string
  trial_ends_at: string | null
  status: string
  organizations: { name: string } | { name: string }[] | null
}

type CertRow = { id: string; level: string; issued_at: string }

async function loadDigestData(supabase: ReturnType<typeof getServiceClient>) {
  const now = Date.now()
  const ago = (days: number) => new Date(now - days * DAY).toISOString()

  const [
    discovered24h,
    onboarded24h,
    pendingInvites,
    needsExtraction,
    trialsSoon,
    certs24h,
  ] = await Promise.all([
    supabase
      .from("discovered_gyms")
      .select("id, name, city, province, status")
      .gte("created_at", ago(1))
      .order("created_at", { ascending: false }),
    supabase
      .from("organizations")
      .select("id, name, city, created_at")
      .gte("created_at", ago(1))
      .order("created_at", { ascending: false }),
    supabase
      .from("discovered_gyms")
      .select("id, name, city, province, status")
      .eq("status", "invited")
      .lt("invited_at", ago(7))
      .or(`last_nudged_at.is.null,last_nudged_at.lt.${ago(7)}`)
      .limit(20),
    supabase
      .from("discovered_gyms")
      .select("id, name, city, province, status")
      .not("website", "is", null)
      .is("last_extracted_at", null)
      .limit(20),
    supabase
      .from("gym_subscriptions")
      .select("org_id, trial_ends_at, status, organizations(name)")
      .eq("status", "trial")
      .gte("trial_ends_at", new Date(now).toISOString())
      .lte("trial_ends_at", ago(-7))
      .order("trial_ends_at", { ascending: true })
      .limit(20),
    supabase
      .from("certificates")
      .select("id, level, issued_at")
      .gte("issued_at", ago(1)),
  ])

  return {
    discovered24h: (discovered24h.data ?? []) as DiscoveredRow[],
    onboarded24h: (onboarded24h.data ?? []) as OrgRow[],
    pendingInvites: (pendingInvites.data ?? []) as DiscoveredRow[],
    needsExtraction: (needsExtraction.data ?? []) as DiscoveredRow[],
    trialsSoon: (trialsSoon.data ?? []) as SubRow[],
    certs24h: (certs24h.data ?? []) as CertRow[],
  }
}

function summary(d: Awaited<ReturnType<typeof loadDigestData>>): {
  itemCount: number
  attentionCount: number
} {
  return {
    itemCount:
      d.discovered24h.length +
      d.onboarded24h.length +
      d.certs24h.length,
    attentionCount:
      d.pendingInvites.length +
      d.needsExtraction.length +
      d.trialsSoon.length,
  }
}

function topCities(rows: DiscoveredRow[]): string {
  const byCity = new Map<string, number>()
  for (const r of rows) {
    const c = r.city || r.province || "Unknown"
    byCity.set(c, (byCity.get(c) ?? 0) + 1)
  }
  return [...byCity.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c, n]) => `${c} (${n})`)
    .join(", ") || "—"
}

function buildEmail(
  operatorName: string,
  d: Awaited<ReturnType<typeof loadDigestData>>,
): { subject: string; html: string; text: string } {
  const { itemCount, attentionCount } = summary(d)
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const subject = attentionCount > 0
    ? `🐃 Master briefing — ${attentionCount} item${attentionCount === 1 ? "" : "s"} need your tap`
    : `🐃 Master briefing — quiet night, ${itemCount} update${itemCount === 1 ? "" : "s"}`

  const linkBlock = `<p style="margin:20px 0">
  <a href="${SITE_URL}/platform-admin/today" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px">Open command center</a>
</p>`

  const sections: string[] = []

  if (d.discovered24h.length > 0) {
    sections.push(
      `<h3 style="font-size:14px;color:#222;margin:20px 0 6px">🆕 Discovered last 24h: ${d.discovered24h.length}</h3>
<p style="margin:0;color:#666;font-size:13px">Top cities: ${topCities(d.discovered24h)}</p>`,
    )
  }
  if (d.onboarded24h.length > 0) {
    const list = d.onboarded24h
      .slice(0, 5)
      .map((g) => `<li>${escapeHtml(g.name)}${g.city ? ` <span style="color:#888">— ${escapeHtml(g.city)}</span>` : ""}</li>`)
      .join("")
    sections.push(
      `<h3 style="font-size:14px;color:#222;margin:20px 0 6px">🎉 Newly onboarded: ${d.onboarded24h.length}</h3>
<ul style="margin:0;padding-left:20px;color:#444;font-size:13px">${list}</ul>`,
    )
  }
  if (d.pendingInvites.length > 0) {
    sections.push(
      `<h3 style="font-size:14px;color:#222;margin:20px 0 6px">⚠️ Pending invites needing nudge: ${d.pendingInvites.length}</h3>
<p style="margin:0;color:#666;font-size:13px">These were invited 7+ days ago and haven't claimed. Nudge or snooze from the briefing page.</p>`,
    )
  }
  if (d.needsExtraction.length > 0) {
    sections.push(
      `<h3 style="font-size:14px;color:#222;margin:20px 0 6px">📋 Gyms with website but no extraction: ${d.needsExtraction.length}</h3>
<p style="margin:0;color:#666;font-size:13px">Run a batch enrich from /platform-admin → Network to fill in services + contact info.</p>`,
    )
  }
  if (d.trialsSoon.length > 0) {
    const list = d.trialsSoon
      .slice(0, 5)
      .map((s) => {
        const orgName = Array.isArray(s.organizations)
          ? s.organizations[0]?.name
          : s.organizations?.name
        const days = s.trial_ends_at
          ? Math.ceil(
              (new Date(s.trial_ends_at).getTime() - Date.now()) / DAY,
            )
          : null
        return `<li>${escapeHtml(orgName ?? "—")} <span style="color:#888">— ${days != null ? `${days}d left` : "?"}</span></li>`
      })
      .join("")
    sections.push(
      `<h3 style="font-size:14px;color:#222;margin:20px 0 6px">⏰ Trials ending within 7 days: ${d.trialsSoon.length}</h3>
<ul style="margin:0;padding-left:20px;color:#444;font-size:13px">${list}</ul>`,
    )
  }
  if (d.certs24h.length > 0) {
    const byLevel = new Map<string, number>()
    for (const c of d.certs24h) {
      byLevel.set(c.level, (byLevel.get(c.level) ?? 0) + 1)
    }
    const breakdown = [...byLevel.entries()]
      .map(([l, n]) => `${l} (${n})`)
      .join(", ")
    sections.push(
      `<h3 style="font-size:14px;color:#222;margin:20px 0 6px">🏆 Certs issued network-wide (24h): ${d.certs24h.length}</h3>
<p style="margin:0;color:#666;font-size:13px">${breakdown}</p>`,
    )
  }

  if (sections.length === 0) {
    sections.push(
      `<p style="margin:20px 0;color:#666;font-size:13px">Quiet 24h — nothing new across the network. The discovery cron runs again tonight at 03:00 UTC.</p>`,
    )
  }

  const html = `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:24px auto;color:#222;line-height:1.55">
<p style="font-size:24px;margin:0 0 8px">🐃</p>
<h1 style="font-size:22px;margin:0 0 6px;color:#111">Master briefing</h1>
<p style="margin:0 0 4px;color:#666;font-size:13px">${dateLabel}${operatorName ? ` · ${escapeHtml(operatorName)}` : ""}</p>
<hr style="border:none;border-top:1px solid #eee;margin:18px 0">
${sections.join("")}
${linkBlock}
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<p style="color:#999;font-size:12px;margin:0">Reply to this email if anything's off — quiet days are fine, but if you expected activity and got nothing, something's wrong.</p>
</div>`

  const textParts: string[] = [`Master briefing — ${dateLabel}`]
  if (d.discovered24h.length) textParts.push(`Discovered last 24h: ${d.discovered24h.length} (top: ${topCities(d.discovered24h)})`)
  if (d.onboarded24h.length) textParts.push(`Newly onboarded: ${d.onboarded24h.length}`)
  if (d.pendingInvites.length) textParts.push(`Pending invites needing nudge: ${d.pendingInvites.length}`)
  if (d.needsExtraction.length) textParts.push(`Gyms needing AI extraction: ${d.needsExtraction.length}`)
  if (d.trialsSoon.length) textParts.push(`Trials ending in 7 days: ${d.trialsSoon.length}`)
  if (d.certs24h.length) textParts.push(`Certs issued (24h): ${d.certs24h.length}`)
  textParts.push(`\nOpen: ${SITE_URL}/platform-admin/today`)
  const text = textParts.join("\n")

  return { subject, html, text }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  const expected = process.env.CRON_SECRET
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 },
    )
  }
  const resend = new Resend(apiKey)
  const fromAddress =
    process.env.RESEND_FROM_ADDRESS ||
    "MUAYTHAIPAI <hello@paimuaythai.com>"

  const supabase = getServiceClient()

  // Recipients: every platform admin with an email.
  const { data: admins } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("is_platform_admin", true)

  const adminList = (admins ?? []).filter(
    (u): u is { id: string; email: string; full_name: string | null } =>
      typeof u.email === "string" && u.email.includes("@"),
  )

  if (adminList.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      note: "No platform admins with email addresses",
    })
  }

  const data = await loadDigestData(supabase)

  let sent = 0
  let failed = 0
  for (const admin of adminList) {
    const operatorName = admin.full_name?.split(" ")[0] || ""
    const email = buildEmail(operatorName, data)
    try {
      const result = await resend.emails.send({
        from: fromAddress,
        to: admin.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      })
      if (result.error) failed++
      else sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({
    ok: true,
    recipients: adminList.length,
    sent,
    failed,
    summary: summary(data),
  })
}
