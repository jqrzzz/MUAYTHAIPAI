"use client"

/**
 * Fight invitations card — trainer "Today" view widget.
 *
 * Two states surface here:
 *   - Pending invitations get the full action row (Accept / Decline)
 *   - Recent past invitations (accepted / declined / cancelled) show
 *     in a collapsed history disclosure so the fighter can audit
 *     what they responded to, what they missed, and who's been
 *     reaching out.
 *
 * Hides itself entirely when there's nothing in either bucket so the
 * dashboard stays clean for fighters who aren't currently being
 * scouted.
 */
import { useEffect, useState } from "react"
import { Loader2, Swords, X, Check, ChevronDown, ChevronUp } from "lucide-react"

interface BoutLite {
  id: string
  weight_class: string | null
  scheduled_rounds: number
  is_main_event: boolean
  event: {
    id: string
    name: string
    event_date: string | null
    venue_name: string | null
    venue_city: string | null
  } | null
}

interface InvitingOrg {
  id: string
  name: string
  city: string | null
}

type InvitationStatus = "pending" | "accepted" | "declined" | "cancelled"

interface FightInvitation {
  id: string
  bout_id: string
  corner: "red" | "blue"
  status: InvitationStatus
  message: string | null
  responded_at: string | null
  decline_reason: string | null
  created_at: string
  bout: BoutLite | null
  inviting_org: InvitingOrg | null
}

const HISTORY_LIMIT = 5

