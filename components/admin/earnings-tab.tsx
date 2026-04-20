"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DollarSign,
  TrendingUp,
  Loader2,
  Check,
  Clock,
  Info,
} from "lucide-react"

interface EarningsData {
  commissionRate: number
  stripeFeeInfo: {
    percent: number
    fixedUsd: number
    absorbedByPlatform: boolean
  }
  summary: {
    totalCollected: number
    totalCommission: number
    totalOwed: number
    totalStripeFees: number
    bookingCount: number
    months: number
  }
  monthly: Array<{
    month: string
    collected: number
    commission: number
    owed: number
    bookings: number
    stripeFees: number
  }>
  recentBookings: Array<{
    id: string
    customerName: string
    service: string
    amountUsd: number
    commissionUsd: number
    date: string
  }>
  payouts: Array<{
    id: string
    periodStart: string
    periodEnd: string
    amountUsd: number
    amountThb: number
    exchangeRate: number
    status: string
    paidAt: string | null
  }>
}

export default function EarningsTab() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/earnings?months=3")
        if (res.ok) {
          setData(await res.json())
        } else {
          setError("Failed to load earnings data")
        }
      } catch {
        setError("Network error loading earnings")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-neutral-400">
        {error || "No earnings data available"}
      </div>
    )
  }

  const { summary, monthly, recentBookings, payouts, commissionRate, stripeFeeInfo } = data

  return (
    <div className="space-y-6">
      {/* How fees work */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-neutral-300 space-y-1">
              <p className="font-medium text-white">How online booking fees work</p>
              <p>
                When a student books online, Stripe charges a processing fee
                (~{stripeFeeInfo.percent * 100}% + ${stripeFeeInfo.fixedUsd.toFixed(2)}).
                {stripeFeeInfo.absorbedByPlatform
                  ? " This fee is absorbed by the platform — it does NOT come out of your payout."
                  : ""}
              </p>
              <p>
                The platform takes a {commissionRate * 100}% commission on the total collected.
                You receive the remaining {(1 - commissionRate) * 100}%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold">${summary.totalCollected.toFixed(2)}</p>
                <p className="text-xs text-neutral-400">Total Collected ({summary.months}mo)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-400">${summary.totalOwed.toFixed(2)}</p>
                <p className="text-xs text-neutral-400">Your Earnings ({summary.months}mo)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <DollarSign className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xl font-bold">${summary.totalCommission.toFixed(2)}</p>
                <p className="text-xs text-neutral-400">Platform Fee ({commissionRate * 100}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly breakdown */}
      {monthly.length > 0 && (
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-400">Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthly.map((m) => {
                const monthLabel = new Date(m.month + "-01").toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
                return (
                  <div key={m.month} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{monthLabel}</p>
                      <p className="text-xs text-neutral-500">{m.bookings} bookings</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-sm text-neutral-400">
                        ${m.collected.toFixed(2)} collected
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-orange-400">-${m.commission.toFixed(2)} fee</span>
                        <span className="text-green-400 font-medium">= ${m.owed.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout history */}
      {payouts.length > 0 && (
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-400">Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payouts.map((p) => {
                const start = new Date(p.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                const end = new Date(p.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                    <div className="flex items-center gap-2">
                      {p.status === "paid" ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-400" />
                      )}
                      <div>
                        <p className="text-sm text-white">{start} - {end}</p>
                        {p.paidAt && (
                          <p className="text-xs text-neutral-500">
                            Paid {new Date(p.paidAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-400">${p.amountUsd.toFixed(2)}</p>
                      {p.amountThb > 0 && (
                        <p className="text-xs text-neutral-500">
                          ฿{p.amountThb.toLocaleString()} @ {p.exchangeRate}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent bookings */}
      {recentBookings.length > 0 && (
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-400">Recent Online Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-1.5 text-sm">
                  <div className="text-neutral-300">
                    <span>{new Date(b.date).toLocaleDateString()}</span>
                    <span className="text-neutral-500 mx-1.5">·</span>
                    <span>{b.customerName}</span>
                    <span className="text-neutral-500 mx-1.5">·</span>
                    <span className="text-neutral-400">{b.service}</span>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-green-400">${((b.amountUsd || 0) - (b.commissionUsd || 0)).toFixed(2)}</span>
                    <span className="text-neutral-600 text-xs ml-1">/ ${(b.amountUsd || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {summary.bookingCount === 0 && (
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="p-8 text-center">
            <DollarSign className="mx-auto mb-2 h-8 w-8 text-neutral-600" />
            <p className="text-neutral-400">No online bookings yet</p>
            <p className="text-sm text-neutral-500">Online booking earnings will appear here</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
