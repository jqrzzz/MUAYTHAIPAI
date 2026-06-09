"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Loader2, MapPin, Calendar, Receipt, RefreshCw } from "lucide-react"

interface Customer {
  email: string
  name: string
  bookings: number
  paid: number
  gyms: string[]
  firstBooking: string
  lastBooking: string
  spentThb: number
}

const baht = (n: number) => `฿${Math.round(n).toLocaleString()}`

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(`${iso}T00:00:00`).getTime()
  const days = Math.floor(ms / 86400_000)
  if (days <= 0) return "today"
  if (days === 1) return "1d ago"
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/platform-admin/customers", { cache: "no-store" })
      if (!res.ok) throw new Error("failed")
      const d = await res.json()
      setCustomers(d.customers ?? [])
      setTotal(d.totalCustomers ?? 0)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.includes(q),
    )
  }, [customers, search])

  const totalSpend = useMemo(
    () => customers.reduce((s, c) => s + c.spentThb, 0),
    [customers],
  )

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading customers…
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="py-8 text-center text-sm text-zinc-400">
          Couldn&apos;t load customers.{" "}
          <button onClick={refresh} className="text-indigo-300 underline">
            Try again
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Users className="h-3.5 w-3.5 text-indigo-400" />
            Customers
          </div>
          <p className="mt-1.5 text-2xl font-bold text-white">{total.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-neutral-500">unique people, all gyms</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Receipt className="h-3.5 w-3.5 text-indigo-400" />
            Bookings
          </div>
          <p className="mt-1.5 text-2xl font-bold text-white">
            {customers.reduce((s, c) => s + c.bookings, 0).toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">across all customers</p>
        </div>
        <div className="col-span-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            Booked revenue
          </div>
          <p className="mt-1.5 text-2xl font-bold text-white">{baht(totalSpend)}</p>
          <p className="mt-0.5 text-xs text-neutral-500">paid bookings, THB-equiv.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-3 h-4 w-4 text-zinc-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="bg-zinc-900 border-zinc-700 pl-8 text-white"
        />
      </div>

      {/* List */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <Users className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p>{customers.length === 0 ? "No customers yet" : "No matches"}</p>
              <p className="mt-1 text-sm">
                {customers.length === 0
                  ? "Customers appear here as soon as someone books on a gym's site."
                  : "Try a different name or email."}
              </p>
            </div>
          ) : (
            <div className="max-h-[68vh] divide-y divide-zinc-800 overflow-y-auto">
              {filtered.map((c) => (
                <div key={c.email} className="flex items-start gap-3 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm text-zinc-300">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-white">{c.name}</p>
                      {c.spentThb > 0 && (
                        <Badge className="gap-1 bg-emerald-700/80 text-xs text-white">
                          {baht(c.spentThb)}
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-500">{c.email}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <Receipt className="h-3 w-3" />
                        {c.bookings} booking{c.bookings === 1 ? "" : "s"}
                        {c.paid > 0 && <span className="text-zinc-600">· {c.paid} paid</span>}
                      </span>
                      {c.gyms.length > 0 && (
                        <span className="inline-flex items-center gap-1" title={c.gyms.join(", ")}>
                          <MapPin className="h-3 w-3" />
                          {c.gyms.length === 1 ? c.gyms[0] : `${c.gyms.length} gyms`}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        {timeAgo(c.lastBooking)}
                      </span>
                    </div>
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
