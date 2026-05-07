"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, Sparkles, AlertTriangle, ArrowRight } from "lucide-react"

interface Subscription {
  status: string | null
  trial_ends_at: string | null
  current_period_end: string | null
  price_thb: number | null
}

interface TrialBannerProps {
  orgId: string
  subscription: Subscription | null
}

function daysBetween(future: string | null): number | null {
  if (!future) return null
  const ms = new Date(future).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

export default function TrialBanner({ orgId, subscription }: TrialBannerProps) {
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // No subscription row, or already active — nothing to show.
  if (!subscription) return null
  const status = subscription.status

  if (status === "active") return null

  const daysLeft = daysBetween(subscription.trial_ends_at)
  const isExpired =
    status === "past_due" ||
    status === "cancelled" ||
    (status === "trial" && (daysLeft ?? 0) <= 0)

  async function handleUpgrade() {
    setUpgrading(true)
    setError(null)
    try {
      const res = await fetch("/api/platform-admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          returnUrl:
            typeof window !== "undefined" ? window.location.href : "/admin",
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout")
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout")
      setUpgrading(false)
    }
  }

  // Expired / past-due — red banner with upgrade CTA.
  if (isExpired) {
    return (
      <div className="border-b border-red-500/20 bg-red-500/[0.06]">
        <div className="px-4 sm:px-5 py-3 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5 text-[13px] text-red-100">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold">Your free trial has ended</p>
              <p className="text-[12px] text-red-200/80 mt-0.5">
                Upgrade to keep OckOck answering customers, taking bookings,
                and issuing certificates.
              </p>
              {error && (
                <p className="text-[12px] text-red-300 mt-1">{error}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-400 px-3.5 py-2 text-[12px] font-semibold text-white disabled:opacity-50 shrink-0 transition-colors"
          >
            {upgrading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Upgrade now
          </button>
        </div>
      </div>
    )
  }

  // Active trial — restrained indigo banner.
  if (status === "trial") {
    const days = daysLeft ?? 0
    const urgent = days <= 7
    return (
      <div
        className={`border-b ${
          urgent
            ? "border-indigo-500/30 bg-gradient-to-r from-indigo-500/[0.10] to-indigo-500/[0.04]"
            : "border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.06] to-indigo-500/[0.02]"
        }`}
      >
        <div className="px-4 sm:px-5 py-2.5 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-[12px] text-indigo-100 min-w-0">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300 shrink-0" />
            <span className="min-w-0">
              <span className="font-semibold text-white">
                {days === 0
                  ? "Last day of your free trial"
                  : days === 1
                    ? "1 day left in your free trial"
                    : `${days} days left in your free trial`}
              </span>
              <span className="text-indigo-200/70 ml-1.5 hidden sm:inline">
                — ฿{subscription.price_thb ?? 999}/month after, no credit card
                needed yet.
              </span>
            </span>
            {error && <p className="text-[11px] text-red-300 ml-2">{error}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/pricing"
              className="text-[11px] text-indigo-200/70 hover:text-indigo-100 hidden sm:inline transition-colors"
            >
              See what&apos;s included
            </Link>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50 transition-colors"
            >
              {upgrading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ArrowRight className="h-3 w-3" />
              )}
              Upgrade
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
