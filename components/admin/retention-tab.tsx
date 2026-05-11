"use client"

/**
 * Member retention — "who's about to churn" view for the gym admin.
 *
 * Buckets students by days-since-last-booking. Surfaces dormant (60+),
 * lapsed (31-60), cooling (15-30), never-booked (joined >7d ago and
 * never showed up). Click any name → mailto: link to nudge them.
 *
 * Side rail: packages expiring in the next 14 days (renewal opportunity).
 */
import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  Package,
  TrendingDown,
  Users,
} from "lucide-react"
import {
  Surface,
  SectionHeader,
  StatCard,
  EmptyState,
  SegmentedControl,
} from "@/components/saas"

type RiskBucket = "active" | "cooling" | "lapsed" | "dormant" | "never_booked"

interface MemberRow {
  user_id: string
  name: string | null
  email: string | null
  total_bookings: number
  last_booking_date: string | null
  days_since_last_booking: number | null
  days_since_joined: number
  bucket: RiskBucket
}

interface ExpiringPkg {
  user_id: string
  name: string | null
  email: string | null
  package_name: string | null
  end_date: string | null
  days_until_expire: number | null
}

interface Counts {
  active: number
  cooling: number
  lapsed: number
  dormant: number
  never_booked: number
  total: number
}

interface Response {
  counts: Counts
  members: MemberRow[]
  expiring_packages: ExpiringPkg[]
}

type Filter = "at_risk" | "dormant" | "lapsed" | "cooling" | "never_booked" | "all"

