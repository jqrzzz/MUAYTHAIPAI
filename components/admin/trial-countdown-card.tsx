"use client"

/**
 * Trial countdown card — top of the admin Today tab.
 *
 * Shows the gym owner exactly where they stand: how many days are left
 * on the trial, what happens when it ends, and how to reach out about
 * keeping the lights on. We don't have self-serve checkout for gyms
 * yet (Big Dog handles billing manually), so the CTA is a mailto.
 *
 * Hidden when:
 *   - No subscription row exists (older gyms set up manually)
 *   - Status is "cancelled" (no point nagging)
 *   - Status is "active" AND > 14 days until renewal (not actionable)
 */
import { useEffect, useState } from "react"
import { Clock, Mail, CheckCircle2, AlertTriangle } from "lucide-react"

interface SubData {
  status: "trial" | "active" | "cancelled" | "missing" | string
  trial_ends_at: string | null
  current_period_end: string | null
  days_remaining: number | null
}

export default function TrialCountdownCard() {
  const [data, setData] = useState<SubData | null>(null)

  useEffect(() => {
    fetch("/api/admin/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  // Hide for gyms without a subscription record (legacy / manually
  // managed) and for cancelled gyms (already disengaged).
  if (data.status === "missing" || data.status === "cancelled") return null

  // Hide active gyms that aren't near renewal — they don't need the nag.
  if (
    data.status === "active" &&
    (data.days_remaining === null || data.days_remaining > 14)
  ) {
    return null
  }

  const isTrial = data.status === "trial"
  const days = data.days_remaining
  const urgent = days !== null && days <= 3
  const ended = days !== null && days <= 0
  const supportMail = `mailto:support@paimuaythai.com?subject=${encodeURIComponent(
    isTrial ? "Continue past free trial" : "Keep subscription active",
  )}`

  const accent = ended
    ? { border: "border-rose-500/40", bg: "bg-rose-500/10", text: "text-rose-300", icon: "text-rose-400" }
    : urgent
      ? { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-200", icon: "text-amber-400" }
      : isTrial
        ? { border: "border-indigo-500/30", bg: "bg-indigo-500/[0.06]", text: "text-indigo-100", icon: "text-indigo-300" }
        : { border: "border-emerald-500/30", bg: "bg-emerald-500/[0.06]", text: "text-emerald-100", icon: "text-emerald-300" }

  let headline: string
  let body: string
  if (isTrial && ended) {
    headline = "Your free trial has ended"
    body = "Reach out and we'll get you onto a paid plan. We won't shut anything off without talking to you first."
  } else if (isTrial && urgent) {
    headline = `${days} day${days === 1 ? "" : "s"} left on your free trial`
    body = "Keep the lights on past the trial — message support to set up billing. Your data + students stay put."
  } else if (isTrial) {
    headline = `${days} days left on your free trial`
    body = "You're in. Issue a few certs, get your roster moving, then we can talk about the right paid plan."
  } else {
    // Active, renewal within 14d
    headline = `Renewal in ${days} day${days === 1 ? "" : "s"}`
    body = "Subscription stays on automatically. Reach out if you want to upgrade, downgrade, or pause."
  }

  return (
    <div className={`rounded-xl border ${accent.border} ${accent.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${accent.bg} ${accent.icon} shrink-0`}
        >
          {ended ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : isTrial ? (
            <Clock className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className={`text-sm font-semibold ${accent.text}`}>{headline}</p>
            <a
              href={supportMail}
              className={`inline-flex items-center gap-1 text-[11px] ${accent.text} hover:underline`}
            >
              <Mail className="h-3 w-3" />
              support@paimuaythai.com
            </a>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">
            {body}
          </p>
          {(data.trial_ends_at || data.current_period_end) && (
            <p className="mt-1.5 text-[10px] text-zinc-600 tabular-nums">
              {isTrial && data.trial_ends_at && (
                <>Trial ends {new Date(data.trial_ends_at).toLocaleDateString()}</>
              )}
              {!isTrial && data.current_period_end && (
                <>Renews {new Date(data.current_period_end).toLocaleDateString()}</>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
