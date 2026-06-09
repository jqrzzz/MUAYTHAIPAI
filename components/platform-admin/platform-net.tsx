"use client"

import { useCallback, useEffect, useState } from "react"
import { Banknote, Receipt, RefreshCw, Repeat, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CHART_COLORS, KpiCard } from "@/components/admin/analytics-ui"

interface Recon {
  rate: number
  saas: { netUsd: number; grossUsd: number; available: boolean }
  bookings: {
    commissionUsd: number
    feesUsd: number
    netUsd: number
    grossUsd: number
    feesAvailable: boolean
  }
  owedToGymsUsd: number
  platformNetUsd: number
}

const usd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const thbHint = (n: number, rate: number) => `≈฿${Math.round(n * rate).toLocaleString()}`

function Line({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "border-t border-neutral-800 pt-2.5 mt-1" : ""}`}>
      <span className={`text-sm ${muted ? "text-neutral-500" : strong ? "text-white font-medium" : "text-neutral-300"}`}>
        {label}
      </span>
      <span className={`text-sm tabular-nums ${strong ? "text-white font-semibold" : muted ? "text-neutral-500" : "text-neutral-200"}`}>
        {value}
      </span>
    </div>
  )
}

export default function PlatformNet() {
  const [data, setData] = useState<Recon | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/platform-admin/reconciliation")
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
      <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading platform net…
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="py-8 text-center text-sm text-neutral-400">
          Couldn&apos;t load the net breakdown.{" "}
          <button onClick={refresh} className="text-indigo-300 underline">
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  const { rate, saas, bookings, owedToGymsUsd, platformNetUsd } = data

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Platform net</h2>
          <p className="text-xs text-zinc-500">What OckOck actually keeps, after Stripe fees and gym payouts</p>
        </div>
        <button
          onClick={refresh}
          className="rounded-lg border border-neutral-700 p-1.5 text-neutral-400 hover:text-white"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={TrendingUp} label="Platform net" value={usd(platformNetUsd)} sub={thbHint(platformNetUsd, rate)} accent={CHART_COLORS.paid} />
        <KpiCard
          icon={Repeat}
          label="Subscriptions (net)"
          value={saas.available ? usd(saas.netUsd) : "—"}
          sub={saas.available ? "after Stripe fees" : "needs migration 040"}
          accent={CHART_COLORS.online}
        />
        <KpiCard
          icon={Receipt}
          label="Booking commission"
          value={usd(bookings.netUsd)}
          sub="we take 0% of bookings"
          accent={CHART_COLORS.indigo}
        />
        <KpiCard icon={Banknote} label="Owed to gyms" value={usd(owedToGymsUsd)} sub={thbHint(owedToGymsUsd, rate)} accent={CHART_COLORS.pending} />
      </div>

      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader className="pb-1">
          <CardTitle className="text-white text-base">How it&apos;s computed</CardTitle>
          <CardDescription>Platform revenue is your subscriptions — we take 0% of bookings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Line label="Subscription revenue (net)" value={saas.available ? usd(saas.netUsd) : "—"} />
          <Line label="Booking commission (0%)" value={usd(bookings.commissionUsd)} />
          <Line
            label="Stripe fees on bookings"
            value={bookings.feesAvailable ? `− ${usd(bookings.feesUsd)}` : "pending"}
            muted
          />
          <Line label="Platform net" value={usd(platformNetUsd)} strong />
          <div className="pt-1.5" />
          <Line label="Owed to gyms (settled via Payouts)" value={usd(owedToGymsUsd)} muted />
        </CardContent>
      </Card>

      {(!saas.available || !bookings.feesAvailable) && (
        <div className="space-y-2">
          {!bookings.feesAvailable && (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-[12px] text-amber-200/90">
              Stripe fees on bookings aren&apos;t captured yet — apply{" "}
              <code className="text-amber-100">039-add-stripe-fee-tracking.sql</code>. Until then, booking
              net is shown gross of fees, and online bookings can&apos;t persist their fee snapshot.
            </p>
          )}
          {!saas.available && (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-[12px] text-amber-200/90">
              Subscription revenue isn&apos;t being recorded yet — apply{" "}
              <code className="text-amber-100">040-add-subscription-revenue-tracking.sql</code> to capture
              it. (Currently $0: no active paid subscriptions.)
            </p>
          )}
        </div>
      )}
    </div>
  )
}