export default function RetentionTab() {
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("at_risk")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/retention", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to load")
      setData(json as Response)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

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
        <div className="text-center py-8 text-[13px] text-zinc-500 px-4">
          {error || "No data"}
        </div>
      </Surface>
    )
  }

  const filtered = data.members.filter((m) => {
    if (filter === "all") return true
    if (filter === "at_risk")
      return m.bucket === "dormant" || m.bucket === "lapsed"
    return m.bucket === filter
  })

  const atRiskCount = data.counts.dormant + data.counts.lapsed

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Retention"
        eyebrowIcon={TrendingDown}
        size="lg"
        title="Member retention"
        subtitle="Students grouped by days since their last booking. Reach out before they churn."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={AlertTriangle}
          label="At risk (lapsed + dormant)"
          value={atRiskCount}
          sub={atRiskCount > 0 ? "Needs outreach" : "Nobody at risk"}
          tone={atRiskCount > 0 ? "amber" : "emerald"}
        />
        <StatCard
          icon={Clock}
          label="Cooling (15-30d)"
          value={data.counts.cooling}
          sub="Drifting off"
          tone={data.counts.cooling > 0 ? "indigo" : "zinc"}
        />
        <StatCard
          icon={CheckCircle2}
          label="Active (≤14d)"
          value={data.counts.active}
          sub="Showing up"
          tone="emerald"
        />
        <StatCard
          icon={Users}
          label="Total students"
          value={data.counts.total}
          tone="zinc"
        />
      </div>

      <div className="w-full max-w-2xl">
        <SegmentedControl<Filter>
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "at_risk", label: `At risk ${atRiskCount > 0 ? atRiskCount : ""}`.trim() },
            { value: "dormant", label: `Dormant ${data.counts.dormant > 0 ? data.counts.dormant : ""}`.trim() },
            { value: "lapsed", label: `Lapsed ${data.counts.lapsed > 0 ? data.counts.lapsed : ""}`.trim() },
            { value: "cooling", label: `Cooling ${data.counts.cooling > 0 ? data.counts.cooling : ""}`.trim() },
            { value: "never_booked", label: `Never booked ${data.counts.never_booked > 0 ? data.counts.never_booked : ""}`.trim() },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <Surface>
          <EmptyState
            icon={CheckCircle2}
            tone="emerald"
            title="All clear in this view"
            description="Nobody needs outreach right now. Nice work."
          />
        </Surface>
      ) : (
        <Surface>
          <ul className="divide-y divide-zinc-900/60">
            {filtered.map((m) => (
              <MemberRowItem key={m.user_id} member={m} />
            ))}
          </ul>
        </Surface>
      )}

      {/* Side panel: expiring packages */}
      {data.expiring_packages.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            eyebrow="Renewals"
            eyebrowIcon={Package}
            title="Packages expiring in 14 days"
            subtitle="Renewal opportunity. Reach out before the package runs out."
          />
          <Surface>
            <ul className="divide-y divide-zinc-900/60">
              {data.expiring_packages.map((p, i) => (
                <li
                  key={`${p.user_id}-${i}`}
                  className="px-4 py-2.5 flex items-center gap-3 text-[12px]"
                >
                  <Package className="h-3 w-3 text-indigo-300 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-zinc-200 truncate">
                      {p.name ?? p.email ?? "—"}
                      {p.package_name && (
                        <span className="text-zinc-500 ml-1.5">
                          · {p.package_name}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      Expires{" "}
                      {p.end_date && new Date(p.end_date).toLocaleDateString()}
                      {p.days_until_expire != null && (
                        <>
                          {" "}·{" "}
                          <span className="text-amber-300">
                            {p.days_until_expire}d left
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  {p.email && (
                    <a
                      href={`mailto:${p.email}?subject=Renewal%20-%20${encodeURIComponent(p.package_name ?? "your package")}`}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200 shrink-0"
                    >
                      <Mail className="h-2.5 w-2.5" />
                      Email
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Surface>
        </div>
      )}
    </div>
  )
}

function MemberRowItem({ member }: { member: MemberRow }) {
  const tone =
    member.bucket === "dormant"
      ? "bg-red-500/15 text-red-200 ring-red-500/25"
      : member.bucket === "lapsed"
        ? "bg-amber-500/15 text-amber-200 ring-amber-500/25"
        : member.bucket === "cooling"
          ? "bg-indigo-500/15 text-indigo-200 ring-indigo-500/25"
          : member.bucket === "never_booked"
            ? "bg-zinc-800 text-zinc-400 ring-zinc-700/40"
            : "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25"
  const subject = `Hey from your Muay Thai gym`
  const nameFirst = member.name?.split(" ")[0] ?? ""
  const body =
    member.bucket === "never_booked"
      ? `Hi ${nameFirst},%0A%0AWelcome to the gym! We noticed you haven't booked your first session yet — let me know if you have any questions or if I can help find a good time.%0A%0ATrain hard,%0AThe team`
      : member.bucket === "dormant"
        ? `Hi ${nameFirst},%0A%0AHaven't seen you in a while — hope everything's good! If life got busy, we totally get it. We'd love to have you back on the mats whenever you're ready.%0A%0ATrain hard,%0AThe team`
        : `Hi ${nameFirst},%0A%0AJust checking in — anything we can help with? Would love to see you back soon.%0A%0ATrain hard,%0AThe team`
  return (
    <li className="px-4 py-2.5 flex items-center gap-3 text-[12px]">
      <span
        className={`text-[10px] uppercase tracking-[0.12em] font-medium px-1.5 py-0.5 rounded ring-1 shrink-0 ${tone}`}
      >
        {member.bucket === "never_booked" ? "new" : member.bucket}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-zinc-200 truncate">
          {member.name ?? member.email ?? "—"}
        </p>
        <p className="text-[10px] text-zinc-600 truncate">
          {member.last_booking_date ? (
            <>
              Last seen{" "}
              {new Date(member.last_booking_date).toLocaleDateString()}
              {member.days_since_last_booking != null && (
                <> · {member.days_since_last_booking}d ago</>
              )}
            </>
          ) : (
            <>
              Joined {member.days_since_joined}d ago · never booked
            </>
          )}
          {member.total_bookings > 0 && (
            <> · {member.total_bookings} total bookings</>
          )}
        </p>
      </div>
      {member.email && (
        <a
          href={`mailto:${member.email}?subject=${encodeURIComponent(subject)}&body=${body}`}
          className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200 shrink-0"
        >
          <Mail className="h-2.5 w-2.5" />
          Nudge
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </li>
  )
}

// silence unused-import for Calendar reserved for a future timeline view
void Calendar
