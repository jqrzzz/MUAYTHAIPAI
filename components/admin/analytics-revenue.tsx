"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Banknote, CreditCard, Receipt, RefreshCw, TrendingUp, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CHART_COLORS,
  DonutCard,
  KpiCard,
  baht,
  chartTooltipStyle,
  monthLabel,
} from "@/components/admin/analytics-ui"

interface MethodSlot {
  count: number
  thb: number
}
interface Bucket {
  bookings: number
  collectedThb: number
  outstandingThb: number
  online: MethodSlot
  cash: MethodSlot
  transfer: MethodSlot
  other: MethodSlot
  status: { paid: number; pending: number; refunded: number; failed: number }
}
interface MonthBucket extends Bucket {
  month: string
}
interface Analytics {
  months: MonthBucket[]
  allTime: Bucket
}

const EMPTY: Bucket = {
  bookings: 0,
  collectedThb: 0,
  outstandingThb: 0,
  online: { count: 0, thb: 0 },
  cash: { count: 0, thb: 0 },
  transfer: { count: 0, thb: 0 },
  other: { count: 0, thb: 0 },
  status: { paid: 0, pending: 0, refunded: 0, failed: 0 },
}

export default function AnalyticsRevenue() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState("all")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/analytics")
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

  const bucket = useMemo<Bucket | null>(() => {
    if (!data) return null
    if (period === "all") return data.allTime
    return data.months.find((m) => m.month === period) ?? null
  }, [data, period])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-neutral-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading revenue…
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="py-8 text-center text-sm text-neutral-400">
          Couldn&apos;t load revenue analytics.{" "}
          <button onClick={refresh} className="text-indigo-300 underline">
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  const b = bucket ?? EMPTY

  const methodData = [
    { name: "Online / card", value: b.online.thb, fill: CHART_COLORS.online },
    { name: "Cash", value: b.cash.thb, fill: CHART_COLORS.cash },
    { name: "Transfer", value: b.transfer.thb, fill: CHART_COLORS.transfer },
    { name: "Other", value: b.other.thb, fill: CHART_COLORS.other },
  ]
  const statusData = [
    { name: "Paid", value: b.status.paid, fill: CHART_COLORS.paid },
    { name: "Pending", value: b.status.pending, fill: CHART_COLORS.pending },
    { name: "Refunded", value: b.status.refunded, fill: CHART_COLORS.refunded },
    { name: "Failed", value: b.status.failed, fill: CHART_COLORS.failed },
  ]
  const trend = data.months.map((m) => ({
    month: monthLabel(m.month),
    Collected: m.collectedThb,
    Outstanding: m.outstandingThb,
  }))

  return (
    <div className="space-y-5">
      {/* Period filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Revenue &amp; bookings</h2>
          <p className="text-xs text-neutral-500">
            {period === "all" ? "All time" : monthLabel(period)} · live from your bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="period" className="text-xs text-neutral-500">
            Period
          </label>
          <select
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All time</option>
            {[...data.months].reverse().map((m) => (
              <option key={m.month} value={m.month}>
                {monthLabel(m.month)}
              </option>
            ))}
          </select>
          <button
            onClick={refresh}
            className="rounded-lg border border-neutral-700 p-1.5 text-neutral-400 hover:text-white"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          icon={Receipt}
          label="Bookings"
          value={b.bookings.toLocaleString()}
          sub={`${b.status.paid} paid · ${b.status.pending} pending`}
          accent={CHART_COLORS.indigo}
        />
        <KpiCard icon={Wallet} label="Collected" value={baht(b.collectedThb)} sub="paid in full" accent={CHART_COLORS.paid} />
        <KpiCard
          icon={CreditCard}
          label="Online / Stripe"
          value={baht(b.online.thb)}
          sub={`${b.online.count} payment${b.online.count === 1 ? "" : "s"}`}
          accent={CHART_COLORS.online}
        />
        <KpiCard
          icon={Banknote}
          label="Cash"
          value={baht(b.cash.thb)}
          sub={`${b.cash.count} payment${b.cash.count === 1 ? "" : "s"}`}
          accent={CHART_COLORS.cash}
        />
        <KpiCard
          icon={TrendingUp}
          label="Outstanding"
          value={baht(b.outstandingThb)}
          sub={`${b.status.pending} unpaid`}
          accent={CHART_COLORS.pending}
        />
      </div>

      {/* Pies */}
      <div className="grid gap-4 md:grid-cols-2">
        <DonutCard
          title="Revenue by method"
          description="Where the collected money came from"
          data={methodData}
          valueFormatter={baht}
        />
        <DonutCard
          title="Bookings by payment status"
          description="Paid vs still owed"
          data={statusData}
          valueFormatter={(v) => `${v} booking${v === 1 ? "" : "s"}`}
        />
      </div>

      {/* Monthly trend */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader className="pb-1">
          <CardTitle className="text-white text-base">Collected vs outstanding by month</CardTitle>
          <CardDescription>Money in (paid) against money still owed (pending)</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-neutral-600">
              No bookings yet
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#3f3f46" }} />
                  <YAxis
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const v = Number(value)
                      return v >= 1000 ? `฿${Math.round(v / 1000)}k` : `฿${v}`
                    }}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "#ffffff08" }} formatter={(value) => baht(Number(value))} />
                  <Legend formatter={(value) => <span className="text-xs text-neutral-300">{value}</span>} />
                  <Bar dataKey="Collected" fill={CHART_COLORS.paid} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Outstanding" fill={CHART_COLORS.pending} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