export default function FightInvitationsCard() {
  const [pending, setPending] = useState<FightInvitation[]>([])
  const [history, setHistory] = useState<FightInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)
  const [declinePromptFor, setDeclinePromptFor] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    // One round trip — pull everything and split client-side. Cheaper
    // than two fetches, and the lists are small (capped at HISTORY_LIMIT
    // for past + however many are pending).
    fetch("/api/fighter/invitations?status=all")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = (data?.invitations ?? []) as FightInvitation[]
        setPending(list.filter((i) => i.status === "pending"))
        setHistory(
          list
            .filter((i) => i.status !== "pending")
            .slice(0, HISTORY_LIMIT),
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function respond(invId: string, action: "accept" | "decline", reason?: string) {
    setResponding(invId)
    try {
      const res = await fetch(`/api/fighter/invitations/${invId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason ?? undefined }),
      })
      if (res.ok) {
        const moved = pending.find((i) => i.id === invId)
        setPending((prev) => prev.filter((i) => i.id !== invId))
        if (moved) {
          // Optimistic: drop it into the history list with the new status
          // so the fighter sees their response reflected immediately.
          const newStatus: InvitationStatus = action === "accept" ? "accepted" : "declined"
          setHistory((prev) =>
            [
              {
                ...moved,
                status: newStatus,
                responded_at: new Date().toISOString(),
                decline_reason: action === "decline" ? reason ?? null : null,
              },
              ...prev,
            ].slice(0, HISTORY_LIMIT),
          )
        }
        setDeclinePromptFor(null)
        setDeclineReason("")
      }
    } catch {
      // Silent — leaving the card visible is the right failure mode.
    } finally {
      setResponding(null)
    }
  }

  // Hide entirely when nothing to show. Loading state stays silent
  // (no skeleton) since the dashboard is busy enough already.
  if (loading || (pending.length === 0 && history.length === 0)) return null

  return (
    <div className="rounded-xl ring-1 ring-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] to-zinc-900/40 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-500/15">
        <Swords className="h-3.5 w-3.5 text-amber-300" />
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-amber-200">
          Fight invitations
        </p>
        {pending.length > 0 && (
          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
            {pending.length}
          </span>
        )}
      </div>

      {/* Pending list */}
      {pending.length > 0 && (
        <ul className="divide-y divide-amber-500/10">
          {pending.map((inv) => {
            const event = inv.bout?.event
            const eventDate = event?.event_date
              ? new Date(event.event_date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null
            const isResponding = responding === inv.id
            const isDecliningHere = declinePromptFor === inv.id
            return (
              <li key={inv.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1 inline-block h-2 w-2 rounded-full shrink-0 ${
                      inv.corner === "red" ? "bg-red-400" : "bg-blue-400"
                    }`}
                    aria-label={`${inv.corner} corner`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-white">
                      {event?.name ?? "Fight event"}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {inv.inviting_org?.name ?? "Promoter"}
                      {inv.inviting_org?.city && ` · ${inv.inviting_org.city}`}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {eventDate ?? "Date TBD"}
                      {event?.venue_name && ` · ${event.venue_name}`}
                      {event?.venue_city && ` · ${event.venue_city}`}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {inv.bout?.is_main_event ? (
                        <span className="text-amber-300 font-medium">Main event · </span>
                      ) : null}
                      {inv.bout?.scheduled_rounds ?? 5} rounds
                      {inv.bout?.weight_class && ` · ${inv.bout.weight_class}`}
                      {" · "}
                      <span className="capitalize">{inv.corner} corner</span>
                    </p>
                    {inv.message && (
                      <p className="mt-2 rounded-md bg-zinc-900/50 px-2.5 py-1.5 text-[11px] text-zinc-300 italic">
                        &ldquo;{inv.message}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {isDecliningHere ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      autoFocus
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      maxLength={500}
                      rows={2}
                      placeholder="Optional reason (e.g. injured, schedule conflict)"
                      className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[12px] text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => respond(inv.id, "decline", declineReason.trim() || undefined)}
                        disabled={isResponding}
                        className="flex-1 rounded-md bg-red-500/15 px-3 py-1.5 text-[12px] font-medium text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                      >
                        {isResponding ? (
                          <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Confirm decline"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setDeclinePromptFor(null)
                          setDeclineReason("")
                        }}
                        disabled={isResponding}
                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-[12px] text-zinc-400 hover:bg-zinc-800"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => respond(inv.id, "accept")}
                      disabled={isResponding}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-500/15 px-3 py-1.5 text-[12px] font-medium text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      {isResponding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Accept
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setDeclinePromptFor(inv.id)}
                      disabled={isResponding}
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-[12px] text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* History disclosure — appears below pending. Collapsed by default;
          one-click expand. Empty when there's nothing past to show. */}
      {history.length > 0 && (
        <div className="border-t border-amber-500/10">
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-900/30 transition-colors"
            aria-expanded={historyOpen}
          >
            <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
              Past invitations ({history.length}
              {history.length === HISTORY_LIMIT ? "+" : ""})
            </span>
            {historyOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-zinc-500" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            )}
          </button>
          {historyOpen && (
            <ul className="divide-y divide-zinc-900/60 border-t border-zinc-900/60">
              {history.map((inv) => (
                <HistoryRow key={inv.id} inv={inv} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function HistoryRow({ inv }: { inv: FightInvitation }) {
  const event = inv.bout?.event
  const eventDate = event?.event_date
    ? new Date(event.event_date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "Date TBD"

  const statusTone =
    inv.status === "accepted"
      ? { color: "text-emerald-400", label: "Accepted" }
      : inv.status === "declined"
        ? { color: "text-rose-400", label: "Declined" }
        : { color: "text-zinc-500", label: "Cancelled" }

  return (
    <li className="px-4 py-2.5">
      <div className="flex items-start gap-2">
        <span
          className={`mt-1 inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
            inv.corner === "red" ? "bg-red-400/60" : "bg-blue-400/60"
          }`}
          aria-label={`${inv.corner} corner`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] text-zinc-200 truncate">
              {event?.name ?? "Fight event"}
            </p>
            <p className={`text-[10px] font-medium ${statusTone.color} shrink-0`}>
              {statusTone.label}
            </p>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {inv.inviting_org?.name ?? "Promoter"} · {eventDate}
          </p>
          {inv.status === "declined" && inv.decline_reason && (
            <p className="mt-1 text-[11px] italic text-zinc-500 line-clamp-1">
              &ldquo;{inv.decline_reason}&rdquo;
            </p>
          )}
        </div>
      </div>
    </li>
  )
}
