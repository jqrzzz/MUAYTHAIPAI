"use client"

/**
 * Payouts tab — what each trainer is owed for the period.
 *
 * Default period: this month, ranges configurable. Per-trainer:
 *   - sessions taught
 *   - revenue generated for the gym
 *   - commission they're owed
 *   - flagged sessions (no rule, status mismatch, etc.)
 *   - "Settle" button → snapshots breakdown into trainer_payouts row
 *
 * Rules editor at the bottom — set the % or flat ฿ each trainer earns.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Loader2,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react"
import {
  Surface,
  SectionHeader,
  StatCard,
  EmptyState,
  SaasButton,
  SaasInput,
  SegmentedControl,
} from "@/components/saas"

interface TrainerSummary {
  trainer_id: string
  trainer_name: string
  total_sessions: number
  total_revenue_thb: number
  total_commission_thb: number
  flagged_count: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  line_items: any[]
}

interface PayoutsResponse {
  period: { from: string; to: string }
  summary: TrainerSummary[]
  totals: {
    sessions: number
    commission_thb: number
    revenue_thb: number
    flagged: number
  }
  prior_payouts: Array<{
    id: string
    trainer_id: string
    period_start: string
    period_end: string
    total_amount_thb: number
    status: string
    paid_at: string | null
  }>
}

interface CommissionRule {
  id: string
  trainer_id: string
  service_id: string | null
  rule_type: "percent" | "flat"
  percent_of_revenue: number | null
  flat_amount_thb: number | null
  only_completed: boolean
  pay_for_no_show: boolean
  effective_from: string
  effective_to: string | null
  is_active: boolean
  trainer?: { id: string; display_name: string | null } | null
  service?: { id: string; name: string } | null
}

type PeriodPreset = "month" | "last_month" | "week" | "custom"

export default function PayoutsTab() {
  const [data, setData] = useState<PayoutsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preset, setPreset] = useState<PeriodPreset>("month")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const range = useMemo(() => {
    const today = new Date()
    if (preset === "custom") {
      return { from: customFrom, to: customTo }
    }
    if (preset === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        from: start.toISOString().slice(0, 10),
        to: today.toISOString().slice(0, 10),
      }
    }
    if (preset === "last_month") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
      }
    }
    // week — last 7 days inclusive
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
      const res = await fetch(`/api/admin/payouts?${params}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load")
      setData(data as PayoutsResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to, preset, customFrom, customTo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const settle = async (trainerId: string) => {
    if (!data) return
    if (!confirm(`Settle this trainer's commission for ${data.period.from} → ${data.period.to}?`)) return
    try {
      const res = await fetch("/api/admin/payouts/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainer_id: trainerId,
          period_start: data.period.from,
          period_end: data.period.to,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Settle failed")
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Payouts"
        eyebrowIcon={DollarSign}
        size="lg"
        title="Trainer commissions"
        subtitle="What every trainer earned this period. Set commission rules at the bottom — percent of revenue or flat ฿ per session."
      />

      {/* Period selector */}
      <div className="flex flex-col gap-3">
        <div className="w-full max-w-md">
          <SegmentedControl<PeriodPreset>
            value={preset}
            onValueChange={setPreset}
            options={[
              { value: "month", label: "This month" },
              { value: "last_month", label: "Last month" },
              { value: "week", label: "Last 7 days" },
              { value: "custom", label: "Custom" },
            ]}
          />
        </div>
        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-2 max-w-md">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 mb-1">From</p>
              <SaasInput
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 mb-1">To</p>
              <SaasInput
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl ring-1 ring-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-300">
          {error}
          <p className="text-[11px] text-red-300/70 mt-1">
            If this is the first time, apply migration{" "}
            <code>scripts/036-add-trainer-commissions.sql</code> in Supabase.
          </p>
        </div>
      )}

      {/* Totals */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Sessions" value={data.totals.sessions} />
          <StatCard
            label="Revenue"
            value={`฿${data.totals.revenue_thb.toLocaleString()}`}
          />
          <StatCard
            label="Commission owed"
            value={`฿${data.totals.commission_thb.toLocaleString()}`}
            tone="indigo"
          />
          <StatCard
            label="Flagged"
            value={data.totals.flagged}
            tone={data.totals.flagged > 0 ? "amber" : "zinc"}
            sub={data.totals.flagged > 0 ? "Needs attention" : null}
          />
        </div>
      )}

      {/* Per-trainer breakdown */}
      {loading && !data ? (
        <Surface>
          <div className="text-center py-12">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
          </div>
        </Surface>
      ) : data && data.summary.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          tone="zinc"
          title="No trainer sessions in this period"
          description="When trainers teach bookings (with payment recorded), commissions show up here."
        />
      ) : (
        <Surface>
          <ul className="divide-y divide-zinc-900/80">
            {data?.summary.map((t) => {
              const isExpanded = expanded.has(t.trainer_id)
              return (
                <li key={t.trainer_id}>
                  <div className="px-4 py-3.5 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setExpanded((s) => {
                          const next = new Set(s)
                          if (next.has(t.trainer_id)) next.delete(t.trainer_id)
                          else next.add(t.trainer_id)
                          return next
                        })
                      }}
                      className="flex-1 text-left flex items-center gap-3 group"
                    >
                      <ChevronRight
                        className={`h-3.5 w-3.5 text-zinc-600 transition-transform ${
                          isExpanded ? "rotate-90 text-zinc-400" : ""
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-white">
                          {t.trainer_name}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {t.total_sessions} session{t.total_sessions === 1 ? "" : "s"}
                          {" · "}฿{t.total_revenue_thb.toLocaleString()} revenue
                          {t.flagged_count > 0 && (
                            <span className="text-amber-400 ml-1.5">
                              · {t.flagged_count} flagged
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                    <div className="text-right">
                      <p className="text-[16px] font-semibold tabular-nums text-indigo-300">
                        ฿{t.total_commission_thb.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-zinc-600">owed</p>
                    </div>
                    <SaasButton
                      size="sm"
                      onClick={() => settle(t.trainer_id)}
                      disabled={t.total_commission_thb === 0}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Settle
                    </SaasButton>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 -mt-1 space-y-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(t.line_items as any[]).map((li) => (
                        <div
                          key={li.booking_id}
                          className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-[12px] ${
                            li.flagged_reason
                              ? "bg-amber-500/[0.04] ring-1 ring-amber-500/20"
                              : "bg-zinc-900/40"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-zinc-200 truncate">
                              {li.service_name ?? "Session"}
                              <span className="text-zinc-500 ml-1.5">
                                · {li.booking_date}
                              </span>
                              <span className="text-zinc-600 ml-1.5">· {li.status}</span>
                            </p>
                            <p className="text-[10px] text-zinc-600 truncate">
                              {li.flagged_reason ? (
                                <span className="text-amber-400">
                                  ⚠ {li.flagged_reason}
                                </span>
                              ) : (
                                li.rule_summary
                              )}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-zinc-500 text-[10px]">
                              ฿{li.payment_amount_thb.toLocaleString()}
                            </p>
                            <p className="text-zinc-200 tabular-nums">
                              ฿{li.commission_thb.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Surface>
      )}

      {/* Prior settled payouts */}
      {data && data.prior_payouts.length > 0 && (
        <div className="space-y-2">
          <SectionHeader title="Settled in this period" eyebrow="History" />
          <Surface>
            <ul className="divide-y divide-zinc-900/80">
              {data.prior_payouts.map((p) => {
                const trainerName =
                  data.summary.find((t) => t.trainer_id === p.trainer_id)?.trainer_name ?? "Trainer"
                return (
                  <li
                    key={p.id}
                    className="px-4 py-2.5 flex items-center justify-between gap-3 text-[12px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-zinc-200">
                        {trainerName}
                        <span className="text-zinc-600 ml-1.5">
                          · {p.period_start} → {p.period_end}
                        </span>
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        {p.paid_at && new Date(p.paid_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-zinc-200 tabular-nums shrink-0">
                      ฿{p.total_amount_thb.toLocaleString()}
                    </p>
                  </li>
                )
              })}
            </ul>
          </Surface>
        </div>
      )}

      <RulesEditor onChange={refresh} />
    </div>
  )
}

/* ─── rules editor ───────────────────────────────────────────────── */

interface Trainer {
  id: string
  display_name: string | null
}

interface Service {
  id: string
  name: string
}

function RulesEditor({ onChange }: { onChange: () => void }) {
  const [rules, setRules] = useState<CommissionRule[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rulesRes, trainersRes, servicesRes] = await Promise.all([
        fetch("/api/admin/payouts/rules", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/admin/trainers", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ trainers: [] })),
        fetch("/api/admin/services", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ services: [] })),
      ])
      setRules(rulesRes.rules ?? [])
      setTrainers((trainersRes.trainers ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => ({ id: t.id, display_name: t.display_name ?? t.users?.full_name ?? t.users?.email })
      ))
      setServices((servicesRes.services ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) => ({ id: s.id, name: s.name })
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const removeRule = async (id: string) => {
    if (!confirm("Delete this rule?")) return
    await fetch(`/api/admin/payouts/rules/${id}`, { method: "DELETE" })
    refresh()
    onChange()
  }

  return (
    <div className="space-y-3">
      <SectionHeader
        eyebrow="Rules"
        eyebrowIcon={Settings}
        title="Commission rules"
        subtitle="Per trainer (and optionally per service). Service-specific rules override the trainer's default."
        action={
          <SaasButton size="sm" onClick={() => setShowAdd(true)} variant="subtle">
            <Plus className="h-3 w-3" />
            Add rule
          </SaasButton>
        }
      />

      {error && (
        <div className="rounded-lg ring-1 ring-red-500/20 bg-red-500/10 p-3 text-[12px] text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <Surface>
          <div className="text-center py-6 text-[12px] text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1.5" />
            Loading
          </div>
        </Surface>
      ) : rules.length === 0 ? (
        <Surface>
          <div className="px-4 py-6 text-center">
            <p className="text-[13px] text-zinc-300 font-medium">
              No commission rules yet
            </p>
            <p className="text-[12px] text-zinc-500 mt-1 mb-3">
              Add a rule to start tracking commissions automatically.
            </p>
            <SaasButton size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-3 w-3" />
              Add first rule
            </SaasButton>
          </div>
        </Surface>
      ) : (
        <Surface>
          <ul className="divide-y divide-zinc-900/80">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="px-4 py-2.5 flex items-center gap-3 text-[12px]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-200">
                    {rule.trainer?.display_name ?? "Trainer"}
                    <span className="text-zinc-500 ml-1.5">·</span>{" "}
                    <span className="text-zinc-400">
                      {rule.service?.name ?? "All services"}
                    </span>
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {rule.rule_type === "percent"
                      ? `${rule.percent_of_revenue}% of revenue`
                      : `฿${rule.flat_amount_thb?.toLocaleString()} flat per session`}
                    {rule.only_completed && " · completed only"}
                    {rule.pay_for_no_show && " · pays no-shows"}
                    {!rule.is_active && " · inactive"}
                  </p>
                </div>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Surface>
      )}

      {showAdd && (
        <AddRuleDialog
          trainers={trainers}
          services={services}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            refresh()
            onChange()
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

function AddRuleDialog({
  trainers,
  services,
  onClose,
  onCreated,
}: {
  trainers: Trainer[]
  services: Service[]
  onClose: () => void
  onCreated: () => void
}) {
  const [trainerId, setTrainerId] = useState(trainers[0]?.id ?? "")
  const [serviceId, setServiceId] = useState<string>("")
  const [ruleType, setRuleType] = useState<"percent" | "flat">("percent")
  const [percent, setPercent] = useState(50)
  const [flat, setFlat] = useState(500)
  const [onlyCompleted, setOnlyCompleted] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!trainerId) return
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        trainer_id: trainerId,
        service_id: serviceId || null,
        rule_type: ruleType,
        only_completed: onlyCompleted,
      }
      if (ruleType === "percent") body.percent_of_revenue = percent
      else body.flat_amount_thb = flat

      const res = await fetch("/api/admin/payouts/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl ring-1 ring-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-white">New commission rule</p>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1 -mr-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Trainer</p>
            <select
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="w-full bg-zinc-950/50 ring-1 ring-zinc-800 hover:ring-zinc-700 focus:ring-2 focus:ring-indigo-500/50 rounded-lg px-3 py-2 text-[13px] text-zinc-100 outline-none"
            >
              {trainers.length === 0 && <option value="">No trainers</option>}
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.display_name ?? "—"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Service (optional)
            </p>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full bg-zinc-950/50 ring-1 ring-zinc-800 hover:ring-zinc-700 focus:ring-2 focus:ring-indigo-500/50 rounded-lg px-3 py-2 text-[13px] text-zinc-100 outline-none"
            >
              <option value="">All services (default)</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Rule</p>
            <SegmentedControl<"percent" | "flat">
              value={ruleType}
              onValueChange={setRuleType}
              options={[
                { value: "percent", label: "% of revenue" },
                { value: "flat", label: "฿ flat" },
              ]}
            />
          </div>

          {ruleType === "percent" ? (
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Percent (0–100)
              </p>
              <SaasInput
                type="number"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value) || 0)}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Flat ฿ per session
              </p>
              <SaasInput
                type="number"
                min={0}
                value={flat}
                onChange={(e) => setFlat(Number(e.target.value) || 0)}
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-[12px] text-zinc-300 select-none">
            <input
              type="checkbox"
              checked={onlyCompleted}
              onChange={(e) => setOnlyCompleted(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900"
            />
            Only count completed sessions
          </label>

          {error && (
            <div className="rounded-lg ring-1 ring-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
              {error}
            </div>
          )}
        </div>
        <div className="px-4 py-3 border-t border-zinc-900 flex justify-end gap-2">
          <SaasButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </SaasButton>
          <SaasButton onClick={submit} loading={saving} disabled={!trainerId}>
            <CheckCircle2 className="h-3 w-3" />
            Create rule
          </SaasButton>
        </div>
      </div>
    </div>
  )
}
