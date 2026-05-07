"use client"

/**
 * Network Adoption tab — operator's view into "is anyone actually
 * using this stuff?" Critical for a single-operator SaaS where you
 * can't afford to ship features no one uses.
 */
import { useEffect, useState } from "react"
import {
  CheckCircle2,
  Circle,
  DollarSign,
  Globe,
  Loader2,
  Package,
  ScrollText,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import {
  Surface,
  SectionHeader,
  StatCard,
  EmptyState,
} from "@/components/saas"

interface Totals {
  gyms: number
  websites: { published: number; draft: number }
  social: {
    drafts: number
    scheduled: number
    published: number
    ai_7d: number
    ai_30d: number
  }
  payouts: {
    gyms_with_rules: number
    paid_30d_thb: number
    payouts_30d_count: number
  }
  waivers: { gyms_with_active: number }
  packages: { gyms_with_active: number }
}

interface PerGymRow {
  id: string
  name: string
  slug: string | null
  joined_at: string | null
  website_status: string | null
  social_total: number
  social_ai: number
  commission_rules: number
  has_waiver: boolean
  has_packages: boolean
  adoption_score: number
}

interface AdoptionResponse {
  totals: Totals
  gyms: PerGymRow[]
}

export default function AdoptionTab() {
  const [data, setData] = useState<AdoptionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/platform-admin/adoption", {
          cache: "no-store",
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Failed to load")
        if (!cancelled) setData(json as AdoptionResponse)
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
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
        <div className="text-center py-8 text-[13px] text-zinc-500 px-4">
          {error || "No data"}
        </div>
      </Surface>
    )
  }

  const { totals, gyms } = data
  const websitePct =
    totals.gyms > 0
      ? Math.round((totals.websites.published / totals.gyms) * 100)
      : 0
  const socialPct =
    totals.gyms > 0
      ? Math.round(
          (gyms.filter((g) => g.social_total > 0).length / totals.gyms) * 100,
        )
      : 0
  const payoutsPct =
    totals.gyms > 0
      ? Math.round((totals.payouts.gyms_with_rules / totals.gyms) * 100)
      : 0
  const waiversPct =
    totals.gyms > 0
      ? Math.round((totals.waivers.gyms_with_active / totals.gyms) * 100)
      : 0

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Adoption"
        eyebrowIcon={TrendingUp}
        size="lg"
        title="Network feature adoption"
        subtitle="Which features are gyms actually using. Cold gyms (low score) are candidates for outreach or onboarding follow-up."
      />

      {/* Totals row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Globe}
          label="Sites published"
          value={`${totals.websites.published}/${totals.gyms}`}
          sub={`${websitePct}% of network`}
          tone={websitePct >= 50 ? "emerald" : "amber"}
        />
        <StatCard
          icon={Sparkles}
          label="AI posts · 7d"
          value={totals.social.ai_7d}
          sub={`${totals.social.ai_30d} this month`}
          tone="indigo"
        />
        <StatCard
          icon={DollarSign}
          label="Trainer payouts · 30d"
          value={`฿${totals.payouts.paid_30d_thb.toLocaleString()}`}
          sub={`${totals.payouts.payouts_30d_count} settled`}
          tone="emerald"
        />
        <StatCard
          icon={ScrollText}
          label="Waivers active"
          value={`${totals.waivers.gyms_with_active}/${totals.gyms}`}
          sub={`${waiversPct}% of network`}
          tone={waiversPct >= 50 ? "emerald" : "amber"}
        />
      </div>

      {/* Adoption funnels — bar per feature */}
      <Surface>
        <div className="px-4 py-3 border-b border-zinc-900/80">
          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            Feature reach across the network
          </p>
        </div>
        <div className="p-4 space-y-3">
          <FeatureBar
            icon={Globe}
            label="Website builder"
            count={totals.websites.published}
            total={totals.gyms}
            sub={`${totals.websites.draft} drafts in progress`}
          />
          <FeatureBar
            icon={Sparkles}
            label="Social composer"
            count={gyms.filter((g) => g.social_total > 0).length}
            total={totals.gyms}
            sub={`${totals.social.published} posts published, ${totals.social.scheduled} queued`}
          />
          <FeatureBar
            icon={DollarSign}
            label="Trainer commissions"
            count={totals.payouts.gyms_with_rules}
            total={totals.gyms}
            sub={`${payoutsPct}% have rules set up`}
          />
          <FeatureBar
            icon={ScrollText}
            label="Liability waivers"
            count={totals.waivers.gyms_with_active}
            total={totals.gyms}
            sub={`${waiversPct}% have a published waiver`}
          />
          <FeatureBar
            icon={Package}
            label="Packages catalog"
            count={totals.packages.gyms_with_active}
            total={totals.gyms}
          />
        </div>
      </Surface>

      {/* Per-gym matrix */}
      <div className="space-y-3">
        <SectionHeader
          eyebrow="Per gym"
          title="Who's using what"
          subtitle="Sorted by adoption score. Bottom of the list = your re-onboarding list."
        />
        {gyms.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No active gyms yet"
            description="Once gyms onboard, their feature usage will show up here."
          />
        ) : (
          <Surface>
            <div className="px-4 py-2.5 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_repeat(5,minmax(0,40px))_auto] gap-2 items-center text-[10px] uppercase tracking-[0.14em] text-zinc-600 border-b border-zinc-900/80">
              <span>Gym</span>
              <span className="hidden sm:inline text-center" title="Website published">Site</span>
              <span className="hidden sm:inline text-center" title="Social posts created">Social</span>
              <span className="hidden sm:inline text-center" title="Commission rules set">Pay</span>
              <span className="hidden sm:inline text-center" title="Waiver active">Wvr</span>
              <span className="hidden sm:inline text-center" title="Packages catalog">Pkg</span>
              <span className="text-right">Score</span>
            </div>
            <ul className="divide-y divide-zinc-900/60">
              {gyms.map((g) => (
                <li
                  key={g.id}
                  className="px-4 py-2 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_repeat(5,minmax(0,40px))_auto] gap-2 items-center text-[12px]"
                >
                  <div className="min-w-0">
                    <p className="text-zinc-200 truncate">{g.name}</p>
                    <p className="text-[10px] text-zinc-600 sm:hidden">
                      Score {g.adoption_score}/5
                    </p>
                  </div>
                  <FeatureCell active={g.website_status === "published"} />
                  <FeatureCell active={g.social_total > 0} count={g.social_total} />
                  <FeatureCell active={g.commission_rules > 0} count={g.commission_rules} />
                  <FeatureCell active={g.has_waiver} />
                  <FeatureCell active={g.has_packages} />
                  <ScorePill score={g.adoption_score} />
                </li>
              ))}
            </ul>
          </Surface>
        )}
      </div>
    </div>
  )
}

