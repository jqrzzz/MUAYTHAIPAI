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
import { Building2, CheckCircle2, Receipt, RefreshCw, TrendingUp, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CHART_COLORS,
  DonutCard,
  KpiCard,
  baht,
  chartTooltipStyle,
  monthLabel,
} from "@/components/admin/analytics-ui"

interface GymRevenue {
  name: string
  slug: string
  status: string
  bookings: number
  collectedThb: number
}
interface NetworkData {
  totals: { gyms: number; activeGyms: number; bookings: number; collectedThb: number; outstandingThb: number }
  subStatus: Record<string, number>
  byGym: GymRevenue[]
  months: { month: string; collectedThb: number; bookings: number }[]
}

const SUB_LABEL: Record<string, string> = {
  trial: "Trial",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  cancelled: "Canceled",
  none: "No subscription",
}

function subColor(key: string): string {
  const normalized = key === "cancelled" ? "canceled" : key
  return (CHART_COLORS as Record<string, string>)[normalized] ?? CHART_COLORS.none
}

export default function NetworkAnalytics() {
  const [data, setData] = useState<NetworkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/platform-admin/analytics")
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
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading network analytics…
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="py-8 text-center text-sm text-neutral-400">
          Couldn&apos;t load network analytics.{" "}
          <button onClick={refresh} className="text-indigo-300 underline">
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  const { totals } = data
  const subData = Object.entries(data.subStatus).map(([k, v]) => ({
    name: SUB_LABEL[k] || k,
    value: v,
    fill: subColor(k),
  }))
  const topGyms = data.byGym.slice(0, 8).map((g) => ({
    name: g.name.length > 16 ? `${g.name.slice(0, 15)}…` : g.name,
    Collected: g.collectedThb,
  }))
  const trend = data.months.map((m) => ({ month: monthLabel(m.month), Collected: m.collectedThb }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Network analytics</h2>
          <p className="text-xs text-zinc-500">
            Across all {totals.gyms} gym{totals.gyms === 1 ? "" : "s"} on OckOck
          </p>
        </div>
        <button
          onClick={refresh}
          className="rounded-lg border border-neutral-700 p-1.5 text-neutral-400 hover:text-white"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard icon={Building2} label="Gyms" value={totals.gyms.toLocaleString()} sub={`${totals.activeGyms} active`} accent={CHART_COLORS.indigo} />
        <KpiCard icon={CheckCircle2} label="Active gyms" value={totals.activeGyms.toLocaleString()} accent={CHART_COLORS.active} />
        <KpiCard icon={Receipt} label="Bookings" value={totals.bookings.toLocaleString()} sub="network-wide" accent={CHART_COLORS.indigo} />
        <KpiCard icon={Wallet} label="Collected" value={baht(totals.collectedThb)} sub="across network" accent={CHART_COLORS.paid} />
        <KpiCard icon={TrendingUp} label="Outstanding" value={baht(totals.outstandingThb)} sub="unpaid" accent={CHART_COLORS.pending} />
      </div>

      {/* Subscription split + revenue by gym */}
      <div className="grid gap-4 md:grid-cols-2">
        <DonutCard
          title="Gyms by subscription"
          description="Where each gym sits in the funnel"
          data={subData}
          valueFormatter={(v) => `${v} gym${v === 1 ? "" : "s"}`}
        />
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader className="pb-1">
            <CardTitle className="text-white text-base">Revenue by gym</CardTitle>
            <CardDescription>Collected ฿, top gyms</CardDescription>
          </CardHeader>
          <CardContent>
            {topGyms.length === 0 ? (
              <div className="flex h-[240px] items-center justify-center text-sm text-neutral-600">No gyms yet</div>
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topGyms} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const v = Number(value)
                        return v >= 1000 ? `฿${Math.round(v / 1000)}k` : `฿${v}`
                      }}
                    />
                    <YAxis type="category" dataKey="name" width={92} tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "#ffffff08" }} formatter={(value) => baht(Number(value))} />
                    <Bar dataKey="Collected" fill={CHART_COLORS.online} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Network revenue trend */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader className="pb-1">
          <CardTitle className="text-white text-base">Network revenue by month</CardTitle>
          <CardDescription>Collected ฿ across all gyms</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-neutral-600">No bookings yet</div>
          ) : (
            <div className="h-[260px]">
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
                  <Bar dataKey="Collected" fill={CHART_COLORS.paid} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
