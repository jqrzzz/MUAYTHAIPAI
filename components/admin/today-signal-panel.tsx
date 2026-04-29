"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  Circle,
  Award,
  AlertTriangle,
  Trophy,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react"

interface ChecklistItem {
  id: string
  label: string
  tab: string
  done: boolean
  optional?: boolean
}

interface ChecklistData {
  items: ChecklistItem[]
  completed: number
  total: number
  percent: number
  is_complete: boolean
}

interface TodayData {
  cert_eligible: Array<{
    enrollment_id: string
    user_id: string
    name: string | null
    email: string
    level: string
    signed_off: number
    total: number
  }>
  stuck: Array<{
    enrollment_id: string
    user_id: string
    name: string | null
    email: string
    level: string
    signed_off: number
    total: number
    last_signoff_at: string | null
    days_inactive: number
  }>
  active_enrollments: number
  recent_signoffs: Array<{
    id: string
    student: string
    level: string
    skill_index: number
    signed_off_at: string
  }>
  recent_certs: Array<{
    id: string
    student: string
    level: string
    certificate_number: string | null
    issued_at: string
  }>
}

export default function TodaySignalPanel({
  onNavigate,
}: {
  onNavigate?: (tab: string) => void
}) {
  const [checklist, setChecklist] = useState<ChecklistData | null>(null)
  const [today, setToday] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showChecklist, setShowChecklist] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [c, t] = await Promise.all([
        fetch("/api/admin/setup-checklist").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/admin/today").then((r) => (r.ok ? r.json() : null)),
      ])
      setChecklist(c)
      setToday(t)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  if (loading && !checklist && !today) {
    return null // Don't flash above the booking list
  }

  const showSetup =
    checklist && !checklist.is_complete && showChecklist && checklist.total > 0
  const hasCertSignals =
    today &&
    (today.cert_eligible.length > 0 ||
      today.stuck.length > 0 ||
      today.recent_certs.length > 0 ||
      today.recent_signoffs.length > 0)

  if (!showSetup && !hasCertSignals) return null

  return (
    <div className="space-y-3">
      {showSetup && checklist && (
        <Card className="border-orange-700/40 bg-orange-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                <p className="text-sm font-semibold text-white">
                  Finish setting up your gym
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-orange-200">
                  {checklist.completed}/{checklist.total}
                </span>
                <button
                  onClick={() => setShowChecklist(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Hide
                </button>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden mb-3">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${checklist.percent}%` }}
              />
            </div>
            <ul className="space-y-1.5">
              {checklist.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate?.(item.tab)}
                    className="w-full text-left flex items-center gap-2 text-sm hover:bg-zinc-900/40 rounded px-1.5 py-1 -mx-1.5"
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-zinc-500 shrink-0" />
                    )}
                    <span
                      className={
                        item.done ? "text-zinc-500 line-through" : "text-zinc-100"
                      }
                    >
                      {item.label}
                    </span>
                    {item.optional && (
                      <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                        optional
                      </span>
                    )}
                    {!item.done && (
                      <ChevronRight className="h-3 w-3 ml-auto text-zinc-500" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {today && today.cert_eligible.length > 0 && (
        <Card className="border-emerald-700/40 bg-emerald-900/15">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-400" />
              <p className="text-sm font-semibold text-white">
                {today.cert_eligible.length} student
                {today.cert_eligible.length === 1 ? "" : "s"} ready for
                certificate
              </p>
            </div>
            <p className="text-xs text-emerald-200/80">
              All required skills signed off — issue the cert when you&apos;re
              ready.
            </p>
            <ul className="space-y-1">
              {today.cert_eligible.slice(0, 5).map((e) => (
                <li
                  key={e.enrollment_id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-emerald-100 truncate">
                    {e.name || e.email}
                    <span className="text-zinc-500"> · </span>
                    <span className="capitalize">{e.level}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate?.("certificates")}
                    className="border-emerald-700/40 text-emerald-200 h-7 text-xs"
                  >
                    Issue
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </li>
              ))}
              {today.cert_eligible.length > 5 && (
                <li className="text-xs text-zinc-500">
                  +{today.cert_eligible.length - 5} more
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {today && today.stuck.length > 0 && (
        <Card className="border-amber-700/40 bg-amber-900/10">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-semibold text-white">
                {today.stuck.length} enrolment
                {today.stuck.length === 1 ? "" : "s"} stalled (14+ days)
              </p>
            </div>
            <ul className="space-y-1">
              {today.stuck.slice(0, 5).map((s) => (
                <li
                  key={s.enrollment_id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-amber-100 truncate">
                    {s.name || s.email}
                    <span className="text-zinc-500"> · </span>
                    <span className="capitalize">{s.level}</span>
                    <span className="text-zinc-500">
                      {" "}
                      · {s.signed_off}/{s.total}
                    </span>
                  </span>
                  <span className="text-xs text-zinc-500 shrink-0">
                    {s.days_inactive}d
                  </span>
                </li>
              ))}
              {today.stuck.length > 5 && (
                <li className="text-xs text-zinc-500">
                  +{today.stuck.length - 5} more
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {today &&
        (today.recent_signoffs.length > 0 || today.recent_certs.length > 0) && (
          <div className="grid gap-3 md:grid-cols-2">
            {today.recent_signoffs.length > 0 && (
              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <p className="text-xs uppercase tracking-wider text-zinc-400">
                      Recent signoffs · last 7d
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {today.recent_signoffs.slice(0, 5).map((s) => (
                      <li key={s.id} className="text-sm text-zinc-200">
                        {s.student}
                        <span className="text-zinc-500">
                          {" "}
                          · <span className="capitalize">{s.level}</span> #
                          {s.skill_index + 1}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {today.recent_certs.length > 0 && (
              <Card className="border-zinc-800 bg-zinc-900">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-orange-400" />
                    <p className="text-xs uppercase tracking-wider text-zinc-400">
                      Certs issued · last 30d
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {today.recent_certs.slice(0, 5).map((c) => (
                      <li key={c.id} className="text-sm text-zinc-200">
                        {c.student}
                        <span className="text-zinc-500">
                          {" "}
                          · <span className="capitalize">{c.level}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
    </div>
  )
}