/* ─── helpers ────────────────────────────────────────────────────── */

function FeatureBar({
  icon: Icon,
  label,
  count,
  total,
  sub,
}: {
  icon: typeof Globe
  label: string
  count: number
  total: number
  sub?: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3 w-3 text-zinc-500" />
        <p className="text-[12px] text-zinc-300 flex-1">{label}</p>
        <p className="text-[12px] text-zinc-500 tabular-nums">
          <span className="text-white font-medium">{count}</span>
          <span className="text-zinc-600">/{total}</span>
          <span className="ml-1.5 text-zinc-500">({pct}%)</span>
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-indigo-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}

function FeatureCell({ active, count }: { active: boolean; count?: number }) {
  return (
    <span
      className="hidden sm:inline-flex items-center justify-center"
      title={active ? "Activated" : "Not yet"}
    >
      {active ? (
        count != null ? (
          <span className="text-[11px] text-indigo-300 tabular-nums font-medium">
            {count}
          </span>
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        )
      ) : (
        <Circle className="h-3.5 w-3.5 text-zinc-700" />
      )}
    </span>
  )
}

function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 4
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
      : score >= 2
        ? "bg-amber-500/15 text-amber-300 ring-amber-500/25"
        : "bg-zinc-800 text-zinc-500 ring-zinc-700/40"
  return (
    <span
      className={`text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded ring-1 ${tone}`}
    >
      {score}/5
    </span>
  )
}
