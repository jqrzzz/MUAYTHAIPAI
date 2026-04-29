"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  HeartPulse,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

interface Check {
  id: string
  label: string
  group: "db" | "env" | "feature"
  ok: boolean
  detail?: string
  optional?: boolean
}

interface HealthData {
  ok: boolean
  summary: { total: number; passing: number; missing: number }
  checks: Check[]
}

const GROUP_LABELS: Record<string, string> = {
  db: "Database",
  env: "Env vars",
  feature: "Features",
}

export default function HealthCard() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/platform-admin/health")
      if (res.ok) {
        const json = await res.json()
        setData(json)
        // Auto-open when something's missing so the operator notices
        if (!json.ok) setOpen(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading && !data) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-3 text-sm text-zinc-500 flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Checking system health…
        </CardContent>
      </Card>
    )
  }
  if (!data) return null

  const groups: Record<string, Check[]> = {}
  for (const c of data.checks) {
    if (!groups[c.group]) groups[c.group] = []
    groups[c.group].push(c)
  }

  return (
    <Card
      className={
        data.ok
          ? "border-emerald-700/30 bg-emerald-900/10"
          : "border-amber-700/40 bg-amber-900/15"
      }
    >
      <CardContent className="p-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <HeartPulse
              className={`h-4 w-4 shrink-0 ${
                data.ok ? "text-emerald-400" : "text-amber-400"
              }`}
            />
            <p className="text-sm font-medium text-white">
              System health
            </p>
            <p
              className={`text-xs ${
                data.ok ? "text-emerald-300" : "text-amber-200"
              }`}
            >
              {data.summary.passing}/{data.summary.total} passing
              {!data.ok ? ` · ${data.summary.missing} missing` : " — all systems go"}
            </p>
          </div>
          {open ? (
            <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
          )}
        </button>

        {open && (
          <div className="mt-3 space-y-3">
            {(["db", "env", "feature"] as const).map((g) => {
              const items = groups[g]
              if (!items || items.length === 0) return null
              return (
                <div key={g}>
                  <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                    {GROUP_LABELS[g]}
                  </p>
                  <ul className="space-y-1">
                    {items.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        {c.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle
                            className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                              c.optional ? "text-zinc-500" : "text-amber-400"
                            }`}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={
                              c.ok
                                ? "text-zinc-200"
                                : c.optional
                                  ? "text-zinc-500"
                                  : "text-amber-200"
                            }
                          >
                            {c.label}
                            {c.optional && (
                              <span className="ml-1 text-[10px] uppercase tracking-wider text-zinc-600">
                                optional
                              </span>
                            )}
                          </p>
                          {c.detail && !c.ok && (
                            <p className="text-xs text-zinc-500">{c.detail}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
            <div className="pt-2 text-xs text-zinc-500">
              Migrations live in{" "}
              <code className="text-zinc-400">scripts/RUN-PLATFORM-ADMIN.sql</code>{" "}
              — paste into Supabase SQL editor and run once.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
