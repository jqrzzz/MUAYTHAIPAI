"use client"

/**
 * Recent bookings tab with bulk actions for cash settlement and
 * attendance marking. Solves the data hygiene gap surfaced in the
 * bookings audit (large pile of pending-cash bookings in limbo).
 *
 * Selection model:
 *   - Each row has a checkbox
 *   - Header has a select-all / select-pending-cash shortcut
 *   - When >=1 selected, a sticky action bar appears with:
 *       Mark paid · Mark attended · Mark no-show
 */
import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  UserCheck,
  UserX,
  X,
} from "lucide-react"
import {
  Surface,
  SectionHeader,
  SaasInput,
  SaasButton,
  EmptyState,
} from "@/components/saas"

interface Booking {
  id: string
  guest_name: string | null
  guest_email: string | null
  booking_date: string
  booking_time: string | null
  status: string
  payment_status: string
  payment_method: string | null
  payment_amount_thb: number | null
  payment_amount_usd: number | null
  payment_currency: string | null
  services: { name: string; category: string } | null
}

const STATUS_TONE: Record<string, string> = {
  confirmed: "bg-indigo-500/15 text-indigo-200 ring-indigo-500/25",
  completed: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25",
  cancelled: "bg-red-500/15 text-red-200 ring-red-500/25",
  no_show: "bg-amber-500/15 text-amber-200 ring-amber-500/25",
}

export default function RecentTab({ bookings }: { bookings: Booking[] }) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const filtered = useMemo(() => {
    if (!search.trim()) return bookings
    const q = search.toLowerCase()
    return bookings.filter(
      (b) =>
        (b.guest_name || "").toLowerCase().includes(q) ||
        (b.services?.name || "").toLowerCase().includes(q) ||
        (b.guest_email || "").toLowerCase().includes(q),
    )
  }, [bookings, search])

  const pendingCashCount = useMemo(
    () =>
      filtered.filter(
        (b) => b.payment_status === "pending" && b.payment_method === "cash",
      ).length,
    [filtered],
  )

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelected(new Set(filtered.map((b) => b.id)))
  }

  const selectPendingCash = () => {
    setSelected(
      new Set(
        filtered
          .filter(
            (b) => b.payment_status === "pending" && b.payment_method === "cash",
          )
          .map((b) => b.id),
      ),
    )
  }

  const clearSelection = () => setSelected(new Set())

  const applyBulk = useCallback(
    async (updates: { payment_status?: string; status?: string }) => {
      if (selected.size === 0 || busy) return
      setBusy(true)
      setError(null)
      try {
        const res = await fetch("/api/admin/bookings/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selected), ...updates }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed")
        setSelected(new Set())
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setBusy(false)
      }
    },
    [selected, busy, router],
  )

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Activity"
        eyebrowIcon={Clock}
        title="Recent bookings"
        subtitle="Last 7 days. Tap checkboxes to bulk-mark paid or update attendance."
      />

      <Surface>
        <div className="px-4 py-3 border-b border-zinc-900/80 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <SaasInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or service…"
              className="pl-8"
            />
          </div>
          {pendingCashCount > 0 && (
            <button
              onClick={selectPendingCash}
              className="text-[11px] text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 shrink-0"
            >
              <CheckCircle2 className="h-3 w-3" />
              Select {pendingCashCount} pending cash
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No bookings yet"
            description="When customers book a class, they'll show up here."
          />
        ) : (
          <ul className="divide-y divide-zinc-900/60">
            {filtered.map((b) => {
              const isSelected = selected.has(b.id)
              const amount =
                b.payment_currency === "USD" || b.payment_method === "stripe"
                  ? b.payment_amount_usd
                    ? `$${(b.payment_amount_usd / 100).toFixed(2)}`
                    : null
                  : b.payment_amount_thb
                    ? `฿${b.payment_amount_thb.toLocaleString()}`
                    : null
              return (
                <li key={b.id}>
                  <label
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      isSelected ? "bg-indigo-500/[0.06]" : "hover:bg-zinc-900/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(b.id)}
                      className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 shrink-0"
                    />
                    <div className="text-center min-w-[62px] shrink-0">
                      <p className="text-[12px] font-medium text-zinc-300">
                        {formatDate(b.booking_date)}
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        {formatTime(b.booking_time)}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white truncate">
                        {b.guest_name || "Guest"}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {b.services?.name || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                      {amount && (
                        <span className="text-[12px] font-medium text-amber-300 tabular-nums">
                          {amount}
                        </span>
                      )}
                      <PaymentBadge
                        status={b.payment_status}
                        method={b.payment_method}
                      />
                      <StatusBadge status={b.status} />
                    </div>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </Surface>

      {/* Sticky bulk-action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-2xl z-40">
          <div className="rounded-2xl ring-1 ring-zinc-700 bg-zinc-950/95 backdrop-blur-md shadow-2xl px-4 py-3 flex items-center gap-2 flex-wrap">
            <p className="text-[12px] text-zinc-300 mr-1">
              <span className="font-semibold text-white">{selected.size}</span> selected
            </p>
            <button
              onClick={selectAllVisible}
              className="text-[11px] text-zinc-500 hover:text-zinc-200"
            >
              Select all
            </button>
            <button
              onClick={clearSelection}
              className="text-[11px] text-zinc-500 hover:text-zinc-200 ml-auto sm:ml-0"
            >
              <X className="h-3 w-3 inline" />
            </button>
            <div className="basis-full sm:basis-auto" />
            <SaasButton
              size="sm"
              onClick={() => applyBulk({ payment_status: "paid" })}
              loading={busy}
            >
              <CheckCircle2 className="h-3 w-3" />
              Mark paid
            </SaasButton>
            <SaasButton
              size="sm"
              variant="subtle"
              onClick={() => applyBulk({ status: "completed" })}
              disabled={busy}
            >
              <UserCheck className="h-3 w-3" />
              Attended
            </SaasButton>
            <SaasButton
              size="sm"
              variant="subtle"
              onClick={() => applyBulk({ status: "no_show" })}
              disabled={busy}
            >
              <UserX className="h-3 w-3" />
              No-show
            </SaasButton>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />}
          </div>
          {error && (
            <p className="mt-2 text-[11px] text-red-300 text-center">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── helpers ────────────────────────────────────────────────────── */

function formatTime(time: string | null): string {
  if (!time) return "—"
  return time.slice(0, 5)
}

function formatDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "bg-zinc-800 text-zinc-400 ring-zinc-700/40"
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.12em] font-medium px-1.5 py-0.5 rounded ring-1 ${tone}`}
    >
      {status === "no_show" ? "no-show" : status}
    </span>
  )
}

function PaymentBadge({
  status,
  method,
}: {
  status: string
  method: string | null
}) {
  if (status === "paid") {
    return (
      <span className="text-[10px] uppercase tracking-[0.12em] font-medium px-1.5 py-0.5 rounded ring-1 bg-emerald-500/15 text-emerald-200 ring-emerald-500/25">
        {method === "cash" ? "Cash ✓" : "Paid"}
      </span>
    )
  }
  if (status === "refunded") {
    return (
      <span className="text-[10px] uppercase tracking-[0.12em] font-medium px-1.5 py-0.5 rounded ring-1 bg-red-500/15 text-red-200 ring-red-500/25">
        Refunded
      </span>
    )
  }
  return (
    <span className="text-[10px] uppercase tracking-[0.12em] font-medium px-1.5 py-0.5 rounded ring-1 bg-amber-500/15 text-amber-200 ring-amber-500/25">
      {method === "cash" ? "Cash pending" : "Pending"}
    </span>
  )
}
