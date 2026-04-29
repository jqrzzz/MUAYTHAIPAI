"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import {
  Loader2,
  Clock,
  AlertTriangle,
  Mail,
  Trophy,
  CheckCircle2,
  BookOpen,
  RefreshCw,
  BellOff,
} from "lucide-react"

interface TodayData {
  pending_invites: Array<{
    id: string
    name: string
    where: string | null
    invited_email: string | null
    invited_at: string | null
    days_since: number
  }>
  stale_crawls: Array<{
    id: string
    name: string
    where: string | null
    last_crawled_at: string | null
    days_since: number | null
  }>
  needs_extraction: Array<{
    id: string
    name: string
    where: string | null
    website: string | null
  }>
  needs_extraction_total: number
  recent_onboarded: Array<{
    id: string
    name: string
    where: string | null
    claimed_at: string | null
    org_id: string | null
  }>
  recent_signoffs: Array<{
    id: string
    student: string
    gym: string
    level: string
    skill_index: number
    signed_off_at: string
  }>
  recent_certs: Array<{
    id: string
    student: string
    gym: string
    level: string
    certificate_number: string | null
    issued_at: string
  }>
  growth_7d: Array<{ date: string; count: number }>
}

export default function TodayPanel() {
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/platform-admin/today")
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Failed to load")
      } else {
        setData(json)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  if (loading && !data) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="text-center py-6 text-zinc-500 text-sm">
          {error || "No data."}
        </CardContent>
      </Card>
    )
  }

  const attentionCount =
    data.pending_invites.length +
    data.stale_crawls.length +
    Math.min(data.needs_extraction_total, 1)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-500" />
          <h2 className="text-base font-semibold text-white">Today</h2>
          <span className="text-xs text-zinc-500">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {attentionCount > 0 && (
        <div className="space-y-2">
          {data.pending_invites.length > 0 && (
            <AttentionCard
              icon={Mail}
              tone="amber"
              title={`${data.pending_invites.length} invite${
                data.pending_invites.length === 1 ? "" : "s"
              } awaiting claim — sent over a week ago`}
            >
              <ul className="space-y-1.5">
                {data.pending_invites.slice(0, 5).map((g) => (
                  <li key={g.id} className="text-sm flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/platform-admin/onboard/${g.id}`}
                        className="text-amber-200 hover:underline"
                      >
                        {g.name}
                      </Link>
                      <span className="text-zinc-500">
                        {g.where ? ` · ${g.where}` : ""} · {g.days_since}d ago
                        {g.invited_email ? ` · ${g.invited_email}` : ""}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch(
                          `/api/platform-admin/discovery/${g.id}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              last_nudged_at: new Date().toISOString(),
                            }),
                          }
                        )
                        refresh()
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1 shrink-0"
                      title="Snooze 7 days"
                    >
                      <BellOff className="h-3 w-3" />
                      snooze
                    </button>
                  </li>
                ))}
                {data.pending_invites.length > 5 && (
                  <li className="text-xs text-zinc-500">
                    +{data.pending_invites.length - 5} more
                  </li>
                )}
              </ul>
            </AttentionCard>
          )}

          {data.needs_extraction_total > 0 && (
            <AttentionCard
              icon={AlertTriangle}
              tone="orange"
              title={`${data.needs_extraction_total} discovered gym${
                data.needs_extraction_total === 1 ? "" : "s"
              } with website but no AI extraction`}
            >
              <p className="text-sm text-zinc-300">
                Run a batch enrich from the Network tab to fill these in.
              </p>
            </AttentionCard>
          )}

          {data.stale_crawls.length > 0 && (
            <AttentionCard
              icon={RefreshCw}
              tone="zinc"
              title={`${data.stale_crawls.length} gym${
                data.stale_crawls.length === 1 ? "" : "s"
              } not refreshed in 30+ days`}
            >
              <ul className="space-y-1">
                {data.stale_crawls.slice(0, 3).map((g) => (
                  <li key={g.id} className="text-sm">
                    <span className="text-zinc-200">{g.name}</span>
                    <span className="text-zinc-500">
                      {g.where ? ` · ${g.where}` : ""}
                      {g.days_since != null ? ` · ${g.days_since}d` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </AttentionCard>
          )}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <ActivityCard
          icon={Trophy}
          tone="orange"
          title="Onboarded this week"
          empty="No new gyms onboarded yet this week."
          items={data.recent_onboarded.map((g) => ({
            id: g.id,
            primary: g.name,
            secondary: [
              g.where,
              g.claimed_at ? timeAgo(g.claimed_at) : null,
            ]
              .filter(Boolean)
              .join(" · "),
          }))}
        />
        <ActivityCard
          icon={CheckCircle2}
          tone="emerald"
          title="Signoffs · last 24h"
          empty="No skill signoffs in the last 24h."
          items={data.recent_signoffs.map((s) => ({
            id: s.id,
            primary: `${s.student}`,
            secondary: `${s.level} · #${s.skill_index + 1} · ${s.gym}`,
          }))}
        />
        <ActivityCard
          icon={BookOpen}
          tone="amber"
          title="Certs issued · last 7d"
          empty="No certificates issued this week."
          items={data.recent_certs.map((c) => ({
            id: c.id,
            primary: `${c.student}`,
            secondary: `${c.level} · ${c.gym} · ${timeAgo(c.issued_at)}`,
          }))}
        />
      </div>

      {data.growth_7d.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Onboarded gyms · last 7 days
              </p>
              <p className="text-xs text-zinc-300">
                {data.growth_7d.reduce((s, b) => s + b.count, 0)} this week
              </p>
            </div>
            <div className="flex items-end gap-1.5 h-12">
              {data.growth_7d.map((b) => {
                const max = Math.max(...data.growth_7d.map((x) => x.count), 1)
                const h = Math.max(2, Math.round((b.count / max) * 100))
                const day = new Date(b.date).toLocaleDateString(undefined, {
                  weekday: "short",
                })
                return (
                  <div
                    key={b.date}
                    className="flex flex-col items-center gap-1 flex-1 min-w-0"
                    title={`${b.date}: ${b.count}`}
                  >
                    <div
                      className={`w-full rounded ${
                        b.count > 0 ? "bg-orange-500" : "bg-zinc-800"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] text-zinc-500">{day}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AttentionCard({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: typeof Mail
  tone: "amber" | "orange" | "zinc"
  title: string
  children: React.ReactNode
}) {
  const ring =
    tone === "amber"
      ? "border-amber-700/40 bg-amber-900/15"
      : tone === "orange"
        ? "border-orange-700/40 bg-orange-900/15"
        : "border-zinc-700 bg-zinc-900"
  const iconColor =
    tone === "amber"
      ? "text-amber-400"
      : tone === "orange"
        ? "text-orange-400"
        : "text-zinc-400"
  return (
    <div className={`rounded border ${ring} p-3 space-y-2`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <p className="text-sm font-medium text-white">{title}</p>
      </div>
      {children}
    </div>
  )
}

function ActivityCard({
  icon: Icon,
  tone,
  title,
  items,
  empty,
}: {
  icon: typeof Mail
  tone: "orange" | "emerald" | "amber"
  title: string
  items: Array<{ id: string; primary: string; secondary: string }>
  empty: string
}) {
  const iconColor =
    tone === "emerald"
      ? "text-emerald-400"
      : tone === "amber"
        ? "text-amber-400"
        : "text-orange-400"
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <p className="text-xs text-zinc-400 uppercase tracking-wider">{title}</p>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-zinc-500">{empty}</p>
        ) : (
          <ul className="space-y-1.5">
            {items.slice(0, 5).map((it) => (
              <li key={it.id} className="text-sm text-white">
                <p className="truncate">{it.primary}</p>
                <p className="text-xs text-zinc-500 truncate">{it.secondary}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}
