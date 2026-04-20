"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DollarSign,
  TrendingUp,
  Users,
  Loader2,
  CreditCard,
  Banknote,
} from "lucide-react"

interface AnalyticsData {
  period: { days: number; since: string }
  summary: {
    totalBookings: number
    cashBookings: number
    onlineBookings: number
    totalCashThb: number
    totalOnlineUsd: number
    totalOnlineThb: number
  }
  daily: Array<{
    date: string
    cash_thb: number
    online_usd: number
    bookings: number
  }>
  gymPerformance: Array<{
    name: string
    cash_thb: number
    online_usd: number
    bookings: number
  }>
  studentSubscriptions: {
    active: number
    cancelled: number
    total: number
    mrr: number
  }
  gymSubscriptions: {
    active: number
    trial: number
    pastDue: number
    mrr: number
  }
}

export function PlatformAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/platform-admin/analytics?days=${days}`)
        if (res.ok) {
          setData(await res.json())
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [days])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (!data) return null

  const { summary, daily, gymPerformance, studentSubscriptions, gymSubscriptions } = data
  const maxDailyBookings = Math.max(...daily.map((d) => d.bookings), 1)
  const maxGymBookings = Math.max(...gymPerformance.map((g) => g.bookings), 1)

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Period:</span>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
              days === d
                ? "bg-orange-500 text-black font-bold"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Revenue summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  ${summary.totalOnlineUsd.toFixed(2)}
                </p>
                <p className="text-xs text-zinc-400">Online Revenue (USD)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Banknote className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  ฿{summary.totalCashThb.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-400">Cash Revenue (THB)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{summary.onlineBookings}</p>
                <p className="text-xs text-zinc-400">Online Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Banknote className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{summary.cashBookings}</p>
                <p className="text-xs text-zinc-400">Cash Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MRR */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Gym Subscriptions MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              ฿{gymSubscriptions.mrr.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {gymSubscriptions.active} active
              {gymSubscriptions.trial > 0 && ` · ${gymSubscriptions.trial} trial`}
              {gymSubscriptions.pastDue > 0 && (
                <span className="text-red-400"> · {gymSubscriptions.pastDue} past due</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Student Subscriptions MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              ฿{studentSubscriptions.mrr.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {studentSubscriptions.active} active
              {studentSubscriptions.cancelled > 0 &&
                ` · ${studentSubscriptions.cancelled} cancelled`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily bookings chart */}
      {daily.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">
              Daily Bookings — Last {days} Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-px h-32">
              {daily.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 min-w-0 group relative"
                >
                  <div
                    className="bg-orange-500/80 hover:bg-orange-400 rounded-t-sm transition-colors mx-px"
                    style={{
                      height: `${(d.bookings / maxDailyBookings) * 100}%`,
                      minHeight: d.bookings > 0 ? "4px" : "0",
                    }}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                    <div className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] whitespace-nowrap">
                      <p className="font-bold text-white">{d.date}</p>
                      <p className="text-zinc-400">{d.bookings} bookings</p>
                      {d.online_usd > 0 && (
                        <p className="text-green-400">${d.online_usd.toFixed(2)}</p>
                      )}
                      {d.cash_thb > 0 && (
                        <p className="text-amber-400">฿{d.cash_thb.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-zinc-600">
                {daily[0]?.date}
              </span>
              <span className="text-[10px] text-zinc-600">
                {daily[daily.length - 1]?.date}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-gym performance */}
      {gymPerformance.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">
              Gym Performance — Last {days} Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gymPerformance.map((gym) => (
                <div key={gym.name} className="flex items-center gap-3">
                  <div className="w-28 truncate text-sm text-zinc-300 shrink-0">
                    {gym.name}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500/80 rounded-full"
                        style={{
                          width: `${(gym.bookings / maxGymBookings) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 w-8 text-right shrink-0">
                      {gym.bookings}
                    </span>
                  </div>
                  <div className="text-right shrink-0 w-32">
                    {gym.online_usd > 0 && (
                      <span className="text-xs text-green-400 mr-2">
                        ${gym.online_usd.toFixed(2)}
                      </span>
                    )}
                    {gym.cash_thb > 0 && (
                      <span className="text-xs text-amber-400">
                        ฿{gym.cash_thb.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
