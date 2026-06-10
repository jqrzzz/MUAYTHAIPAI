"use client"

import { useCallback, useEffect, useState } from "react"
import { Banknote, CreditCard, Landmark, Receipt, RefreshCw, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard, CHART_COLORS, baht } from "@/components/admin/analytics-ui"

interface FinanceData {
  period: { from: string; to: string }
  online: {
    collectedUsd: number
    commissionUsd: number
    feeUsd?: number
    owedUsd: number
    count: number
  }
  /** THB card payments (cert/course enrollments) — gross of Stripe's fee. */
  onlineThb?: { collectedThb: number; count: number }
  cash: { paidThb: number; paidCount: number; pendingThb: number; pendingCount: number }
  transfer: { paidThb: number; paidCount: number }
  refunds: { count: number; amountUsd: number }
  payout: { status: string; payoutUsd: number; payoutThb: number; paidAt: string | null } | null
  recent: {
    id: string
    date: string
    customer: string
    service: string
    status: string
    currency?: "USD" | "THB"
    amountUsd: number
    amountThb?: number
    commissionUsd: number
  }[]
}

const usd = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function payoutLabel(status: string | undefined): { text: string; color: string } {
  switch (status) {
    case "paid":
      return { text: "Paid", color: CHART_COLORS.paid }
    case "pending":
      return { text: "Pending", color: CHART_COLORS.pending }
    default:
      return { text: "Not settled yet", color: CHART_COLORS.other }
  }
}

export default function PaymentsTab() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/admin/finance")
      if (!res.ok) throw new Error("failed")
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-neutral-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading payments…
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="py-8 text-center text-sm text-neutral-400">
          Couldn&apos;t load your payments.{" "}
          <button onClick={refresh} className="text-indigo-300 underline">
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  const monthLabel = new Date(`${data.period.from}T00:00:00`).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })
  const payout = payoutLabel(data.payout?.status)
  const thbCollected = data.onlineThb?.collectedThb ?? 0
  const thbCount = data.onlineThb?.count ?? 0
  const hasCashOrTransfer =
    data.cash.paidThb > 0 || data.cash.pendingThb > 0 || data.transfer.paidThb > 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Payments</h2>
          <p className="text-xs text-neutral-500">Online card revenue and what you&apos;re owed · {monthLabel}</p>
        </div>
        <button
          onClick={refresh}
          className="rounded-lg border border-neutral-700 p-1.5 text-neutral-400 hover:text-white"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* How online money works for the gym */}
      <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/[0.06] px-3.5 py-3 text-[12px] leading-relaxed text-indigo-100/90">
        Online card payments are collected securely through the MUAYTHAIPAI platform and settled to you in full — we
        take 0%; only Stripe&apos;s card fee comes off. Cash and bank transfers you take in person are yours in full —
        shown below for your records.
      </div>

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={CreditCard}
          label="Collected online ($)"
          value={usd(data.online.collectedUsd)}
          sub={`${data.online.count} card payment${data.online.count === 1 ? "" : "s"}`}
          accent={CHART_COLORS.online}
        />
        <KpiCard
          icon={Receipt}
          label="Collected online (฿)"
          value={baht(thbCollected)}
          sub={
            thbCount > 0
              ? `${thbCount} enrollment${thbCount === 1 ? "" : "s"} · cert & courses`
              : "cert & course enrollments"
          }
          accent={CHART_COLORS.online}
        />
        <KpiCard
          icon={Wallet}
          label="You're owed"
          value={usd(data.online.owedUsd)}
          sub={
            thbCollected > 0
              ? `plus ${baht(thbCollected)} less card fees`
              : "online, after Stripe's card fee"
          }
          accent={CHART_COLORS.paid}
        />
        <KpiCard
          icon={Banknote}
          label="Payout"
          value={payout.text}
          sub={
            data.payout?.status === "paid" && data.payout.paidAt
              ? `${usd(data.payout.payoutUsd)} · ${new Date(data.payout.paidAt).toLocaleDateString()}`
              : "for this period"
          }
          accent={payout.color}
        />
      </div>

      {/* Cash + transfer (collected directly by the gym) */}
      {hasCashOrTransfer && (
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader className="pb-1">
            <CardTitle className="text-white text-base">Collected in person</CardTitle>
            <CardDescription>Cash + bank transfer — you keep 100%</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <KpiCard
              icon={Banknote}
              label="Cash (paid)"
              value={baht(data.cash.paidThb)}
              sub={`${data.cash.paidCount} booking${data.cash.paidCount === 1 ? "" : "s"}`}
              accent={CHART_COLORS.cash}
            />
            <KpiCard
              icon={Banknote}
              label="Cash (due on arrival)"
              value={baht(data.cash.pendingThb)}
              sub={`${data.cash.pendingCount} pending`}
              accent={CHART_COLORS.pending}
            />
            <KpiCard
              icon={Landmark}
              label="Bank transfer"
              value={baht(data.transfer.paidThb)}
              sub={`${data.transfer.paidCount} booking${data.transfer.paidCount === 1 ? "" : "s"}`}
              accent={CHART_COLORS.transfer}
            />
          </CardContent>
        </Card>
      )}

      {/* Recent online payments */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader className="pb-1">
          <CardTitle className="text-white text-base">Recent online payments</CardTitle>
          <CardDescription>
            {data.refunds.count > 0
              ? `${data.refunds.count} refund${data.refunds.count === 1 ? "" : "s"} this period (${usd(data.refunds.amountUsd)})`
              : "Card payments this period"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-600">
              No online payments yet this period. Card bookings from your website show up here.
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {data.recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-neutral-200">{r.customer}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {r.service} · {new Date(`${r.date}T00:00:00`).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {r.currency === "THB" ? (
                      <>
                        <p className="text-sm tabular-nums text-white">{baht(r.amountThb ?? 0)}</p>
                        <p className="text-[11px] tabular-nums text-neutral-500">settled less card fee</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm tabular-nums text-white">{usd(r.amountUsd)}</p>
                        <p className="text-[11px] tabular-nums text-neutral-500">
                          you get {usd(r.amountUsd - r.commissionUsd)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
