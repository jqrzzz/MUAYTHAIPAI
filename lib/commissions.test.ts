import { describe, it, expect } from "vitest"
import {
  computeCommissions,
  groupByTrainer,
  type BookingForCommission,
  type CommissionRule,
} from "@/lib/commissions"

// Trainer payouts are real money — these tests pin the rule-resolution and
// totalling behaviour the payouts tab settles against.

const T1 = "trainer-1"
const T2 = "trainer-2"
const SVC_A = "svc-a"
const SVC_B = "svc-b"

function booking(over: Partial<BookingForCommission> = {}): BookingForCommission {
  return {
    id: over.id ?? "b1",
    trainer_id: T1,
    service_id: SVC_A,
    booking_date: "2026-06-01",
    status: "completed",
    payment_status: "paid",
    payment_amount_thb: 1000,
    service_name: "Private Lesson",
    ...over,
  }
}

function rule(over: Partial<CommissionRule> = {}): CommissionRule {
  return {
    id: over.id ?? "r1",
    trainer_id: T1,
    service_id: null,
    rule_type: "percent",
    percent_of_revenue: 30,
    flat_amount_thb: null,
    only_completed: false,
    pay_for_no_show: false,
    effective_from: "2026-01-01",
    effective_to: null,
    is_active: true,
    ...over,
  }
}

describe("computeCommissions", () => {
  it("applies a percent rule and rounds to whole baht", () => {
    const res = computeCommissions(
      [booking({ payment_amount_thb: 999 })],
      [rule({ percent_of_revenue: 33 })],
    )
    // 999 * 33% = 329.67 → Math.round → 330
    expect(res.total_commission_thb).toBe(330)
    expect(res.total_revenue_thb).toBe(999)
    expect(res.line_items[0].flagged_reason).toBeNull()
  })

  it("applies a flat rule regardless of booking amount", () => {
    const res = computeCommissions(
      [booking({ payment_amount_thb: 5000 })],
      [rule({ rule_type: "flat", flat_amount_thb: 250, percent_of_revenue: null })],
    )
    expect(res.total_commission_thb).toBe(250)
  })

  it("prefers a service-specific rule over the trainer default", () => {
    const res = computeCommissions(
      [booking({ service_id: SVC_A })],
      [
        rule({ id: "default", service_id: null, percent_of_revenue: 10 }),
        rule({ id: "specific", service_id: SVC_A, percent_of_revenue: 50 }),
      ],
    )
    expect(res.total_commission_thb).toBe(500)
    expect(res.line_items[0].rule_id).toBe("specific")
  })

  it("falls back to the trainer default when no service rule matches", () => {
    const res = computeCommissions(
      [booking({ service_id: SVC_B })],
      [
        rule({ id: "default", service_id: null, percent_of_revenue: 10 }),
        rule({ id: "specific", service_id: SVC_A, percent_of_revenue: 50 }),
      ],
    )
    expect(res.line_items[0].rule_id).toBe("default")
    expect(res.total_commission_thb).toBe(100)
  })

  it("flags bookings with no applicable rule and excludes them from the total", () => {
    const res = computeCommissions([booking({ trainer_id: T2 })], [rule()])
    expect(res.flagged_count).toBe(1)
    expect(res.total_commission_thb).toBe(0)
    expect(res.line_items[0].flagged_reason).toMatch(/no commission rule/i)
  })

  it("respects only_completed: non-completed bookings earn nothing", () => {
    const res = computeCommissions(
      [booking({ status: "pending" })],
      [rule({ only_completed: true })],
    )
    expect(res.total_commission_thb).toBe(0)
    expect(res.line_items[0].flagged_reason).toMatch(/requires completed/i)
    // Documented quirk: status-filtered rows set flagged_reason but do NOT
    // increment flagged_count (only missing/misconfigured rules do).
    expect(res.flagged_count).toBe(0)
  })

  it("pays no-shows only when pay_for_no_show is set", () => {
    const rules = [rule({ only_completed: true, pay_for_no_show: true })]
    const paid = computeCommissions([booking({ status: "no_show" })], rules)
    expect(paid.total_commission_thb).toBe(300)

    const unpaid = computeCommissions(
      [booking({ status: "no_show" })],
      [rule({ only_completed: true, pay_for_no_show: false })],
    )
    expect(unpaid.total_commission_thb).toBe(0)
  })

  it("ignores rules outside their effective window or inactive", () => {
    const expired = computeCommissions(
      [booking({ booking_date: "2026-06-01" })],
      [rule({ effective_to: "2026-05-31" })],
    )
    expect(expired.line_items[0].flagged_reason).toMatch(/no commission rule/i)

    const inactive = computeCommissions([booking()], [rule({ is_active: false })])
    expect(inactive.line_items[0].flagged_reason).toMatch(/no commission rule/i)

    const future = computeCommissions(
      [booking({ booking_date: "2026-06-01" })],
      [rule({ effective_from: "2026-07-01" })],
    )
    expect(future.line_items[0].flagged_reason).toMatch(/no commission rule/i)
  })

  it("skips bookings without a trainer entirely (no line item, no revenue)", () => {
    const res = computeCommissions(
      [booking({ trainer_id: null }), booking({ id: "b2" })],
      [rule()],
    )
    expect(res.line_items).toHaveLength(1)
    expect(res.total_revenue_thb).toBe(1000)
    expect(res.total_sessions).toBe(1)
  })

  it("flags a misconfigured rule (percent type with null percent)", () => {
    const res = computeCommissions(
      [booking()],
      [rule({ percent_of_revenue: null })],
    )
    expect(res.line_items[0].flagged_reason).toMatch(/misconfigured/i)
    expect(res.flagged_count).toBe(1)
    expect(res.total_commission_thb).toBe(0)
  })
})

describe("groupByTrainer", () => {
  it("computes each trainer's totals against the shared rule set", () => {
    const bookings = [
      booking({ id: "b1", trainer_id: T1, payment_amount_thb: 1000 }),
      booking({ id: "b2", trainer_id: T2, payment_amount_thb: 2000 }),
      booking({ id: "b3", trainer_id: null }),
    ]
    const rules = [
      rule({ id: "r1", trainer_id: T1, percent_of_revenue: 30 }),
      rule({ id: "r2", trainer_id: T2, percent_of_revenue: 10 }),
    ]
    const grouped = groupByTrainer(bookings, rules)
    expect([...grouped.keys()].sort()).toEqual([T1, T2])
    expect(grouped.get(T1)!.total_commission_thb).toBe(300)
    expect(grouped.get(T2)!.total_commission_thb).toBe(200)
  })
})
