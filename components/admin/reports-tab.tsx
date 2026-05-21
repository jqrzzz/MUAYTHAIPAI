"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Trophy,
  Users,
  TrendingUp,
  Award,
  GraduationCap,
  RefreshCw,
} from "lucide-react"
import AnalyticsRevenue from "@/components/admin/analytics-revenue"

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
}

const TONE_COLOR = {
  amber: "text-amber-400",
  emerald: "text-emerald-400",
  orange: "text-indigo-300",
  blue: "text-blue-400",
} as const

type Tone = keyof typeof TONE_COLOR

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
  tone?: Tone
}) {
  const color = TONE_COLOR[tone]
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

export default function ReportsTab(_props: ReportsTabProps) {
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

  const sparklineMax = report
    ? Math.max(...report.sparkline_30d.map((d) => d.bookings), 1)
    : 1

  return (
    <div className="space-y-6">
      {/* Revenue + bookings analytics — month-filterable, charted */}
      <AnalyticsRevenue />

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
                <Award className="h-5 w-5 text-indigo-300" />
                Cert Ladder Pipeline
              </CardTitle>
              <CardDescription>
                Active enrolments and certificates by level — last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
                          ? "border-indigo-500/40 bg-indigo-500/5"
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
                          <p className="text-indigo-300 inline-flex items-center gap-0.5">
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
                    <GraduationCap className="h-4 w-4 text-indigo-300" />
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

      {!report && !loading && (
        <p className="text-xs text-neutral-500 text-center">
          Could not load extended reports.{" "}
          <button onClick={refresh} className="text-indigo-300 underline">
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
