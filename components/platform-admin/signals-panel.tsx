"use client"

/**
 * AI-driven signals panel — the proactive morning brief.
 *
 * Renders on /platform-admin/today between the greeting and the
 * existing Today panel. Surfaces what the rule engine + AI flagged:
 * trial expirations, past-due, inactivity, velocity drops, support
 * SLAs, outreach opportunities, celebrations.
 *
 * Each card has Dismiss (acknowledge, no action) and Done (you took
 * the suggested action). Empty state encourages "all clear."
 */
import { useCallback, useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronRight,
  Loader2,
  PartyPopper,
  RefreshCw,
  Sparkles,
  TrendingDown,
  X,
  type LucideIcon,
} from "lucide-react"
import { Surface, SaasButton } from "@/components/saas"

interface Signal {
  id: string
  kind: string
  severity: "info" | "warning" | "critical"
  target_org_id: string | null
  title: string
  summary: string
  detail: string | null
  evidence: Record<string, unknown> | null
  suggested_action: string | null
  generated_at: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organizations: any
}

interface Counts {
  critical: number
  warning: number
  info: number
}

const KIND_ICON: Record<string, LucideIcon> = {
  trial_expired: AlertTriangle,
  trial_ending: AlertCircle,
  past_due: AlertTriangle,
  inactivity_risk: TrendingDown,
  velocity_drop: TrendingDown,
  support_overdue: AlertTriangle,
  outreach_opportunity: Sparkles,
  celebration: PartyPopper,
}

const SEVERITY_TONE: Record<string, { ring: string; text: string; icon: string }> = {
  critical: {
    ring: "ring-red-500/30",
    text: "text-red-200",
    icon: "bg-red-500/15 ring-red-500/25 text-red-300",
  },
  warning: {
    ring: "ring-amber-500/25",
    text: "text-amber-200",
    icon: "bg-amber-500/15 ring-amber-500/25 text-amber-300",
  },
  info: {
    ring: "ring-zinc-800",
    text: "text-zinc-200",
    icon: "bg-zinc-800 ring-zinc-700/40 text-zinc-300",
  },
}

export default function SignalsPanel() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch("/api/platform-admin/signals?status=open", {
        cache: "no-store",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to load")
      setSignals(json.signals ?? [])
      setCounts(json.counts ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const regenerate = async () => {
    setRefreshing(true)
    try {
      await fetch("/api/platform-admin/signals/regenerate", { method: "POST" })
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }

  const updateStatus = async (id: string, status: "dismissed" | "acted_on") => {
    setActing(id)
    try {
      const res = await fetch(`/api/platform-admin/signals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        // Optimistic remove
        setSignals((prev) => prev.filter((s) => s.id !== id))
      }
    } finally {
      setActing(null)
    }
  }

  if (loading) {
    return (
      <Surface>
        <div className="text-center py-8">
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
        </div>
      </Surface>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
          <p className="text-[12px] uppercase tracking-[0.14em] text-zinc-500">
            Today&apos;s signals
          </p>
          {counts && (
            <span className="text-[11px] text-zinc-600 tabular-nums">
              {counts.critical + counts.warning + counts.info}
              {counts.critical > 0 && (
                <span className="text-red-300 ml-1.5">· {counts.critical} critical</span>
              )}
              {counts.warning > 0 && (
                <span className="text-amber-300 ml-1.5">· {counts.warning} warning</span>
              )}
            </span>
          )}
        </div>
        <button
          onClick={regenerate}
          disabled={refreshing}
          className="text-[11px] text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1 disabled:opacity-50 transition-colors"
          title="Regenerate signals now"
        >
          {refreshing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl ring-1 ring-red-500/20 bg-red-500/10 p-3 text-[12px] text-red-300">
          {error}
          <p className="text-[11px] text-red-300/70 mt-1">
            If first run, apply migration{" "}
            <code>scripts/043-add-platform-signals.sql</code> and tap Refresh.
          </p>
        </div>
      )}

      {signals.length === 0 ? (
        <Surface>
          <div className="px-4 py-6 text-center">
            <Check className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-[13px] text-zinc-200 font-medium">All clear</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              No signals need your attention right now. Nice work.
            </p>
          </div>
        </Surface>
      ) : (
        <ul className="space-y-2">
          {signals.map((s) => (
            <SignalCard
              key={s.id}
              signal={s}
              expanded={expandedId === s.id}
              onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
              onDismiss={() => updateStatus(s.id, "dismissed")}
              onActed={() => updateStatus(s.id, "acted_on")}
              busy={acting === s.id}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function SignalCard({
  signal,
  expanded,
  onToggle,
  onDismiss,
  onActed,
  busy,
}: {
  signal: Signal
  expanded: boolean
  onToggle: () => void
  onDismiss: () => void
  onActed: () => void
  busy: boolean
}) {
  const tone = SEVERITY_TONE[signal.severity] ?? SEVERITY_TONE.info
  const Icon = KIND_ICON[signal.kind] ?? Sparkles
  const org = Array.isArray(signal.organizations)
    ? signal.organizations[0]
    : signal.organizations

  return (
    <li
      className={`rounded-xl ring-1 ${tone.ring} bg-zinc-900/40 backdrop-blur overflow-hidden transition-[box-shadow,transform] hover:-translate-y-px`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
      >
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md ring-1 shrink-0 mt-0.5 ${tone.icon}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-medium ${tone.text} leading-snug`}>
            {signal.title}
          </p>
          <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">
            {signal.summary}
          </p>
          {signal.suggested_action && expanded && (
            <p className="text-[12px] text-zinc-500 mt-2 leading-relaxed border-l border-zinc-800 pl-2.5">
              <span className="text-zinc-400">→ </span>
              {signal.suggested_action}
            </p>
          )}
        </div>
        <ChevronRight
          className={`h-3.5 w-3.5 text-zinc-600 shrink-0 mt-1.5 transition-transform ${
            expanded ? "rotate-90 text-zinc-400" : ""
          }`}
        />
      </button>
      {expanded && (
        <div className="px-4 pb-3 -mt-1 flex items-center gap-2 justify-end">
          {org?.email && (
            <a
              href={`mailto:${org.email}`}
              className="text-[11px] text-indigo-300 hover:text-indigo-200 mr-auto truncate max-w-[160px]"
              title={org.email}
            >
              {org.email}
            </a>
          )}
          <SaasButton size="sm" variant="ghost" onClick={onDismiss} disabled={busy}>
            <X className="h-3 w-3" />
            Dismiss
          </SaasButton>
          <SaasButton size="sm" onClick={onActed} disabled={busy} loading={busy}>
            <Check className="h-3 w-3" />
            Done
          </SaasButton>
        </div>
      )}
    </li>
  )
}
