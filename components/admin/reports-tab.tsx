"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Banknote,
  CreditCard,
  Wallet,
  Trophy,
  Users,
  TrendingUp,
  Award,
  GraduationCap,
  RefreshCw,
} from "lucide-react"

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

interface ReportData {
  cert_pipeline: Array<{
    id: string
    name: string
    icon: string
    enrolled: number
    issued_30d: number
    issued_all_time: number
  }>
  students: {
    total: number
    active_30d: number
    new_30d: number
    returning_30d: number
  }
  top_services: Array<{ name: string; bookings: number; revenue: number }>
  sparkline_30d: Array<{ date: string; bookings: number; paid: number }>
  top_trainers_30d: Array<{ id: string; name: string; signoffs: number }>
  services_count: number
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

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "amber",
}: {
  icon: typeof Users
  label: string
  value: string | number
  sub?: string
  tone?: "amber" | "emerald" | "orange" | "blue"
}) {
  const color =
    tone === "emerald"
      ? "text-emerald-400"
      : tone === "orange"
        ? "text-orange-400"
        : tone === "blue"
          ? "text-blue-400"
          : "text-amber-400"
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        {label}
      </div>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function ReportsTab({ analyticsBookings, todayDate }: ReportsTabProps) {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/reports")
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const weekStats = calculatePeriodStats(analyticsBookings, 7)
  const monthStats = calculatePeriodStats(analyticsBookings, 30)

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

  const sparklineMax = report
    ? Math.max(...report.sparkline_30d.map((d) => d.bookings), 1)
    : 1

  return (
    <div className="space-y-6">
      {/* Revenue cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RevenueCard title="Today" stats={todayStats} />
        <RevenueCard title="This Week" stats={weekStats} />
        <RevenueCard title="This Month" stats={monthStats} />
      </div>

      {/* Student growth + cert pipeline */}
      {report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={Users}
              label="Active students · 30d"
              value={report.students.active_30d}
              sub={`of ${report.students.total} total`}
              tone="emerald"
            />
            <StatCard
              icon={TrendingUp}
              label="New students · 30d"
              value={report.students.new_30d}
              tone="orange"
            />
            <StatCard
              icon={Users}
              label="Returning · 30d"
              value={report.students.returning_30d}
              sub="active and onboarded earlier"
              tone="blue"
            />
            <StatCard
              icon={Trophy}
              label="Certs · 30d"
              value={report.cert_pipeline.reduce((s, l) => s + l.issued_30d, 0)}
              sub={`of ${report.cert_pipeline.reduce((s, l) => s + l.issued_all_time, 0)} all time`}
              tone="amber"
            />
          </div>

          {/* Cert pipeline by level */}
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-400" />
                Cert Ladder Pipeline
              </CardTitle>
              <CardDescription>
                Active enrolments and certificates by level — last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {report.cert_pipeline.map((lvl) => {
                  const active =
                    lvl.enrolled > 0 ||
                    lvl.issued_30d > 0 ||
                    lvl.issued_all_time > 0
                  return (
                    <div
                      key={lvl.id}
                      className={`rounded border p-2.5 text-center ${
                        active
                          ? "border-orange-500/40 bg-orange-500/5"
                          : "border-neutral-800 bg-neutral-900/30"
                      }`}
                    >
                      <div
                        className={`text-2xl mb-1 ${active ? "" : "opacity-30 grayscale"}`}
                      >
                        {lvl.icon}
                      </div>
                      <p
                        className={`text-xs font-medium ${
                          active ? "text-white" : "text-neutral-500"
                        }`}
                      >
                        {lvl.name}
                      </p>
                      <div className="mt-2 space-y-0.5 text-[11px]">
                        {lvl.enrolled > 0 && (
                          <p className="text-amber-400 inline-flex items-center gap-0.5">
                            <Users className="h-2.5 w-2.5" /> {lvl.enrolled}
                          </p>
                        )}
                        {lvl.issued_30d > 0 && (
                          <p className="text-orange-400 inline-flex items-center gap-0.5">
                            <Trophy className="h-2.5 w-2.5" /> {lvl.issued_30d}
                            <span className="text-neutral-600 ml-0.5">/30d</span>
                          </p>
                        )}
                        {lvl.issued_30d === 0 && lvl.issued_all_time > 0 && (
                          <p className="text-neutral-500 text-[10px]">
                            {lvl.issued_all_time} all-time
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 30-day booking sparkline */}
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-400" />
                Bookings · last 30 days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-20">
                {report.sparkline_30d.map((d) => {
                  const h = Math.max(2, Math.round((d.bookings / sparklineMax) * 100))
                  const paidH = Math.max(
                    0,
                    Math.round((d.paid / sparklineMax) * 100)
                  )
                  return (
                    <div
                      key={d.date}
                      className="flex-1 min-w-0 relative"
                      title={`${d.date}: ${d.bookings} (${d.paid} paid)`}
                    >
                      <div
                        className="absolute inset-x-0 bottom-0 bg-neutral-700 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                      <div
                        className="absolute inset-x-0 bottom-0 bg-amber-500 rounded-t"
                        style={{ height: `${paidH}%` }}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-neutral-500">
                <span>{report.sparkline_30d[0]?.date}</span>
                <span>{report.sparkline_30d[report.sparkline_30d.length - 1]?.date}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Amber = paid · gray = unpaid
              </p>
            </CardContent>
          </Card>

          {/* Top services + top trainers */}
          <div className="grid gap-4 md:grid-cols-2">
            {report.top_services.length > 0 && (
              <Card className="bg-neutral-900/50 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-white text-base">
                    Top services · this month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.top_services.map((svc) => (
                      <li
                        key={svc.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-neutral-200 truncate">
                          {svc.name}
                        </span>
                        <span className="text-zinc-400 shrink-0 ml-3">
                          ฿{svc.revenue.toLocaleString()}{" "}
                          <span className="text-neutral-600">·</span>{" "}
                          {svc.bookings}×
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {report.top_trainers_30d.length > 0 && (
              <Card className="bg-neutral-900/50 border-neutral-800">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-orange-400" />
                    Top signoff productivity · 30d
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.top_trainers_30d.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-neutral-200 truncate">
                          {t.name}
                        </span>
                        <span className="text-amber-400 shrink-0 ml-3">
                          {t.signoffs} signoff
                          {t.signoffs === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Existing payment summary */}
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

      {!report && !loading && (
        <p className="text-xs text-neutral-500 text-center">
          Could not load extended reports.{" "}
          <button onClick={refresh} className="text-orange-400 underline">
            Try again
          </button>
        </p>
      )}
      {report && (
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs text-neutral-500 hover:text-white inline-flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      )}
    </div>
  )
}
