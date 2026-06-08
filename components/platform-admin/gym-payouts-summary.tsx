"use client"

import { useCallback, useEffect, useState } from "react"
import { Banknote, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard, CHART_COLORS } from "@/components/admin/analytics-ui"

interface GymRow {
  gym: { id: string; name: string; slug: string | null }
  summary: {
    bookingCount: number
    totalCollectedUsd: number
    commissionUsd: number
    amountOwedUsd: number
  }
  payout: { status: string; paidAt: string | null } | null
}

interface PayoutsData {
  period: { label: string }
  gyms: GymRow[]
  totals: {
    totalCollectedUsd: number
    totalCommissionUsd: number
    totalOwedUsd: number
    totalBookings: number
    gymCount: number
  }
}

const usd = (n: number) =>
  `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatusPill({ status }: { status: string | undefined }) {
  const map: Record<string, { text: string; cls: string }> = {
    paid: { text: "Paid", cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20" },
    pending: { text: "Pending", cls: "bg-amber-500/10 text-amber-300 ring-amber-500/20" },
  }
  const v = (status && map[status]) || {
    text: "Owed",
    cls: "bg-neutral-500/10 text-neutral-300 ring-neutral-500/20",
  }
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ring-1 ${v.cls}`}>{v.text}</span>
}

export default function GymPayoutsSummary() {
  const [data, setData] = useState<PayoutsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/platform-admin/payouts")
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
      <div className="flex h-32 items-center justify-center text-sm text-neutral-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading gym payouts…
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="py-8 text-center text-sm text-neutral-400">
          Couldn&apos;t load gym payouts.{" "}
          <button onClick={refresh} className="text-indigo-300 underline">
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Owed to gyms</h2>
          <p className="text-xs text-neutral-500">
            Per gym, after 15% commission · {data.period.label}. Record payouts in the console.
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Banknote} label="Collected online" value={usd(data.totals.totalCollectedUsd)} sub="all gyms" accent={CHART_COLORS.online} />
        <KpiCard icon={Banknote} label="Commission" value={usd(data.totals.totalCommissionUsd)} sub="platform keeps" accent={CHART_COLORS.indigo} />
        <KpiCard icon={Banknote} label="Owed to gyms" value={usd(data.totals.totalOwedUsd)} sub={`${data.totals.gymCount} gym${data.totals.gymCount === 1 ? "" : "s"}`} accent={CHART_COLORS.pending} />
        <KpiCard icon={Banknote} label="Bookings" value={String(data.totals.totalBookings)} sub="online, this period" accent={CHART_COLORS.other} />
      </div>

      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader className="pb-1">
          <CardTitle className="text-white text-base">By gym</CardTitle>
          <CardDescription>Online card revenue settled to each gym</CardDescription>
        </CardHeader>
        <CardContent>
          {data.gyms.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-600">No online bookings this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-left text-[11px] uppercase tracking-wider text-neutral-500">
                    <th className="py-2 pr-3 font-medium">Gym</th>
                    <th className="py-2 px-3 text-right font-medium">Collected</th>
                    <th className="py-2 px-3 text-right font-medium">Commission</th>
                    <th className="py-2 px-3 text-right font-medium">Owed</th>
                    <th className="py-2 pl-3 text-right font-medium">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/70">
                  {data.gyms.map((g) => (
                    <tr key={g.gym.id}>
                      <td className="py-2.5 pr-3">
                        <span className="text-neutral-200">{g.gym.name}</span>
                        <span className="ml-2 text-xs text-neutral-600">
                          {g.summary.bookingCount} booking{g.summary.bookingCount === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-neutral-300">{usd(g.summary.totalCollectedUsd)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-neutral-500">{usd(g.summary.commissionUsd)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-medium text-white">{usd(g.summary.amountOwedUsd)}</td>
                      <td className="py-2.5 pl-3 text-right">
                        <StatusPill status={g.payout?.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
