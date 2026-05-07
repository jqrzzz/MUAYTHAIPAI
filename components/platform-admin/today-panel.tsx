"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Loader2,
  AlertCircle,
  Mail,
  Trophy,
  CheckCircle2,
  BookOpen,
  RefreshCw,
  BellOff,
  Sparkles,
  ArrowUpRight,
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
  new_discoveries: Array<{
    id: string
    name: string
    where: string | null
    status: string
    website: string | null
    summary: string | null
    enriched: boolean
    created_at: string
  }>
  drafts_ready: Array<{
    id: string
    name: string
    where: string | null
    email: string | null
    subject: string | null
    drafted_at: string | null
  }>
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
      <Surface>
        <div className="text-center py-12">
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
        </div>
      </Surface>
    )
  }

  if (error || !data) {
    return (
      <Surface>
        <div className="text-center py-8 text-[13px] text-zinc-500">
          {error || "No data."}
        </div>
      </Surface>
    )
  }

  const attentionCount =
    data.pending_invites.length +
    data.stale_crawls.length +
    Math.min(data.needs_extraction_total, 1)

  const weekTotal = data.growth_7d.reduce((s, b) => s + b.count, 0)

  return (
    <div className="space-y-5">
      {/* Section header — subtle, type-driven, no oversized icons */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Signal
          </p>
          <h2 className="text-[18px] font-semibold tracking-tight text-white mt-0.5">
            What needs you
          </h2>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-[12px] text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Attention queue — single unified surface, severity from indigo to zinc */}
      {attentionCount > 0 ? (
        <Surface accent>
          <div className="divide-y divide-zinc-900/80">
            {data.pending_invites.length > 0 && (
              <AttentionRow
                tone="indigo"
                icon={Mail}
                title={`${data.pending_invites.length} invite${
                  data.pending_invites.length === 1 ? "" : "s"
                } awaiting claim`}
                hint="Sent over a week ago"
              >
                <ul className="space-y-1.5">
                  {data.pending_invites.slice(0, 5).map((g) => (
                    <li
                      key={g.id}
                      className="group flex items-center gap-2 text-[13px]"
                    >
                      <Link
                        href={`/platform-admin/onboard/${g.id}`}
                        className="flex-1 min-w-0 text-zinc-200 hover:text-white truncate"
                      >
                        {g.name}
                        <span className="text-zinc-600">
                          {g.where ? ` · ${g.where}` : ""} · {g.days_since}d
                        </span>
                      </Link>
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
                            },
                          )
                          refresh()
                        }}
                        className="text-[11px] text-zinc-600 hover:text-zinc-300 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        title="Snooze 7 days"
                      >
                        <BellOff className="h-3 w-3" />
                        snooze
                      </button>
                    </li>
                  ))}
                  {data.pending_invites.length > 5 && (
                    <li className="text-[11px] text-zinc-600">
                      +{data.pending_invites.length - 5} more
                    </li>
                  )}
                </ul>
              </AttentionRow>
            )}

            {data.needs_extraction_total > 0 && (
              <AttentionRow
                tone="amber"
                icon={AlertCircle}
                title={`${data.needs_extraction_total} discovered gym${
                  data.needs_extraction_total === 1 ? "" : "s"
                } need extraction`}
                hint="Run a batch enrich from the Network tab"
              />
            )}

            {data.stale_crawls.length > 0 && (
              <AttentionRow
                tone="zinc"
                icon={RefreshCw}
                title={`${data.stale_crawls.length} gym${
                  data.stale_crawls.length === 1 ? "" : "s"
                } stale`}
                hint="Not refreshed in 30+ days"
              >
                <ul className="space-y-1">
                  {data.stale_crawls.slice(0, 3).map((g) => (
                    <li key={g.id} className="text-[13px]">
                      <span className="text-zinc-300">{g.name}</span>
                      <span className="text-zinc-600">
                        {g.where ? ` · ${g.where}` : ""}
                        {g.days_since != null ? ` · ${g.days_since}d` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </AttentionRow>
            )}
          </div>
        </Surface>
      ) : (
        <Surface>
          <div className="px-4 py-6 flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </span>
            <div>
              <p className="text-[13px] font-medium text-white">
                Inbox zero across the network
              </p>
              <p className="text-[12px] text-zinc-500">
                Nothing pending — discovery + outreach are caught up.
              </p>
            </div>
          </div>
        </Surface>
      )}

      {/* Drafts ready — promoted state, indigo accent */}
      {data.drafts_ready.length > 0 && (
        <Surface accent="indigo">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/15 ring-1 ring-indigo-500/25">
                <Mail className="h-3 w-3 text-indigo-300" />
              </span>
              <p className="text-[13px] font-medium text-white">
                {data.drafts_ready.length} draft
                {data.drafts_ready.length === 1 ? "" : "s"} ready to ship
              </p>
            </div>
            <Link
              href="/platform-admin?full=1#network"
              className="text-[12px] text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1"
            >
              Review
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="px-4 pb-3 text-[12px] text-zinc-500">
            OckOck personalized invite letters overnight. Tap a name to review + send.
          </p>
          <ul className="border-t border-zinc-900/80 divide-y divide-zinc-900/80">
            {data.drafts_ready.slice(0, 6).map((g) => (
              <li key={g.id}>
                <Link
                  href={`/platform-admin/onboard/${g.id}`}
                  className="block px-4 py-2.5 hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] text-white truncate">{g.name}</p>
                    {g.email && (
                      <p className="text-[11px] text-zinc-600 truncate shrink-0">
                        {g.email}
                      </p>
                    )}
                  </div>
                  {g.subject && (
                    <p className="text-[12px] text-zinc-500 italic truncate mt-0.5">
                      &ldquo;{g.subject}&rdquo;
                    </p>
                  )}
                </Link>
              </li>
            ))}
            {data.drafts_ready.length > 6 && (
              <li className="px-4 py-2 text-[11px] text-zinc-600">
                +{data.drafts_ready.length - 6} more
              </li>
            )}
          </ul>
        </Surface>
      )}

      {/* Newly discovered — secondary, lighter chrome */}
      {data.new_discoveries.length > 0 && (
        <Surface>
          <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
              <p className="text-[12px] uppercase tracking-[0.14em] text-zinc-500">
                Newly discovered · 7d
              </p>
            </div>
            <Link
              href="/platform-admin?full=1#network"
              className="text-[11px] text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-0.5"
            >
              Network
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="border-t border-zinc-900/80 divide-y divide-zinc-900/80">
            {data.new_discoveries.slice(0, 6).map((g) => (
              <li key={g.id}>
                <Link
                  href={`/platform-admin/onboard/${g.id}`}
                  className="block px-4 py-2.5 hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        g.enriched
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                      }`}
                      title={
                        g.enriched
                          ? "Enriched — ready to invite"
                          : "Pending AI extraction"
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-white truncate">{g.name}</p>
                      <p className="text-[11px] text-zinc-600 truncate">
                        {g.where ? `${g.where} · ` : ""}
                        {g.enriched ? "enriched" : "pending"}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {data.new_discoveries.length > 6 && (
              <li className="px-4 py-2 text-[11px] text-zinc-600">
                +{data.new_discoveries.length - 6} more
              </li>
            )}
          </ul>
        </Surface>
      )}

      {/* Recent activity — three lanes, equal but quiet */}
      <div className="grid gap-3 md:grid-cols-3">
        <ActivityLane
          icon={Trophy}
          title="Onboarded · 7d"
          empty="No new gyms onboarded this week."
          items={data.recent_onboarded.map((g) => ({
            id: g.id,
            primary: g.name,
            secondary: [g.where, g.claimed_at ? timeAgo(g.claimed_at) : null]
              .filter(Boolean)
              .join(" · "),
          }))}
        />
        <ActivityLane
          icon={CheckCircle2}
          title="Signoffs · 24h"
          empty="No signoffs in the last 24h."
          items={data.recent_signoffs.map((s) => ({
            id: s.id,
            primary: s.student,
            secondary: `${s.level} · ${s.gym}`,
          }))}
        />
        <ActivityLane
          icon={BookOpen}
          title="Certs · 7d"
          empty="No certificates issued this week."
          items={data.recent_certs.map((c) => ({
            id: c.id,
            primary: c.student,
            secondary: `${c.level} · ${c.gym}`,
          }))}
        />
      </div>

      {/* Growth strip — minimal sparkbars, indigo on activity, zinc on empty */}
      {data.growth_7d.length > 0 && (
        <Surface>
          <div className="px-4 py-3.5">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  Onboarded · 7d
                </p>
                <p className="text-[20px] font-semibold tracking-tight text-white tabular-nums mt-0.5">
                  {weekTotal}
                  <span className="text-[12px] text-zinc-500 font-normal ml-1.5">
                    this week
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-10">
              {data.growth_7d.map((b) => {
                const max = Math.max(
                  ...data.growth_7d.map((x) => x.count),
                  1,
                )
                const h = Math.max(4, Math.round((b.count / max) * 100))
                const day = new Date(b.date).toLocaleDateString(undefined, {
                  weekday: "short",
                })
                return (
                  <div
                    key={b.date}
                    className="flex flex-col items-stretch gap-1.5 flex-1 min-w-0"
                    title={`${b.date}: ${b.count}`}
                  >
                    <div
                      className={`w-full rounded-sm transition-colors ${
                        b.count > 0
                          ? "bg-indigo-400/80"
                          : "bg-zinc-800"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] text-zinc-600 text-center">
                      {day}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </Surface>
      )}
    </div>
  )
}

/* ─── primitives ─────────────────────────────────────────────────── */

function Surface({
  children,
  accent,
}: {
  children: React.ReactNode
  accent?: "indigo" | true
}) {
  const ring =
    accent === "indigo"
      ? "ring-1 ring-indigo-500/20"
      : accent
        ? "ring-1 ring-zinc-800"
        : "ring-1 ring-zinc-900"
  const bg =
    accent === "indigo"
      ? "bg-gradient-to-b from-indigo-500/[0.04] to-zinc-900/40"
      : "bg-zinc-900/40"
  return (
    <div className={`rounded-xl ${bg} ${ring} backdrop-blur-sm overflow-hidden`}>
      {children}
    </div>
  )
}

function AttentionRow({
  icon: Icon,
  tone,
  title,
  hint,
  children,
}: {
  icon: typeof Mail
  tone: "indigo" | "amber" | "zinc"
  title: string
  hint?: string
  children?: React.ReactNode
}) {
  const iconBg =
    tone === "indigo"
      ? "bg-indigo-500/15 ring-indigo-500/25"
      : tone === "amber"
        ? "bg-amber-500/15 ring-amber-500/25"
        : "bg-zinc-800 ring-zinc-700/50"
  const iconColor =
    tone === "indigo"
      ? "text-indigo-300"
      : tone === "amber"
        ? "text-amber-300"
        : "text-zinc-400"
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-md ring-1 ${iconBg} shrink-0 mt-0.5`}
        >
          <Icon className={`h-3 w-3 ${iconColor}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-white">{title}</p>
          {hint && (
            <p className="text-[12px] text-zinc-500 mt-0.5">{hint}</p>
          )}
          {children && <div className="mt-2.5">{children}</div>}
        </div>
      </div>
    </div>
  )
}

function ActivityLane({
  icon: Icon,
  title,
  items,
  empty,
}: {
  icon: typeof Mail
  title: string
  items: Array<{ id: string; primary: string; secondary: string }>
  empty: string
}) {
  return (
    <div className="rounded-xl ring-1 ring-zinc-900 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
      <div className="px-3.5 py-2.5 flex items-center gap-2 border-b border-zinc-900/80">
        <Icon className="h-3 w-3 text-zinc-500" />
        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          {title}
        </p>
      </div>
      <div className="p-3.5">
        {items.length === 0 ? (
          <p className="text-[12px] text-zinc-600">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 5).map((it) => (
              <li key={it.id} className="text-[13px]">
                <p className="text-zinc-200 truncate">{it.primary}</p>
                <p className="text-[11px] text-zinc-600 truncate">
                  {it.secondary}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
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
