"use client"

/**
 * Subscription revenue tab on /platform-admin.
 *
 * The business health view. Answers:
 *   - What's my MRR right now? What's the run-rate (ARR)?
 *   - How many gyms are paying / on trial / past due / cancelled?
 *   - Which trials are about to expire (next 7 days)?
 *   - Which past-due gyms need a chase?
 *   - What's churn looking like (30d)?
 *
 * Designed for backpack use — single page, mobile readable, period
 * already implicit (current state + 30d). No fiddly date pickers.
 */
import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  Surface,
  SectionHeader,
  StatCard,
  SaasButton,
} from "@/components/saas"

interface GymRow {
  org_id: string
  gym_name: string
  gym_slug: string | null
  gym_email: string | null
  status: string
  plan: string
  monthly_price_usd_cents: number
  trial_ends_at: string | null
  activated_at: string | null
  cancelled_at: string | null
  current_period_end: string | null
  stripe_subscription_id: string | null
  created_at: string
  days_in_status: number | null
  trial_expiring_soon: boolean
  trial_expired: boolean
  period_renewing_soon: boolean
}

interface Totals {
  gyms_total: number
  active_count: number
  trial_count: number
  past_due_count: number
  cancelled_count: number
  other_count: number
  mrr_usd_cents: number
  arr_usd_cents: number
  new_subs_30d: number
  cancelled_30d: number
  trial_expiring_7d: number
  trial_expired_unconverted: number
  invoiced_30d_gross_cents: number
  invoiced_30d_fee_cents: number
  invoiced_30d_net_cents: number
  invoiced_30d_count: number
  churn_rate_30d_pct: number
  trials_activated_this_month: number
}

interface InvoiceRow {
  id: string
  gym_name: string
  amount_paid_usd_cents: number
  fee_usd_cents: number | null
  net_usd_cents: number | null
  period_start: string | null
  period_end: string | null
  paid_at: string
  status: string
}

interface Response {
  totals: Totals
  per_gym: GymRow[]
  recent_invoices: InvoiceRow[]
}

