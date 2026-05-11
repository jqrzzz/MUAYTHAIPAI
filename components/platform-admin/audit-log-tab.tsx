"use client"

/**
 * Audit log tab.
 *
 * Append-only history of sensitive platform-operator actions:
 * impersonations, payouts settled, support replies, blacklist adds.
 * Useful for "did I really do that?" + compliance trail.
 */
import { useCallback, useEffect, useState } from "react"
import {
  Activity,
  ChevronRight,
  Eye,
  Loader2,
  Shield,
  UserCheck,
  DollarSign,
  LifeBuoy,
  Settings,
} from "lucide-react"
import {
  Surface,
  SectionHeader,
  StatCard,
  SegmentedControl,
} from "@/components/saas"

interface AuditEntry {
  id: string
  actor_user_id: string | null
  actor_email: string | null
  action: string
  target_type: string | null
  target_id: string | null
  target_label: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

const ACTION_ICONS: Record<string, typeof Activity> = {
  "impersonate.start": Eye,
  "impersonate.end": Eye,
  "payout.settle": DollarSign,
  "blacklist.add": Shield,
  "support.reply": LifeBuoy,
  "support.resolve": LifeBuoy,
  "subscription.override": Settings,
  "booking.refund": DollarSign,
}

const ACTION_TONES: Record<string, string> = {
  "impersonate.start": "indigo",
  "impersonate.end": "zinc",
  "payout.settle": "emerald",
  "blacklist.add": "amber",
  "support.reply": "indigo",
  "support.resolve": "emerald",
  "subscription.override": "amber",
  "booking.refund": "amber",
}

type Filter = "all" | "impersonate" | "payout" | "support" | "blacklist"

export default function AuditLogTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [counts24h, setCounts24h] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/platform-admin/audit-log?limit=200", {
        cache: "no-store",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to load")
      setEntries(json.entries ?? [])
      setCounts24h(json.counts_24h ?? {})
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = entries.filter((e) => {
    if (filter === "all") return true
    return e.action.startsWith(filter + ".")
  })

  // Counts for the chips strip
  const total24h = Object.values(counts24h).reduce((s, n) => s + n, 0)
  const impersonations24h =
    (counts24h["impersonate.start"] ?? 0) + (counts24h["impersonate.end"] ?? 0)
  const payouts24h = counts24h["payout.settle"] ?? 0
  const supportReplies24h =
    (counts24h["support.reply"] ?? 0) + (counts24h["support.resolve"] ?? 0)

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Audit log"
        eyebrowIcon={Activity}
        size="lg"
        title="Who did what"
        subtitle="Append-only trail of sensitive operator actions. Useful for &lsquo;did I really do that?&rsquo; + compliance."
      />

      {error && (
        <div className="rounded-xl ring-1 ring-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-300">
          {error}
          <p className="text-[11px] text-red-300/70 mt-1">
            If first load, apply migration{" "}
            <code>scripts/042-add-audit-log.sql</code>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Activity} label="Actions 24h" value={total24h} tone="zinc" />
        <StatCard icon={Eye} label="Impersonations 24h" value={impersonations24h} tone="indigo" />
        <StatCard icon={DollarSign} label="Payouts settled 24h" value={payouts24h} tone="emerald" />
        <StatCard icon={LifeBuoy} label="Support replies 24h" value={supportReplies24h} tone="indigo" />
      </div>

      <div className="w-full max-w-md">
        <SegmentedControl<Filter>
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "impersonate", label: "Impersonate" },
            { value: "payout", label: "Payouts" },
            { value: "support", label: "Support" },
            { value: "blacklist", label: "Blacklist" },
          ]}
        />
      </div>

      {loading && entries.length === 0 ? (
        <Surface>
          <div className="text-center py-12">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
          </div>
        </Surface>
      ) : filtered.length === 0 ? (
        <Surface>
          <div className="px-4 py-10 text-center text-[13px] text-zinc-500">
            No entries in this view.
            <p className="text-[11px] text-zinc-600 mt-1">
              Sensitive actions (impersonations, payouts, refunds, support
              replies, blacklist) auto-log here as you take them.
            </p>
          </div>
        </Surface>
      ) : (
        <Surface>
          <ul className="divide-y divide-zinc-900/60">
            {filtered.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                expanded={expandedId === e.id}
                onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
              />
            ))}
          </ul>
        </Surface>
      )}
    </div>
  )
}

function EntryRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: AuditEntry
  expanded: boolean
  onToggle: () => void
}) {
  const Icon = ACTION_ICONS[entry.action] ?? Activity
  const tone = ACTION_TONES[entry.action] ?? "zinc"
  const toneRing =
    tone === "emerald"
      ? "ring-emerald-500/25 text-emerald-300"
      : tone === "indigo"
        ? "ring-indigo-500/25 text-indigo-300"
        : tone === "amber"
          ? "ring-amber-500/25 text-amber-300"
          : "ring-zinc-700/40 text-zinc-400"
  return (
    <li>
      <button
        onClick={onToggle}
        className="w-full px-4 py-2.5 text-left hover:bg-zinc-900/30 transition-colors flex items-start gap-3 text-[12px]"
      >
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 ring-1 ${toneRing} mt-0.5 shrink-0`}>
          <Icon className="h-3 w-3" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-zinc-100">
            <span className="font-mono text-[11px] text-zinc-500">{entry.action}</span>
            {entry.target_label && (
              <>
                {" · "}
                <span className="text-zinc-200">{entry.target_label}</span>
              </>
            )}
          </p>
          <p className="text-[10px] text-zinc-600 mt-0.5">
            {entry.actor_email ?? <em className="text-zinc-700">system</em>}
            {" · "}
            <span className="text-zinc-700">
              {new Date(entry.created_at).toLocaleString()}
            </span>
            {entry.ip_address && (
              <>
                {" · "}
                <span className="text-zinc-700 font-mono">{entry.ip_address}</span>
              </>
            )}
          </p>
        </div>
        <ChevronRight
          className={`h-3.5 w-3.5 text-zinc-600 shrink-0 transition-transform ${
            expanded ? "rotate-90 text-zinc-400" : ""
          }`}
        />
      </button>
      {expanded && entry.metadata && Object.keys(entry.metadata).length > 0 && (
        <div className="px-4 pb-3 -mt-1">
          <pre className="text-[10px] font-mono text-zinc-400 bg-zinc-950/60 ring-1 ring-zinc-900 rounded-md p-2 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(entry.metadata, null, 2)}
          </pre>
        </div>
      )}
    </li>
  )
}

// Suppress unused-import for the UserCheck reserved for future actions
void UserCheck
