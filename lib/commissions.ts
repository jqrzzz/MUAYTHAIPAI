/**
 * Trainer commission computation.
 *
 * Pure function — given a trainer's commission rules + a list of
 * bookings they taught, returns line items + totals.
 *
 * Rule resolution per booking (most → least specific):
 *   1. Active rule for (trainer_id, service_id) — service-specific
 *   2. Active rule for (trainer_id, service_id=NULL) — trainer default
 *   3. No rule → 0 commission, flagged
 */

export interface CommissionRule {
  id: string
  trainer_id: string
  service_id: string | null
  rule_type: "percent" | "flat"
  percent_of_revenue: number | null
  flat_amount_thb: number | null
  only_completed: boolean
  pay_for_no_show: boolean
  effective_from: string // YYYY-MM-DD
  effective_to: string | null
  is_active: boolean
}

export interface BookingForCommission {
  id: string
  trainer_id: string | null
  service_id: string
  booking_date: string // YYYY-MM-DD
  status: string
  payment_status: string
  payment_amount_thb: number | null
  service_name?: string | null
}

export interface CommissionLineItem {
  booking_id: string
  booking_date: string
  service_name: string | null
  status: string
  payment_amount_thb: number
  commission_thb: number
  rule_id: string | null
  rule_summary: string
  flagged_reason: string | null
}

export interface CommissionResult {
  line_items: CommissionLineItem[]
  total_sessions: number
  total_commission_thb: number
  total_revenue_thb: number
  flagged_count: number
}

function isRuleApplicable(rule: CommissionRule, dateStr: string): boolean {
  if (!rule.is_active) return false
  if (rule.effective_from && dateStr < rule.effective_from) return false
  if (rule.effective_to && dateStr > rule.effective_to) return false
  return true
}

function resolveRule(
  rules: CommissionRule[],
  trainerId: string,
  serviceId: string,
  dateStr: string,
): CommissionRule | null {
  const applicable = rules.filter(
    (r) => r.trainer_id === trainerId && isRuleApplicable(r, dateStr),
  )
  // Service-specific wins over default
  return (
    applicable.find((r) => r.service_id === serviceId) ??
    applicable.find((r) => r.service_id === null) ??
    null
  )
}

export function computeCommissions(
  bookings: BookingForCommission[],
  rules: CommissionRule[],
): CommissionResult {
  const items: CommissionLineItem[] = []
  let totalCommission = 0
  let totalRevenue = 0
  let flaggedCount = 0

  for (const b of bookings) {
    if (!b.trainer_id) continue

    const amount = b.payment_amount_thb ?? 0
    totalRevenue += amount

    const rule = resolveRule(rules, b.trainer_id, b.service_id, b.booking_date)

    let commission = 0
    let ruleSummary = "no rule"
    let flagged: string | null = null

    if (!rule) {
      flagged = "No commission rule for this trainer/service"
      flaggedCount++
    } else {
      // Apply status filters
      const isCompleted = b.status === "completed"
      const isNoShow = b.status === "no_show"
      if (rule.only_completed && !isCompleted && !(isNoShow && rule.pay_for_no_show)) {
        flagged = `Status=${b.status} — rule requires completed`
      } else if (rule.rule_type === "percent" && rule.percent_of_revenue != null) {
        commission = Math.round((amount * rule.percent_of_revenue) / 100)
        ruleSummary = `${rule.percent_of_revenue}% of ฿${amount.toLocaleString()}`
      } else if (rule.rule_type === "flat" && rule.flat_amount_thb != null) {
        commission = rule.flat_amount_thb
        ruleSummary = `฿${rule.flat_amount_thb.toLocaleString()} flat`
      } else {
        flagged = "Rule misconfigured"
        flaggedCount++
      }
    }

    items.push({
      booking_id: b.id,
      booking_date: b.booking_date,
      service_name: b.service_name ?? null,
      status: b.status,
      payment_amount_thb: amount,
      commission_thb: commission,
      rule_id: rule?.id ?? null,
      rule_summary: ruleSummary,
      flagged_reason: flagged,
    })

    if (!flagged) totalCommission += commission
  }

  return {
    line_items: items,
    total_sessions: items.length,
    total_commission_thb: totalCommission,
    total_revenue_thb: totalRevenue,
    flagged_count: flaggedCount,
  }
}

/**
 * Group line items by trainer for the summary view.
 */
export function groupByTrainer(
  bookings: BookingForCommission[],
  rules: CommissionRule[],
): Map<string, CommissionResult> {
  const byTrainer = new Map<string, BookingForCommission[]>()
  for (const b of bookings) {
    if (!b.trainer_id) continue
    const arr = byTrainer.get(b.trainer_id) ?? []
    arr.push(b)
    byTrainer.set(b.trainer_id, arr)
  }
  const out = new Map<string, CommissionResult>()
  for (const [trainerId, list] of byTrainer.entries()) {
    out.set(trainerId, computeCommissions(list, rules))
  }
  return out
}
