"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Award, Loader2, Search, RefreshCw, ShieldOff, RotateCcw, Building2, Calendar } from "lucide-react"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

interface Cert {
  id: string
  level: string
  level_number: number | null
  certificate_number: string | null
  status: string
  issued_at: string | null
  student_name: string | null
  student_email: string | null
  gym_name: string
  issued_by: string | null
}

const LEVELS: Record<string, { name: string; icon: string }> = Object.fromEntries(
  CERTIFICATION_LEVELS.map((l) => [l.id, { name: l.name, icon: l.icon }]),
)

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—")

export default function CertificatesView() {
  const [certs, setCerts] = useState<Cert[]>([])
  const [totals, setTotals] = useState({ total: 0, active: 0, revoked: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/platform-admin/certificates", { cache: "no-store" })
      if (!res.ok) throw new Error("failed")
      const d = await res.json()
      setCerts(d.certificates ?? [])
      setTotals({ total: d.total ?? 0, active: d.active ?? 0, revoked: d.revoked ?? 0 })
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
    return certs.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      if (!q) return true
      return (
        (c.student_name ?? "").toLowerCase().includes(q) ||
        (c.student_email ?? "").toLowerCase().includes(q) ||
        (c.certificate_number ?? "").toLowerCase().includes(q) ||
        c.gym_name.toLowerCase().includes(q) ||
        (LEVELS[c.level]?.name ?? c.level).toLowerCase().includes(q)
      )
    })
  }, [certs, search, statusFilter])

  const setStatus = async (id: string, status: "active" | "revoked") => {
    setBusyId(id)
    setActionError(null)
    try {
      const res = await fetch("/api/platform-admin/certificates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificate_id: id, status }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Couldn't update")
      }
      setConfirmId(null)
      refresh()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Couldn't update")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading certificates…
      </div>
    )
  }
  if (error) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="py-8 text-center text-sm text-zinc-400">
          Couldn&apos;t load certificates.{" "}
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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: totals.total, tone: "text-white" },
          { label: "Active", value: totals.active, tone: "text-emerald-300" },
          { label: "Revoked", value: totals.revoked, tone: "text-amber-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <p className="text-xs text-neutral-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.tone}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, gym, cert #, or level…"
            className="bg-zinc-900 border-zinc-700 pl-8 text-white"
          />
        </div>
        <div className="inline-flex overflow-hidden rounded-lg ring-1 ring-zinc-700">
          {(["all", "active", "revoked"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-[13px] capitalize transition-colors ${
                statusFilter === s ? "bg-indigo-500/20 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {actionError && <p className="text-[12px] text-red-400">{actionError}</p>}

      {/* List */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <Award className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p>{certs.length === 0 ? "No certificates issued yet" : "No matches"}</p>
              <p className="mt-1 text-sm">
                {certs.length === 0
                  ? "Certificates appear here as gyms sign off students through the ladder."
                  : "Try a different search or filter."}
              </p>
            </div>
          ) : (
            <div className="max-h-[68vh] divide-y divide-zinc-800 overflow-y-auto">
              {filtered.map((c) => {
                const lvl = LEVELS[c.level]
                const revoked = c.status === "revoked"
                return (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-lg">
                      {lvl?.icon ?? "🥋"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-white">
                          {c.student_name || c.student_email || "Unknown student"}
                        </p>
                        <Badge className="bg-zinc-700 text-xs text-zinc-200">{lvl?.name ?? c.level}</Badge>
                        {revoked && (
                          <Badge className="bg-amber-700/80 text-xs text-white">Revoked</Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {c.gym_name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {fmtDate(c.issued_at)}
                        </span>
                        {c.certificate_number && (
                          <span className="font-mono text-zinc-600">{c.certificate_number}</span>
                        )}
                      </div>
                    </div>
                    {revoked ? (
                      <button
                        onClick={() => setStatus(c.id, "active")}
                        disabled={busyId === c.id}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-zinc-300 ring-1 ring-zinc-800 hover:text-emerald-300 hover:ring-emerald-900/60 disabled:opacity-60"
                      >
                        {busyId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                        Reinstate
                      </button>
                    ) : confirmId === c.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setStatus(c.id, "revoked")}
                          disabled={busyId === c.id}
                          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
                        >
                          {busyId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Revoke"}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setActionError(null)
                          setConfirmId(c.id)
                        }}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-zinc-500 ring-1 ring-zinc-800 hover:text-red-300 hover:ring-red-900/60"
                      >
                        <ShieldOff className="h-3 w-3" />
                        Revoke
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
