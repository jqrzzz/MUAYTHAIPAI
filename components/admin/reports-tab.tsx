"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Banknote, CreditCard, Wallet } from "lucide-react"

interface AnalyticsBooking {
  id: string
  booking_date: string
  payment_status: string
  payment_method: string | null
  payment_amount_thb: number | null
  payment_amount_usd: number | null
  payment_currency: string | null
}

interface ReportsTabProps {
  analyticsBookings: AnalyticsBooking[]
  todayDate: string
}

function calculatePeriodStats(bookings: AnalyticsBooking[], days: number) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split("T")[0]

  const periodBookings = bookings.filter((b) => b.booking_date >= cutoffStr)
  const paidBookings = periodBookings.filter((b) => b.payment_status === "paid")

  const cashBookings = paidBookings.filter((b) => b.payment_method === "cash")
  const cardBookings = paidBookings.filter(
    (b) => b.payment_method === "stripe" || b.payment_method === "card" || b.payment_currency === "USD",
  )

  const sum = (arr: AnalyticsBooking[]) => arr.reduce((s, b) => s + (b.payment_amount_thb || 0), 0)
  const sumUsd = (arr: AnalyticsBooking[]) => arr.reduce((s, b) => s + (b.payment_amount_usd || 0), 0)

  return {
    total: periodBookings.length,
    paid: paidBookings.length,
    cashCount: cashBookings.length,
    cardCount: cardBookings.length,
    cashRevenue: sum(cashBookings),
    cardRevenue: sumUsd(cardBookings),
  }
}

function RevenueCard({ title, stats }: { title: string; stats: ReturnType<typeof calculatePeriodStats> }) {
  const totalRevenue = stats.cashRevenue + stats.cardRevenue
  return (
    <Card className="bg-neutral-900/50 border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white">{title}</CardTitle>
        <CardDescription>{stats.total} bookings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold text-amber-400">฿{stats.cashRevenue.toLocaleString()}</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-400" />
              <span className="text-sm text-neutral-400">Cash</span>
            </div>
            <div className="text-right">
              <span className="text-green-400 font-medium">฿{stats.cashRevenue.toLocaleString()}</span>
              <span className="text-xs text-neutral-500 ml-2">({stats.cashCount})</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-neutral-400">Card</span>
            </div>
            <div className="text-right">
              <span className="text-blue-400 font-medium">$ {stats.cardRevenue.toLocaleString()}</span>
              <span className="text-xs text-neutral-500 ml-2">({stats.cardCount})</span>
            </div>
          </div>
        </div>
        {stats.paid > 0 && totalRevenue > 0 && (
          <div className="pt-2 border-t border-neutral-800">
            <div className="flex h-2 rounded-full overflow-hidden bg-neutral-800">
              <div
                className="bg-green-500"
                style={{ width: `${(stats.cashRevenue / totalRevenue) * 100}%` }}
              />
              <div
                className="bg-blue-500"
                style={{ width: `${(stats.cardRevenue / totalRevenue) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>{Math.round((stats.cashRevenue / totalRevenue) * 100)}% cash</span>
              <span>{Math.round((stats.cardRevenue / totalRevenue) * 100)}% card</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ReportsTab({ analyticsBookings, todayDate }: ReportsTabProps) {
  const weekStats = calculatePeriodStats(analyticsBookings, 7)
  const monthStats = calculatePeriodStats(analyticsBookings, 30)

  // Calculate "today" stats using todayDate
  const todayBookings = analyticsBookings.filter((b) => b.booking_date === todayDate)
  const todayPaid = todayBookings.filter((b) => b.payment_status === "paid")
  const todayCash = todayPaid.filter((b) => b.payment_method === "cash")
  const todayCard = todayPaid.filter((b) => b.payment_method === "stripe" || b.payment_method === "card")
  const sum = (arr: AnalyticsBooking[]) => arr.reduce((s, b) => s + (b.payment_amount_thb || 0), 0)
  const sumUsd = (arr: AnalyticsBooking[]) => arr.reduce((s, b) => s + (b.payment_amount_usd || 0), 0)
  const todayStats = {
    total: todayBookings.length,
    paid: todayPaid.length,
    cashCount: todayCash.length,
    cardCount: todayCard.length,
    cashRevenue: sum(todayCash),
    cardRevenue: sumUsd(todayCard),
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RevenueCard title="Today" stats={todayStats} />
        <RevenueCard title="This Week" stats={weekStats} />
        <RevenueCard title="This Month" stats={monthStats} />
      </div>

      {/* Summary */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="h-5 w-5 text-amber-400" />
            Payment Summary
          </CardTitle>
          <CardDescription>Last 30 days overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
              <p className="text-sm text-neutral-400">Total Revenue</p>
              <p className="text-2xl font-bold text-amber-400">฿{monthStats.cashRevenue.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
              <p className="text-sm text-neutral-400">Total Bookings</p>
              <p className="text-2xl font-bold text-white">{monthStats.total}</p>
            </div>
            <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
              <p className="text-sm text-neutral-400">Cash Payments</p>
              <p className="text-2xl font-bold text-green-400">{monthStats.cashCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
              <p className="text-sm text-neutral-400">Card Payments</p>
              <p className="text-2xl font-bold text-blue-400">{monthStats.cardCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
