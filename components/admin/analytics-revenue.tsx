"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Banknote,
  CreditCard,
  Receipt,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

const COLOR = {
  online: "#6366f1", // indigo
  cash: "#10b981", // emerald
  transfer: "#f59e0b", // amber
  other: "#a1a1aa", // zinc
  paid: "#10b981",
  pending: "#f59e0b",
  refunded: "#71717a",
  failed: "#ef4444",
} as const

const baht = (n: number) => `฿${Math.round(n).toLocaleString()}`

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" })
}

const tooltipStyle = {
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  color: "#fafafa",
  fontSize: 12,
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Wallet
  label: string
  value: string
  sub?: string
  accent: string
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>}
    </div>
  )
}

function DonutCard({
  title,
  description,
  data,
  valueFormatter,
}: {
  title: string
  description: string
  data: { name: string; value: number; fill: string }[]
  valueFormatter: (v: number) => string
}) {
  const slices = data.filter((d) => d.value > 0)
  const total = slices.reduce((s, d) => s + d.value, 0)
  return (
    <Card className="bg-neutral-900/50 border-neutral-800">
      <CardHeader className="pb-1">
        <CardTitle className="text-white text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {slices.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-neutral-600">
            No data for this period
          </div>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={2}
                  stroke="none"
                >
                  {slices.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => {
                    const v = Number(value)
                    const pct = total > 0 ? Math.round((v / total) * 100) : 0
                    return [`${valueFormatter(v)} · ${pct}%`, name]
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={24}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-neutral-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AnalyticsRevenue() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState<string>("all")

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

  const bucket: Bucket | null = useMemo(() => {
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

  const b = bucket ?? {
    bookings: 0,
    collectedThb: 0,
    outstandingThb: 0,
    online: { count: 0, thb: 0 },
    cash: { count: 0, thb: 0 },
    transfer: { count: 0, thb: 0 },
    other: { count: 0, thb: 0 },
    status: { paid: 0, pending: 0, refunded: 0, failed: 0 },
  }

  const methodData = [
    { name: "Online / card", value: b.online.thb, fill: COLOR.online },
    { name: "Cash", value: b.cash.thb, fill: COLOR.cash },
    { name: "Transfer", value: b.transfer.thb, fill: COLOR.transfer },
    { name: "Other", value: b.other.thb, fill: COLOR.other },
  ]
  const statusData = [
    { name: "Paid", value: b.status.paid, fill: COLOR.paid },
    { name: "Pending", value: b.status.pending, fill: COLOR.pending },
    { name: "Refunded", value: b.status.refunded, fill: COLOR.refunded },
    { name: "Failed", value: b.status.failed, fill: COLOR.failed },
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          icon={Receipt}
          label="Bookings"
          value={b.bookings.toLocaleString()}
          sub={`${b.status.paid} paid · ${b.status.pending} pending`}
          accent="#818cf8"
        />
        <KpiCard
          icon={Wallet}
          label="Collected"
          value={baht(b.collectedThb)}
          sub="paid in full"
          accent={COLOR.paid}
        />
        <KpiCard
          icon={CreditCard}
          label="Online / Stripe"
          value={baht(b.online.thb)}
          sub={`${b.online.count} payment${b.online.count === 1 ? "" : "s"}`}
          accent={COLOR.online}
        />
        <KpiCard
          icon={Banknote}
          label="Cash"
          value={baht(b.cash.thb)}
          sub={`${b.cash.count} payment${b.cash.count === 1 ? "" : "s"}`}
          accent={COLOR.cash}
        />
        <KpiCard
          icon={TrendingUp}
          label="Outstanding"
          value={baht(b.outstandingThb)}
          sub={`${b.status.pending} unpaid`}
          accent={COLOR.pending}
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
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff08" }} formatter={(value) => baht(Number(value))} />
                  <Legend formatter={(value) => <span className="text-xs text-neutral-300">{value}</span>} />
                  <Bar dataKey="Collected" fill={COLOR.paid} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Outstanding" fill={COLOR.pending} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
