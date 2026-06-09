"use client"

/**
 * Bookings breakdown tab on /platform-admin.
 *
 * "Where did the money come from this period?" — the answer to the
 * questions you get sitting across from a gym owner with a backpack
 * laptop:
 *   - How many bookings did you have this month?
 *   - Of those, how many did people pay for in cash vs online?
 *   - How much landed in MY Stripe account vs went straight to the gym?
 *   - What's still pending (unsettled cash) and might need a nudge?
 *
 * Layout is mobile-friendly: hero stats stack on phone, per-gym table
 * collapses to a card list. CSV export so you can hand-off to bookkeeping.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  Loader2,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react"
import {
  Surface,
  SectionHeader,
  StatCard,
  SaasInput,
  SaasButton,
  SegmentedControl,
} from "@/components/saas"
import { THB_TO_USD_RATE } from "@/lib/payment-config"

interface GymRow {
  org_id: string
  gym_name: string
  gym_slug: string | null
  stripe_onboarded: boolean
  stripe_paid_usd_cents: number
  stripe_fee_usd_cents: number
  stripe_net_usd_cents: number
  stripe_fee_known_count: number
  platform_commission_usd_cents: number
  cash_paid_thb: number
  cash_pending_thb: number
  transfer_paid_thb: number
  stripe_paid_count: number
  cash_paid_count: number
  cash_pending_count: number
  transfer_paid_count: number
  unspecified_count: number
  total_bookings: number
  refunded_count: number
  refunded_amount_usd_cents: number
  payouts_paid_usd_cents: number
}

interface Totals {
  bookings: number
  stripe_paid_usd_cents: number
  stripe_fee_usd_cents: number
  stripe_net_usd_cents: number
  stripe_fee_known_count: number
  platform_commission_usd_cents: number
  cash_paid_thb: number
  cash_pending_thb: number
  transfer_paid_thb: number
  stripe_paid_count: number
  cash_paid_count: number
  cash_pending_count: number
  transfer_paid_count: number
  unspecified_count: number
  refunded_count: number
  refunded_amount_usd_cents: number
  payouts_paid_usd_cents: number
}

interface RecentRow {
  id: string
  gym_name: string
  booking_date: string
  customer: string
  service: string
  payment_method: string | null
  payment_status: string | null
  payment_currency: string | null
  payment_amount_thb: number | null
  payment_amount_usd: number | null
  stripe_payment_intent_id: string | null
  stripe_fee_cents: number | null
  stripe_net_cents: number | null
  refunded_amount_cents: number | null
}

interface Response {
  period: { from: string; to: string }
  totals: Totals
  by_gym: GymRow[]
  recent: RecentRow[]
}

type PeriodPreset = "month" | "last_month" | "week" | "ytd" | "custom"

export default function BookingsTab() {
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preset, setPreset] = useState<PeriodPreset>("month")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const range = useMemo(() => {
    const today = new Date()
    if (preset === "custom") return { from: customFrom, to: customTo }
    if (preset === "month") {
      return {
        from: new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString().slice(0, 10),
        to: today.toISOString().slice(0, 10),
      }
    }
    if (preset === "last_month") {
      return {
        from: new Date(today.getFullYear(), today.getMonth() - 1, 1)
          .toISOString().slice(0, 10),
        to: new Date(today.getFullYear(), today.getMonth(), 0)
          .toISOString().slice(0, 10),
      }
    }
    if (preset === "ytd") {
      return {
        from: new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10),
        to: today.toISOString().slice(0, 10),
      }
    }
    // week — last 7 days
    const start = new Date(today)
    start.setDate(today.getDate() - 6)
    return {
      from: start.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
    }
  }, [preset, customFrom, customTo])

  const refresh = useCallback(async () => {
    if (preset === "custom" && (!customFrom || !customTo)) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ from: range.from, to: range.to })
      const res = await fetch(
        `/api/platform-admin/bookings-breakdown?${params}`,
        { cache: "no-store" },
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to load")
      setData(json as Response)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to, preset, customFrom, customTo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const downloadCsv = () => {
    if (!data) return
    const rows = [
      [
        "Gym",
        "Total bookings",
        "Stripe gross (USD)",
        "Stripe fees (USD)",
        "Stripe net (USD)",
        "Stripe bookings",
        "Platform commission (USD)",
        "Real take (USD)",
        "Cash paid (THB)",
        "Cash paid bookings",
        "Cash pending (THB)",
        "Cash pending bookings",
        "Transfer paid (THB)",
        "Transfer bookings",
        "Refunded count",
        "Refunded amount (USD)",
        "Payouts paid (USD)",
      ].join(","),
      ...data.by_gym.map((g) =>
        [
          escapeCsv(g.gym_name),
          g.total_bookings,
          (g.stripe_paid_usd_cents / 100).toFixed(2),
          (g.stripe_fee_usd_cents / 100).toFixed(2),
          (g.stripe_net_usd_cents / 100).toFixed(2),
          g.stripe_paid_count,
          (g.platform_commission_usd_cents / 100).toFixed(2),
          (Math.max(0, g.platform_commission_usd_cents - g.stripe_fee_usd_cents) / 100).toFixed(2),
          g.cash_paid_thb,
          g.cash_paid_count,
          g.cash_pending_thb,
          g.cash_pending_count,
          g.transfer_paid_thb,
          g.transfer_paid_count,
          g.refunded_count,
          (g.refunded_amount_usd_cents / 100).toFixed(2),
          (g.payouts_paid_usd_cents / 100).toFixed(2),
        ].join(","),
      ),
    ].join("\n")
    const blob = new Blob([rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bookings-${data.period.from}-to-${data.period.to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Bookings"
        eyebrowIcon={Receipt}
        size="lg"
        title="Money trail"
        subtitle="Per gym, per period. What was paid, by whom, in what currency, and where the money actually landed."
        action={
          data && data.by_gym.length > 0 ? (
            <SaasButton size="sm" variant="subtle" onClick={downloadCsv}>
              <Download className="h-3 w-3" />
              CSV
            </SaasButton>
          ) : null
        }
      />

      {/* Period selector */}
      <div className="flex flex-col gap-3">
        <div className="w-full max-w-2xl">
          <SegmentedControl<PeriodPreset>
            value={preset}
            onValueChange={setPreset}
            options={[
              { value: "month", label: "This month" },
              { value: "last_month", label: "Last month" },
              { value: "week", label: "Last 7 days" },
              { value: "ytd", label: "Year to date" },
              { value: "custom", label: "Custom" },
            ]}
          />
        </div>
        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-2 max-w-md">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 mb-1">From</p>
              <SaasInput type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 mb-1">To</p>
              <SaasInput type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
          </div>
        )}
        {data && (
          <p className="text-[11px] text-zinc-600">
            {data.period.from} → {data.period.to}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl ring-1 ring-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-300">
          {error}
        </div>
      )}

      {/* Hero stats — the four numbers that tell the real story */}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={CreditCard}
              label="Stripe gross"
              value={`$${(data.totals.stripe_paid_usd_cents / 100).toFixed(2)}`}
              sub={`${data.totals.stripe_paid_count} booking${data.totals.stripe_paid_count === 1 ? "" : "s"}`}
              tone="zinc"
            />
            <StatCard
              icon={AlertCircle}
              label="Stripe fees"
              value={`−$${(data.totals.stripe_fee_usd_cents / 100).toFixed(2)}`}
              sub={
                data.totals.stripe_fee_known_count < data.totals.stripe_paid_count
                  ? `${data.totals.stripe_fee_known_count}/${data.totals.stripe_paid_count} tracked`
                  : "All tracked"
              }
              tone="amber"
            />
            <StatCard
              icon={Wallet}
              label="Actually landed"
              value={`$${(data.totals.stripe_net_usd_cents / 100).toFixed(2)}`}
              sub="Net to your Stripe balance"
              tone="emerald"
            />
            <StatCard
              icon={TrendingUp}
              label="Your commission"
              value={`$${(data.totals.platform_commission_usd_cents / 100).toFixed(2)}`}
              sub={`Real take: $${Math.max(0, (data.totals.platform_commission_usd_cents - data.totals.stripe_fee_usd_cents) / 100).toFixed(2)}`}
              tone="indigo"
            />
          </div>

          {/* Secondary row: cash + refunds. Less critical numbers, smaller. */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard
              icon={Wallet}
              label="Cash at gyms (paid)"
              value={`฿${data.totals.cash_paid_thb.toLocaleString()}`}
              sub={`${data.totals.cash_paid_count} booking${data.totals.cash_paid_count === 1 ? "" : "s"}`}
              tone="zinc"
            />
            <StatCard
              icon={AlertCircle}
              label="Cash pending"
              value={`฿${data.totals.cash_pending_thb.toLocaleString()}`}
              sub={`${data.totals.cash_pending_count} unsettled`}
              tone={data.totals.cash_pending_count > 0 ? "amber" : "zinc"}
            />
            <StatCard
              icon={AlertCircle}
              label="Refunds"
              value={
                data.totals.refunded_amount_usd_cents > 0
                  ? `$${(data.totals.refunded_amount_usd_cents / 100).toFixed(2)}`
                  : String(data.totals.refunded_count)
              }
              sub={`${data.totals.refunded_count} booking${data.totals.refunded_count === 1 ? "" : "s"}`}
              tone={data.totals.refunded_count > 0 ? "amber" : "zinc"}
            />
          </div>
        </>
      )}

      {/* Per-gym breakdown */}
      <div className="space-y-3">
        <SectionHeader title="By gym" subtitle="Tap a row to see every booking that contributed." />
        {loading && !data ? (
          <Surface>
            <div className="text-center py-12">
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
            </div>
          </Surface>
        ) : data && data.by_gym.length === 0 ? (
          <Surface>
            <div className="px-4 py-10 text-center text-[13px] text-zinc-500">
              No bookings in this period.
            </div>
          </Surface>
        ) : data ? (
          <Surface>
            {/* Mobile: card per gym. Desktop: table. */}
            <div className="hidden md:block">
              <div className="px-4 py-2.5 grid grid-cols-[minmax(140px,1fr)_repeat(6,minmax(0,1fr))_auto] gap-3 items-center text-[10px] uppercase tracking-[0.14em] text-zinc-600 border-b border-zinc-900/80">
                <span>Gym</span>
                <span className="text-right">Bookings</span>
                <span className="text-right">Stripe (USD)</span>
                <span className="text-right">Commission</span>
                <span className="text-right">Cash paid (THB)</span>
                <span className="text-right" title="Unsettled cash">Cash pending</span>
                <span className="text-right">Transfer (THB)</span>
                <span></span>
              </div>
              <ul className="divide-y divide-zinc-900/60">
                {data.by_gym.map((g) => (
                  <GymRowDesktop
                    key={g.org_id}
                    row={g}
                    recent={data.recent}
                    expanded={expanded.has(g.org_id)}
                    onToggle={() =>
                      setExpanded((s) => {
                        const next = new Set(s)
                        if (next.has(g.org_id)) next.delete(g.org_id)
                        else next.add(g.org_id)
                        return next
                      })
                    }
                  />
                ))}
              </ul>
            </div>

            {/* Mobile */}
            <ul className="md:hidden divide-y divide-zinc-900/60">
              {data.by_gym.map((g) => (
                <GymRowMobile
                  key={g.org_id}
                  row={g}
                  recent={data.recent}
                  expanded={expanded.has(g.org_id)}
                  onToggle={() =>
                    setExpanded((s) => {
                      const next = new Set(s)
                      if (next.has(g.org_id)) next.delete(g.org_id)
                      else next.add(g.org_id)
                      return next
                    })
                  }
                />
              ))}
            </ul>
          </Surface>
        ) : null}
      </div>

      {/* Recent activity tail */}
      {data && data.recent.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            title="Recent activity"
            subtitle="Last 50 bookings across the network."
          />
          <Surface>
            <ul className="divide-y divide-zinc-900/60">
              {data.recent.map((r) => (
                <li key={r.id} className="px-4 py-2.5 flex items-center gap-3 text-[12px]">
                  <div className="min-w-0 flex-1">
                    <p className="text-zinc-200 truncate">
                      {r.customer}
                      <span className="text-zinc-600 ml-1.5">·</span>
                      <span className="text-zinc-400 ml-1.5">{r.service}</span>
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {r.gym_name} · {r.booking_date}
                    </p>
                  </div>
                  <PaymentBadge row={r} />
                  <div className="text-right shrink-0 min-w-[80px]">
                    {r.payment_currency === "USD" ? (
                      <p className="text-zinc-200 tabular-nums">
                        ${((r.payment_amount_usd ?? 0) / 100).toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-zinc-200 tabular-nums">
                        ฿{(r.payment_amount_thb ?? 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Surface>
        </div>
      )}
    </div>
  )
}

/* ─── per-gym row (desktop table) ────────────────────────────────── */

function GymRowDesktop({
  row,
  recent,
  expanded,
  onToggle,
}: {
  row: GymRow
  recent: RecentRow[]
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <li>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 grid grid-cols-[minmax(140px,1fr)_repeat(6,minmax(0,1fr))_auto] gap-3 items-center text-[13px] text-left hover:bg-zinc-900/30 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-zinc-100 font-medium truncate">{row.gym_name}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">
            {row.stripe_onboarded ? "Stripe ready" : "Stripe not onboarded"}
            {row.refunded_count > 0 && ` · ${row.refunded_count} refunded`}
          </p>
        </div>
        <span className="text-right tabular-nums text-zinc-300">
          {row.total_bookings}
        </span>
        <span className="text-right tabular-nums">
          <span className={row.stripe_paid_usd_cents > 0 ? "text-emerald-300" : "text-zinc-600"}>
            ${(row.stripe_paid_usd_cents / 100).toFixed(2)}
          </span>
          <span className="text-[10px] text-zinc-600 ml-1">×{row.stripe_paid_count}</span>
        </span>
        <span className="text-right tabular-nums">
          <span className={row.platform_commission_usd_cents > 0 ? "text-indigo-300" : "text-zinc-600"}>
            ${(row.platform_commission_usd_cents / 100).toFixed(2)}
          </span>
        </span>
        <span className="text-right tabular-nums">
          <span className={row.cash_paid_thb > 0 ? "text-zinc-200" : "text-zinc-600"}>
            ฿{row.cash_paid_thb.toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-600 ml-1">×{row.cash_paid_count}</span>
        </span>
        <span className="text-right tabular-nums">
          <span className={row.cash_pending_thb > 0 ? "text-amber-300" : "text-zinc-600"}>
            ฿{row.cash_pending_thb.toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-600 ml-1">×{row.cash_pending_count}</span>
        </span>
        <span className="text-right tabular-nums">
          <span className={row.transfer_paid_thb > 0 ? "text-zinc-200" : "text-zinc-600"}>
            ฿{row.transfer_paid_thb.toLocaleString()}
          </span>
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        )}
      </button>
      {expanded && <GymDrawer row={row} recent={recent} />}
    </li>
  )
}

/* ─── per-gym row (mobile) ───────────────────────────────────────── */

function GymRowMobile({
  row,
  recent,
  expanded,
  onToggle,
}: {
  row: GymRow
  recent: RecentRow[]
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <li>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 text-left hover:bg-zinc-900/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[14px] font-medium text-zinc-100 truncate">
            {row.gym_name}
          </p>
          <span className="text-[11px] text-zinc-500 tabular-nums shrink-0">
            {row.total_bookings} bk
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
          <MobileCell
            label="Your Stripe"
            value={`$${(row.stripe_paid_usd_cents / 100).toFixed(2)}`}
            sub={`${row.stripe_paid_count} bk`}
            tone={row.stripe_paid_usd_cents > 0 ? "emerald" : "muted"}
          />
          <MobileCell
            label="Cash paid"
            value={`฿${row.cash_paid_thb.toLocaleString()}`}
            sub={`${row.cash_paid_count} bk`}
          />
          <MobileCell
            label="Cash pending"
            value={`฿${row.cash_pending_thb.toLocaleString()}`}
            sub={`${row.cash_pending_count} bk`}
            tone={row.cash_pending_count > 0 ? "amber" : "muted"}
          />
          <MobileCell
            label="Commission"
            value={`$${(row.platform_commission_usd_cents / 100).toFixed(2)}`}
            tone="indigo"
          />
        </div>
      </button>
      {expanded && <GymDrawer row={row} recent={recent} />}
    </li>
  )
}

function MobileCell({
  label,
  value,
  sub,
  tone = "zinc",
}: {
  label: string
  value: string
  sub?: string
  tone?: "zinc" | "indigo" | "emerald" | "amber" | "muted"
}) {
  const valueClass =
    tone === "muted"
      ? "text-zinc-600"
      : tone === "emerald"
        ? "text-emerald-300"
        : tone === "indigo"
          ? "text-indigo-300"
          : tone === "amber"
            ? "text-amber-300"
            : "text-zinc-200"
  return (
    <div className="bg-zinc-900/40 rounded-md px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-600">{label}</p>
      <p className={`tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="text-[9px] text-zinc-600">{sub}</p>}
    </div>
  )
}

/* ─── per-gym drill-down drawer ──────────────────────────────────── */

function GymDrawer({ row, recent }: { row: GymRow; recent: RecentRow[] }) {
  const items = recent.filter((r) => r.gym_name === row.gym_name).slice(0, 20)
  return (
    <div className="bg-zinc-950/60 px-4 py-3 space-y-3 border-t border-zinc-900/60">
      {/* Stripe accounting strip — gross / fees / net / your real take */}
      {row.stripe_paid_count > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          <Stat
            label="Stripe gross"
            value={`$${(row.stripe_paid_usd_cents / 100).toFixed(2)}`}
            sub={`${row.stripe_paid_count} bk`}
          />
          <Stat
            label="Stripe fees"
            value={`−$${(row.stripe_fee_usd_cents / 100).toFixed(2)}`}
            sub={
              row.stripe_fee_known_count < row.stripe_paid_count
                ? `${row.stripe_fee_known_count}/${row.stripe_paid_count} tracked`
                : "all tracked"
            }
            tone="amber"
          />
          <Stat
            label="Landed"
            value={`$${(row.stripe_net_usd_cents / 100).toFixed(2)}`}
            sub="Net to Stripe"
            tone="indigo"
          />
          <Stat
            label="Your real take"
            value={`$${Math.max(0, (row.platform_commission_usd_cents - row.stripe_fee_usd_cents) / 100).toFixed(2)}`}
            sub={`After fees, before payout to gym`}
            tone="indigo"
          />
        </div>
      )}

      {/* Quick reconciliation */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
        <Stat label="Total revenue (USD est.)" value={
          `$${(
            (row.stripe_paid_usd_cents +
              (row.cash_paid_thb + row.transfer_paid_thb) * 100 / THB_TO_USD_RATE) /
            100
          ).toFixed(2)}`
        } sub={`@ ฿${THB_TO_USD_RATE} / $1`} />
        <Stat label="Owed to gym (USD)" value={
          `$${(
            (row.stripe_paid_usd_cents -
              row.platform_commission_usd_cents -
              row.payouts_paid_usd_cents) /
            100
          ).toFixed(2)}`
        } sub={row.payouts_paid_usd_cents > 0 ? `After $${(row.payouts_paid_usd_cents / 100).toFixed(2)} paid out` : "Nothing paid out yet"} tone="indigo" />
        <Stat
          label="Refunds"
          value={
            row.refunded_amount_usd_cents > 0
              ? `$${(row.refunded_amount_usd_cents / 100).toFixed(2)}`
              : String(row.refunded_count)
          }
          sub={`${row.refunded_count} bk`}
          tone={row.refunded_count > 0 ? "amber" : "zinc"}
        />
      </div>

      {/* Most recent bookings for this gym */}
      {items.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
            Most recent {items.length} booking{items.length === 1 ? "" : "s"}
          </p>
          <ul className="divide-y divide-zinc-900/60 rounded-lg ring-1 ring-zinc-900 bg-zinc-950/40">
            {items.map((r) => (
              <li key={r.id} className="px-3 py-2 flex items-center gap-2 text-[11px]">
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-200 truncate">
                    {r.customer} <span className="text-zinc-600">·</span>{" "}
                    <span className="text-zinc-500">{r.service}</span>
                  </p>
                  <p className="text-[9px] text-zinc-600 mt-0.5">
                    {r.booking_date}
                    {r.stripe_payment_intent_id && (
                      <span className="ml-1.5 text-indigo-300/80 font-mono">
                        {r.stripe_payment_intent_id.slice(0, 20)}…
                      </span>
                    )}
                  </p>
                </div>
                <PaymentBadge row={r} />
                <div className="text-right shrink-0 min-w-[70px]">
                  {r.payment_currency === "USD" ? (
                    <p className="text-zinc-200 tabular-nums">
                      ${((r.payment_amount_usd ?? 0) / 100).toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-zinc-200 tabular-nums">
                      ฿{(r.payment_amount_thb ?? 0).toLocaleString()}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-[11px] text-zinc-600">
          No bookings in the recent window for this gym.
        </p>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  tone = "zinc",
}: {
  label: string
  value: string
  sub?: string
  tone?: "zinc" | "indigo" | "amber"
}) {
  const valueClass =
    tone === "indigo"
      ? "text-indigo-300"
      : tone === "amber"
        ? "text-amber-300"
        : "text-zinc-100"
  return (
    <div className="rounded-md bg-zinc-900/40 px-2.5 py-1.5">
      <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className={`tabular-nums text-[13px] font-medium ${valueClass}`}>{value}</p>
      {sub && <p className="text-[9px] text-zinc-600">{sub}</p>}
    </div>
  )
}

function PaymentBadge({ row }: { row: RecentRow }) {
  const method = row.payment_method ?? "unspecified"
  const status = row.payment_status ?? "unset"
  let label = method
  let tone = "zinc"
  if (method === "stripe" && status === "paid") {
    label = "Stripe ✓"
    tone = "emerald"
  } else if (method === "cash" && status === "paid") {
    label = "Cash ✓"
    tone = "zinc"
  } else if (method === "cash" && status === "pending") {
    label = "Cash pending"
    tone = "amber"
  } else if (method === "transfer" && status === "paid") {
    label = "Transfer ✓"
    tone = "zinc"
  } else if (status === "refunded") {
    label = "Refunded"
    tone = "red"
  } else if (!row.payment_method) {
    label = "Unspecified"
    tone = "zinc-muted"
  }
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25"
      : tone === "amber"
        ? "bg-amber-500/15 text-amber-200 ring-amber-500/25"
        : tone === "red"
          ? "bg-red-500/15 text-red-200 ring-red-500/25"
          : tone === "zinc-muted"
            ? "bg-zinc-800/60 text-zinc-500 ring-zinc-700/40"
            : "bg-zinc-800 text-zinc-300 ring-zinc-700/60"
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ring-1 whitespace-nowrap shrink-0 ${toneClass}`}
    >
      {tone === "emerald" && <CheckCircle2 className="h-2.5 w-2.5" />}
      {label}
    </span>
  )
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
