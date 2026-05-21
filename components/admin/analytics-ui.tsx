"use client"

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Shared visual language for the gym + platform analytics surfaces, so the
// owner dashboard and the super-admin network view stay consistent.

export const CHART_COLORS = {
  online: "#6366f1", // indigo
  cash: "#10b981", // emerald
  transfer: "#f59e0b", // amber
  other: "#a1a1aa", // zinc
  paid: "#10b981",
  pending: "#f59e0b",
  refunded: "#71717a",
  failed: "#ef4444",
  // gym subscription states (platform view)
  trial: "#6366f1",
  active: "#10b981",
  past_due: "#ef4444",
  canceled: "#71717a",
  none: "#52525b",
  indigo: "#818cf8",
} as const

export const baht = (n: number) => `฿${Math.round(n).toLocaleString()}`

export function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" })
}

export const chartTooltipStyle = {
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  color: "#fafafa",
  fontSize: 12,
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  accent: string
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-bold text-white sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-neutral-500">{sub}</p>}
    </div>
  )
}

export function DonutCard({
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
                  contentStyle={chartTooltipStyle}
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
