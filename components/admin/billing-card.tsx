"use client"

/**
 * Billing card — surfaced inside the Settings tab.
 *
 * Shows the current subscription state (trial / active / cancelled / no
 * record yet) and exposes a "Manage subscription" button that POSTs to
 * /api/admin/subscription/portal and redirects to the Stripe Customer
 * Portal so the gym owner can update card, change plan, view invoices,
 * or cancel — without us having to build any of those flows ourselves.
 *
 * For gyms that don't have a Stripe customer yet (trial-only or pre-Stripe),
 * we collapse the button into a mailto so they have a path to upgrade.
 */
import { useEffect, useState } from "react"
import { CreditCard, ExternalLink, Loader2, Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SubData {
  status: "trial" | "active" | "cancelled" | "missing" | string
  trial_ends_at: string | null
  current_period_end: string | null
  days_remaining: number | null
  monthly_price_usd_cents: number | null
  has_stripe_customer: boolean
}

export default function BillingCard() {
  const [data, setData] = useState<SubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function openPortal() {
    setPortalLoading(true)
    setPortalError(null)
    try {
      const res = await fetch("/api/admin/subscription/portal", { method: "POST" })
      const json = await res.json()
      if (!res.ok || !json.url) {
        setPortalError(json.error || "Couldn't open billing portal")
        return
      }
      window.location.href = json.url
    } catch {
      setPortalError("Network error — try again")
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-neutral-600" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.status === "missing") {
    // No subscription row yet — legacy / manually onboarded gym.
    return (
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Billing
          </CardTitle>
          <CardDescription>No subscription on file</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-400 mb-3">
            We don&apos;t have a paid plan set up for your gym yet. To start a subscription, email us and we&apos;ll get you set up.
          </p>
          <Button asChild variant="outline" className="border-neutral-700 bg-transparent">
            <a href="mailto:hello@muaythaipai.com?subject=Start%20gym%20subscription">
              <Mail className="w-4 h-4 mr-2" /> hello@muaythaipai.com
            </a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isTrial = data.status === "trial"
  const isCancelled = data.status === "cancelled"
  const monthlyPrice =
    data.monthly_price_usd_cents != null
      ? `$${(data.monthly_price_usd_cents / 100).toFixed(2)}/mo`
      : null

  return (
    <Card className="bg-neutral-900/50 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> Billing
        </CardTitle>
        <CardDescription>Subscription and payment method</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatusTile
            label="Status"
            value={
              isTrial ? "Free trial" : isCancelled ? "Cancelled" : "Active"
            }
            tone={isCancelled ? "rose" : isTrial ? "indigo" : "emerald"}
          />
          {monthlyPrice && (
            <StatusTile label="Plan" value={monthlyPrice} tone="zinc" />
          )}
          {(data.trial_ends_at || data.current_period_end) && (
            <StatusTile
              label={isTrial ? "Trial ends" : "Renews"}
              value={
                new Date(
                  (isTrial ? data.trial_ends_at : data.current_period_end) || "",
                ).toLocaleDateString()
              }
              tone="zinc"
            />
          )}
        </div>

        {/* Action row */}
        {data.has_stripe_customer ? (
          <div>
            <Button
              onClick={openPortal}
              disabled={portalLoading}
              className="bg-indigo-500 hover:bg-indigo-400"
            >
              {portalLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Opening...</>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage subscription
                </>
              )}
            </Button>
            <p className="text-xs text-neutral-500 mt-2">
              Opens the secure Stripe portal — update card, view invoices, change plan, or cancel.
            </p>
            {portalError && (
              <p className="mt-2 text-xs text-red-400">{portalError}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Button asChild variant="outline" className="border-neutral-700 bg-transparent">
              <a href="mailto:hello@muaythaipai.com?subject=Start%20paid%20subscription">
                <Mail className="w-4 h-4 mr-2" />
                Start a paid plan
              </a>
            </Button>
            <p className="text-xs text-neutral-500">
              You&apos;re on a free trial. When you&apos;re ready to keep things going, email us and we&apos;ll set up billing.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "emerald" | "indigo" | "rose" | "zinc"
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "indigo"
        ? "text-indigo-300"
        : tone === "rose"
          ? "text-rose-300"
          : "text-zinc-200"
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</p>
      <p className={`mt-0.5 text-sm font-medium ${toneClass}`}>{value}</p>
    </div>
  )
}
