/**
 * Daily trial-nudge cron.
 *
 * Scheduled by vercel.json. Runs once a day. For each gym still on a
 * trial, sends:
 *   - "7 days left" email when trial_ends_at is 6–8 days away (window
 *     gives the cron some slack — even if the run misses a day we still
 *     catch every gym).
 *   - "1 day left" email when trial_ends_at is within ~24 hours and the
 *     7d email has been sent (or skipped).
 *   - "Trial ended" email when trial_ends_at has passed and we haven't
 *     already sent it.
 *
 * Idempotency comes from the trial_nudge_*_sent_at timestamps in
 * gym_subscriptions (added in 029-add-trial-nudge-tracking.sql).
 *
 * Auth:
 *   - Vercel cron requests carry `Authorization: Bearer ${CRON_SECRET}`.
 *     Set CRON_SECRET in Vercel env. Anything else returns 401.
 *   - Manual invocation (curl) also accepts the same Bearer token, so
 *     ops can trigger a run during testing.
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { Resend } from "resend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://muaythaipai.com"

function getServiceClient() {
  return createServiceClient()
}

type Stage = "7d" | "1d" | "expired"

type Subscription = {
  id: string
  org_id: string
  status: string
  trial_ends_at: string | null
  trial_nudge_7d_sent_at: string | null
  trial_nudge_1d_sent_at: string | null
  trial_nudge_expired_sent_at: string | null
}

const TEMPLATES: Record<
  Stage,
  (gymName: string) => { subject: string; html: string; text: string }
> = {
  "7d": (gymName) => ({
    subject: `${gymName} — 7 days left in your free trial 🐃`,
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:24px auto;color:#222;line-height:1.55">
<p style="font-size:24px;margin:0 0 8px">🐃</p>
<h1 style="font-size:22px;margin:0 0 12px;color:#111">A week left to try OckOck</h1>
<p style="margin:0 0 12px">You're 7 days away from the end of your free trial. Plenty of time to feel the magic — OckOck gets sharper every time you approve a draft, and your students remember the friendly receptionist who always answers.</p>
<p style="margin:0 0 12px">If you'd like to keep going past day 30, you can upgrade right from your dashboard:</p>
<p style="margin:16px 0">
  <a href="${SITE_URL}/admin" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px">Open my dashboard</a>
</p>
<p style="margin:0 0 12px;color:#666;font-size:13px">฿999/month. No hidden fees, no annual contract, cancel anytime.</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<p style="color:#999;font-size:12px;margin:0">Reply to this email if you have questions — a real human reads every reply.</p>
</div>`,
    text: `A week left in your free trial.

If you'd like to keep going past day 30, upgrade from your dashboard:
${SITE_URL}/admin

฿999/month. No hidden fees, cancel anytime.`,
  }),

  "1d": (gymName) => ({
    subject: `${gymName} — your trial ends tomorrow`,
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:24px auto;color:#222;line-height:1.55">
<p style="font-size:24px;margin:0 0 8px">⏰</p>
<h1 style="font-size:22px;margin:0 0 12px;color:#111">Tomorrow is the last day</h1>
<p style="margin:0 0 12px">Your free 30-day trial of MUAYTHAIPAI ends in about 24 hours. If you'd like to keep OckOck answering your students and the network listing live, upgrade now and there's no break in service.</p>
<p style="margin:16px 0">
  <a href="${SITE_URL}/admin" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px">Upgrade to keep OckOck running</a>
</p>
<p style="margin:0 0 12px;color:#666;font-size:13px">If you'd rather not upgrade, no worries — your data stays put for 30 days in case you change your mind.</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<p style="color:#999;font-size:12px;margin:0">Questions? Reply to this email.</p>
</div>`,
    text: `Your free trial ends in about 24 hours.

If you'd like to keep OckOck running, upgrade from your dashboard:
${SITE_URL}/admin

If not, your data stays for 30 days in case you change your mind.`,
  }),

  expired: (gymName) => ({
    subject: `${gymName} — your trial has ended`,
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:24px auto;color:#222;line-height:1.55">
<p style="font-size:24px;margin:0 0 8px">🐃</p>
<h1 style="font-size:22px;margin:0 0 12px;color:#111">Your trial has ended</h1>
<p style="margin:0 0 12px">The free 30 days are up. OckOck has paused on customer-facing channels until you reactivate, but everything you built — your services, hours, students, certs — is right where you left it.</p>
<p style="margin:16px 0">
  <a href="${SITE_URL}/admin" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px">Reactivate my gym</a>
</p>
<p style="margin:0 0 12px;color:#666;font-size:13px">฿999/month. Cancel anytime.</p>
<p style="margin:0 0 12px;color:#666;font-size:13px">No reactivation? Your data stays available for 30 more days, then we'll archive it. Reach out anytime — there's no time pressure.</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<p style="color:#999;font-size:12px;margin:0">Reply to this email if anything's off — we'd rather know than lose you quietly.</p>
</div>`,
    text: `Your free trial has ended.

Reactivate at ${SITE_URL}/admin — ฿999/month, cancel anytime.

Your data stays available for 30 more days if you need to think about it.`,
  }),
}

async function loadOwnerEmails(
  supabase: ReturnType<typeof getServiceClient>,
  orgId: string,
): Promise<{ orgName: string; emails: string[] }> {
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle()
  const orgName = (org?.name as string) || "Your gym"

  const { data: members } = await supabase
    .from("org_members")
    .select("users(email)")
    .eq("org_id", orgId)
    .eq("role", "owner")
    .eq("status", "active")

  const emails: string[] = []
  for (const m of members ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = (m as any).users
    const email = Array.isArray(u) ? u[0]?.email : u?.email
    if (typeof email === "string" && email.includes("@")) emails.push(email)
  }
  return { orgName, emails }
}

async function sendNudge(
  resend: Resend,
  fromAddress: string,
  emails: string[],
  template: { subject: string; html: string; text: string },
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0
  for (const to of emails) {
    try {
      const result = await resend.emails.send({
        from: fromAddress,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
      if (result.error) failed++
      else sent++
    } catch {
      failed++
    }
  }
  return { sent, failed }
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
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  // Pull every active trial subscription. Filtering down in JS is
  // simpler than four separate queries and the volume is small.
  const { data: subs } = await supabase
    .from("gym_subscriptions")
    .select(
      "id, org_id, status, trial_ends_at, trial_nudge_7d_sent_at, trial_nudge_1d_sent_at, trial_nudge_expired_sent_at",
    )
    .in("status", ["trial", "past_due"])

  const summary: Array<{
    org_id: string
    stage: Stage
    sent: number
    failed: number
  }> = []

  for (const sub of (subs ?? []) as Subscription[]) {
    if (!sub.trial_ends_at) continue
    const endsAt = new Date(sub.trial_ends_at).getTime()
    const daysLeft = (endsAt - now) / day

    let stage: Stage | null = null
    if (
      sub.status === "trial" &&
      daysLeft <= 8 &&
      daysLeft >= 6 &&
      !sub.trial_nudge_7d_sent_at
    ) {
      stage = "7d"
    } else if (
      sub.status === "trial" &&
      daysLeft <= 1.5 &&
      daysLeft > 0 &&
      !sub.trial_nudge_1d_sent_at
    ) {
      stage = "1d"
    } else if (daysLeft <= 0 && !sub.trial_nudge_expired_sent_at) {
      stage = "expired"
    }

    if (!stage) continue

    const { orgName, emails } = await loadOwnerEmails(supabase, sub.org_id)
    if (emails.length === 0) continue

    const tpl = TEMPLATES[stage](orgName)
    const result = await sendNudge(resend, fromAddress, emails, tpl)

    // Mark sent (even on partial failure — we'd rather not spam tomorrow).
    const stamp =
      stage === "7d"
        ? { trial_nudge_7d_sent_at: new Date().toISOString() }
        : stage === "1d"
          ? { trial_nudge_1d_sent_at: new Date().toISOString() }
          : { trial_nudge_expired_sent_at: new Date().toISOString() }
    await supabase.from("gym_subscriptions").update(stamp).eq("id", sub.id)

    summary.push({ org_id: sub.org_id, stage, sent: result.sent, failed: result.failed })
  }

  return NextResponse.json({
    ok: true,
    processed: subs?.length ?? 0,
    nudged: summary.length,
    summary,
  })
}