export default function SubscriptionsTab() {
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/platform-admin/subscriptions-overview", {
          cache: "no-store",
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "Failed to load")
        if (!cancelled) setData(json as Response)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const downloadCsv = () => {
    if (!data) return
    const rows = [
      [
        "Gym",
        "Status",
        "Plan",
        "Monthly USD",
        "Activated",
        "Trial ends",
        "Period ends",
        "Cancelled",
        "Days in status",
        "Stripe subscription ID",
      ].join(","),
      ...data.per_gym.map((g) =>
        [
          escapeCsv(g.gym_name),
          g.status,
          g.plan,
          (g.monthly_price_usd_cents / 100).toFixed(2),
          g.activated_at ?? "",
          g.trial_ends_at ?? "",
          g.current_period_end ?? "",
          g.cancelled_at ?? "",
          g.days_in_status ?? "",
          g.stripe_subscription_id ?? "",
        ].join(","),
      ),
    ].join("\n")
    const blob = new Blob([rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
          <p className="text-[11px] text-zinc-600 mt-2">
            If this is the first load, apply migration{" "}
            <code>scripts/040-add-subscription-revenue-tracking.sql</code> in Supabase.
          </p>
        </div>
      </Surface>
    )
  }

  const trialExpiringSoon = data.per_gym.filter((g) => g.trial_expiring_soon)
  const trialExpiredUnconverted = data.per_gym.filter((g) => g.trial_expired)
  const pastDueGyms = data.per_gym.filter((g) => g.status === "past_due")
  const recentlyCancelled = data.per_gym
    .filter((g) => g.status === "cancelled" && g.cancelled_at)
    .filter(
      (g) =>
        new Date(g.cancelled_at!).getTime() >
        Date.now() - 30 * 24 * 60 * 60 * 1000,
    )

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Subscriptions"
        eyebrowIcon={CreditCard}
        size="lg"
        title="Recurring revenue"
        subtitle="Your MRR, who's paying, who's about to churn, what's owed. The business health view."
        action={
          data.per_gym.length > 0 ? (
            <SaasButton size="sm" variant="subtle" onClick={downloadCsv}>
              <Download className="h-3 w-3" />
              CSV
            </SaasButton>
          ) : null
        }
      />

      {/* Hero stats — MRR is the headline */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp}
          label="MRR"
          value={`$${(data.totals.mrr_usd_cents / 100).toFixed(2)}`}
          sub={`${data.totals.active_count} active`}
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="ARR (run-rate)"
          value={`$${(data.totals.arr_usd_cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          sub="MRR × 12"
          tone="indigo"
        />
        <StatCard
          icon={Users}
          label="Trials"
          value={data.totals.trial_count}
          sub={
            data.totals.trial_expiring_7d > 0
              ? `${data.totals.trial_expiring_7d} expiring soon`
              : `${data.totals.trials_activated_this_month} converted MTD`
          }
          tone={data.totals.trial_expiring_7d > 0 ? "amber" : "zinc"}
        />
        <StatCard
          icon={TrendingDown}
          label="Churn (30d)"
          value={`${data.totals.churn_rate_30d_pct}%`}
          sub={`${data.totals.cancelled_30d} cancelled`}
          tone={data.totals.churn_rate_30d_pct > 5 ? "amber" : "zinc"}
        />
      </div>

      {/* Cash flow strip — what actually came in via invoices */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={CreditCard}
          label="Invoiced (30d)"
          value={`$${(data.totals.invoiced_30d_gross_cents / 100).toFixed(2)}`}
          sub={`${data.totals.invoiced_30d_count} invoice${data.totals.invoiced_30d_count === 1 ? "" : "s"}`}
          tone="zinc"
        />
        <StatCard
          icon={AlertCircle}
          label="Stripe fees (30d)"
          value={`−$${(data.totals.invoiced_30d_fee_cents / 100).toFixed(2)}`}
          sub="Deducted"
          tone="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Net to balance (30d)"
          value={`$${(data.totals.invoiced_30d_net_cents / 100).toFixed(2)}`}
          sub="After Stripe fees"
          tone="emerald"
        />
        <StatCard
          icon={AlertTriangle}
          label="Past due"
          value={data.totals.past_due_count}
          sub={
            data.totals.past_due_count > 0
              ? "Needs chasing"
              : "All paying"
          }
          tone={data.totals.past_due_count > 0 ? "amber" : "emerald"}
        />
      </div>

      {/* Attention banner — only renders if there's something to nag about */}
      {(trialExpiringSoon.length > 0 ||
        pastDueGyms.length > 0 ||
        trialExpiredUnconverted.length > 0) && (
        <AttentionBanner
          trialsExpiringSoon={trialExpiringSoon}
          trialsExpiredUnconverted={trialExpiredUnconverted}
          pastDueGyms={pastDueGyms}
        />
      )}

      {/* Per-gym subscription list */}
      <div className="space-y-3">
        <SectionHeader
          title="By gym"
          subtitle="Active first, then trial, past due, cancelled. Highest MRR within each group."
        />
        {data.per_gym.length === 0 ? (
          <Surface>
            <div className="px-4 py-10 text-center text-[13px] text-zinc-500">
              No gym subscriptions yet. When a gym signs up they&apos;ll show up here as
              <code className="mx-1 text-zinc-400">trial</code>.
            </div>
          </Surface>
        ) : (
          <Surface>
            <ul className="divide-y divide-zinc-900/60">
              {data.per_gym.map((g) => (
                <GymSubRow key={g.org_id} row={g} />
              ))}
            </ul>
          </Surface>
        )}
      </div>

      {/* Recent invoice tail */}
      {data.recent_invoices.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            title="Recent invoices"
            subtitle="Last 50 paid subscription invoices."
          />
          <Surface>
            <ul className="divide-y divide-zinc-900/60">
              {data.recent_invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="px-4 py-2.5 flex items-center gap-3 text-[12px]"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-zinc-200 truncate">{inv.gym_name}</p>
                    <p className="text-[10px] text-zinc-600">
                      {new Date(inv.paid_at).toLocaleString()}
                      {inv.period_start && inv.period_end && (
                        <>
                          {" "}
                          ·{" "}
                          <span className="text-zinc-700">
                            {new Date(inv.period_start).toLocaleDateString()} →{" "}
                            {new Date(inv.period_end).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0 min-w-[110px]">
                    <p className="text-zinc-200 tabular-nums">
                      ${(inv.amount_paid_usd_cents / 100).toFixed(2)}
                    </p>
                    {inv.fee_usd_cents != null && inv.net_usd_cents != null && (
                      <p className="text-[10px] text-zinc-600 tabular-nums">
                        −${(inv.fee_usd_cents / 100).toFixed(2)} fee
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Surface>
        </div>
      )}

      {/* Recently cancelled tail for context */}
      {recentlyCancelled.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            title="Recently cancelled"
            subtitle="Last 30 days. The churn list — worth understanding why."
          />
          <Surface>
            <ul className="divide-y divide-zinc-900/60">
              {recentlyCancelled.map((g) => (
                <li
                  key={g.org_id}
                  className="px-4 py-2.5 flex items-center gap-3 text-[12px]"
                >
                  <TrendingDown className="h-3 w-3 text-zinc-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-zinc-200 truncate">{g.gym_name}</p>
                    <p className="text-[10px] text-zinc-600">
                      Cancelled{" "}
                      {g.cancelled_at && new Date(g.cancelled_at).toLocaleDateString()}
                      {g.activated_at && (
                        <>
                          {" "}
                          · Was active{" "}
                          {daysBetween(g.activated_at, g.cancelled_at!)} days
                        </>
                      )}
                    </p>
                  </div>
                  <p className="text-zinc-500 tabular-nums shrink-0">
                    ${(g.monthly_price_usd_cents / 100).toFixed(2)}/mo
                  </p>
                </li>
              ))}
            </ul>
          </Surface>
        </div>
      )}
    </div>
  )
}

/* ─── attention banner ───────────────────────────────────────────── */

function AttentionBanner({
  trialsExpiringSoon,
  trialsExpiredUnconverted,
  pastDueGyms,
}: {
  trialsExpiringSoon: GymRow[]
  trialsExpiredUnconverted: GymRow[]
  pastDueGyms: GymRow[]
}) {
  return (
    <div className="rounded-xl ring-1 ring-amber-500/30 bg-amber-500/[0.05] overflow-hidden">
      <div className="px-4 py-3 flex items-start gap-2 border-b border-amber-500/15">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" />
        <p className="text-[13px] font-medium text-amber-100">Needs your attention</p>
      </div>
      <div className="px-4 py-3 space-y-2">
        {pastDueGyms.length > 0 && (
          <AttentionList
            label="Past due — chase a payment"
            items={pastDueGyms.map((g) => ({
              name: g.gym_name,
              detail: g.days_in_status
                ? `${g.days_in_status} day${g.days_in_status === 1 ? "" : "s"} past due`
                : "Past due",
              email: g.gym_email,
            }))}
          />
        )}
        {trialsExpiredUnconverted.length > 0 && (
          <AttentionList
            label="Trial expired, no payment"
            items={trialsExpiredUnconverted.map((g) => ({
              name: g.gym_name,
              detail: `Trial ended ${
                g.trial_ends_at
                  ? new Date(g.trial_ends_at).toLocaleDateString()
                  : "—"
              }`,
              email: g.gym_email,
            }))}
          />
        )}
        {trialsExpiringSoon.length > 0 && (
          <AttentionList
            label="Trial expiring in next 7 days"
            items={trialsExpiringSoon.map((g) => ({
              name: g.gym_name,
              detail: g.trial_ends_at
                ? `Ends ${new Date(g.trial_ends_at).toLocaleDateString()}`
                : "—",
              email: g.gym_email,
            }))}
          />
        )}
      </div>
    </div>
  )
}

function AttentionList({
  label,
  items,
}: {
  label: string
  items: Array<{ name: string; detail: string; email: string | null }>
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/70 mb-1.5">
        {label}
      </p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li
            key={i}
            className="text-[12px] flex items-center gap-2 text-zinc-200"
          >
            <Clock className="h-2.5 w-2.5 text-amber-300 shrink-0" />
            <span className="truncate flex-1">{it.name}</span>
            <span className="text-[10px] text-zinc-500 shrink-0">{it.detail}</span>
            {it.email && (
              <a
                href={`mailto:${it.email}`}
                className="text-[10px] text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-0.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                Email
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── per-gym row ─────────────────────────────────────────────────── */

function GymSubRow({ row }: { row: GymRow }) {
  return (
    <li className="px-4 py-3 flex items-center gap-3 text-[13px]">
      <StatusPill status={row.status} />
      <div className="min-w-0 flex-1">
        <p className="text-zinc-100 font-medium truncate">{row.gym_name}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          {row.status === "trial" ? (
            <>
              {row.trial_ends_at ? (
                <>Trial ends {new Date(row.trial_ends_at).toLocaleDateString()}</>
              ) : (
                "Trial"
              )}
              {row.trial_expiring_soon && (
                <span className="text-amber-300 ml-1.5">· expiring soon</span>
              )}
              {row.trial_expired && (
                <span className="text-amber-300 ml-1.5">· expired</span>
              )}
            </>
          ) : row.status === "active" ? (
            <>
              {row.activated_at && (
                <>Since {new Date(row.activated_at).toLocaleDateString()}</>
              )}
              {row.current_period_end && (
                <>
                  {" "}
                  · Renews{" "}
                  {new Date(row.current_period_end).toLocaleDateString()}
                </>
              )}
              {row.period_renewing_soon && (
                <span className="text-indigo-300 ml-1.5">· renewing soon</span>
              )}
            </>
          ) : row.status === "past_due" ? (
            <>
              Last period ended{" "}
              {row.current_period_end
                ? new Date(row.current_period_end).toLocaleDateString()
                : "—"}
              {row.days_in_status != null && (
                <span className="text-amber-300 ml-1.5">
                  · {row.days_in_status}d past due
                </span>
              )}
            </>
          ) : row.status === "cancelled" ? (
            <>
              Cancelled{" "}
              {row.cancelled_at
                ? new Date(row.cancelled_at).toLocaleDateString()
                : "—"}
            </>
          ) : (
            row.status
          )}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-zinc-100 tabular-nums">
          ${(row.monthly_price_usd_cents / 100).toFixed(2)}
          <span className="text-zinc-500 text-[10px]">/mo</span>
        </p>
        <p className="text-[10px] text-zinc-600 capitalize">{row.plan}</p>
      </div>
    </li>
  )
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25"
      : status === "trial"
        ? "bg-indigo-500/15 text-indigo-200 ring-indigo-500/25"
        : status === "past_due"
          ? "bg-amber-500/15 text-amber-200 ring-amber-500/25"
          : status === "cancelled"
            ? "bg-zinc-800 text-zinc-400 ring-zinc-700/40"
            : "bg-zinc-800 text-zinc-300 ring-zinc-700/60"
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.12em] font-medium px-1.5 py-0.5 rounded ring-1 shrink-0 ${tone}`}
    >
      {status === "past_due" ? "Past due" : status}
    </span>
  )
}

function daysBetween(startStr: string, endStr: string): number {
  const ms = new Date(endStr).getTime() - new Date(startStr).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
