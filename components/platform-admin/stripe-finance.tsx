"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { CalendarClock, Clock, Landmark, RefreshCw, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CHART_COLORS, KpiCard, chartTooltipStyle } from "@/components/admin/analytics-ui"
import { convertUsdToThb } from "@/lib/payment-config"

interface Payout {
  id: string
  amountCents: number
  currency: string
  status: string
  automatic: boolean
  description: string | null
  arrivalDate: string | null
  created: string
}
interface FinanceData {
  configured: boolean
  currency?: string
  availableCents?: number
  pendingCents?: number
  payouts?: Payout[]
}

function money(cents: number, currency: string): string {
  const major = cents / 100
  if (currency === "usd") {
    return `$${major.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${major.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency.toUpperCase()}`
}

// Secondary THB estimate (only meaningful for the USD account, at the fixed
// charging rate).
function thbHint(cents: number, currency: string): string | undefined {
  if (currency !== "usd") return undefined
  return `≈฿${convertUsdToThb(cents).toLocaleString()}`
}

function shortDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  in_transit: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  pending: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  canceled: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  failed: "bg-red-500/15 text-red-300 ring-red-500/30",
}

export default function StripeFinance() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/platform-admin/stripe-finance")
      if (!res.ok) throw new Error("failed")
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading Stripe balance…
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="py-8 text-center text-sm text-neutral-400">
          Couldn&apos;t reach Stripe.{" "}
          <button onClick={refresh} className="text-indigo-300 underline">
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  if (!data.configured) {
    return (
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader className="pb-1">
          <CardTitle className="text-white text-base">Stripe payouts</CardTitle>
          <CardDescription>Real balance &amp; bank payouts</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-neutral-400">
          Stripe isn&apos;t configured in this environment. Add a live{" "}
          <code className="text-neutral-300">STRIPE_SECRET_KEY</code> to see your balance and the
          actual payouts Stripe sends to your bank.
        </CardContent>
      </Card>
    )
  }

  const currency = data.currency || "usd"
  const available = data.availableCents ?? 0
  const pending = data.pendingCents ?? 0
  const payouts = data.payouts ?? []
  const paid = payouts.filter((p) => p.status === "paid")
  const lastPaid = paid[0]
  const next = payouts.find((p) => p.status === "pending" || p.status === "in_transit")

  // Oldest → newest for the chart.
  const chart = [...payouts]
    .reverse()
    .filter((p) => p.status === "paid" || p.status === "in_transit")
    .map((p) => ({ date: shortDate(p.arrivalDate), Payout: p.amountCents / 100 }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Stripe payouts</h2>
          <p className="text-xs text-zinc-500">What Stripe has actually paid us, and when</p>
        </div>
        <button
          onClick={refresh}
          className="rounded-lg border border-neutral-700 p-1.5 text-neutral-400 hover:text-white"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Wallet} label="Available now" value={money(available, currency)} sub={thbHint(available, currency)} accent={CHART_COLORS.paid} />
        <KpiCard icon={Clock} label="In transit" value={money(pending, currency)} sub={thbHint(pending, currency)} accent={CHART_COLORS.pending} />
        <KpiCard
          icon={Landmark}
          label="Last payout"
          value={lastPaid ? money(lastPaid.amountCents, lastPaid.currency) : "—"}
          sub={lastPaid ? `arrived ${shortDate(lastPaid.arrivalDate)}` : "none yet"}
          accent={CHART_COLORS.online}
        />
        <KpiCard
          icon={CalendarClock}
          label="Next payout"
          value={next ? shortDate(next.arrivalDate) : "—"}
          sub={next ? money(next.amountCents, next.currency) : "none scheduled"}
          accent={CHART_COLORS.indigo}
        />
      </div>

      {/* Gross-balance honesty note — critical as more gyms onboard. */}
      <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-[12px] text-amber-200/90">
        This is the <span className="font-medium">gross</span> platform balance. Booking payments are
        collected here and later settled to gyms via Payouts, so it includes funds owed to gyms — it
        is not net profit.
      </p>

      {chart.length > 0 && (
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader className="pb-1">
            <CardTitle className="text-white text-base">Recent payouts</CardTitle>
            <CardDescription>Amount paid to your bank, by arrival date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#3f3f46" }} />
                  <YAxis
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const v = Number(value)
                      return currency === "usd" ? `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}` : `${v}`
                    }}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    cursor={{ fill: "#ffffff08" }}
                    formatter={(value) => money(Number(value) * 100, currency)}
                  />
                  <Bar dataKey="Payout" fill={CHART_COLORS.online} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader className="pb-1">
          <CardTitle className="text-white text-base">Payout history</CardTitle>
          <CardDescription>Most recent first, straight from Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="py-6 text-center text-sm text-neutral-600">No payouts yet</div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{money(p.amountCents, p.currency)}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {p.status === "paid" ? "Arrived" : "Expected"} {shortDate(p.arrivalDate)}
                      {p.automatic ? " · auto" : " · manual"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ${
                      STATUS_STYLE[p.status] || "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30"
                    }`}
                  >
                    {p.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
