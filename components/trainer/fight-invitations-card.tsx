"use client"

/**
 * Fight invitations card — surfaced on the trainer "Today" view.
 *
 * Shows any pending bout invitations the current fighter has received,
 * with one-click accept / decline. Accepting populates the bout's
 * fighter_red_id / fighter_blue_id; declining leaves the bout corner
 * open for the promoter to invite someone else.
 *
 * Hides itself entirely when there are no pending invitations so the
 * dashboard stays clean for fighters who aren't currently being
 * scouted.
 */
import { useEffect, useState } from "react"
import { Loader2, Swords, X, Check } from "lucide-react"

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

interface FightInvitation {
  id: string
  bout_id: string
  corner: "red" | "blue"
  status: "pending"
  message: string | null
  created_at: string
  bout: BoutLite | null
  inviting_org: InvitingOrg | null
}

export default function FightInvitationsCard() {
  const [invitations, setInvitations] = useState<FightInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)
  const [declinePromptFor, setDeclinePromptFor] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")

  useEffect(() => {
    fetch("/api/fighter/invitations?status=pending")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = (data?.invitations ?? []) as FightInvitation[]
        setInvitations(list.filter((i) => i.status === "pending"))
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
        // Optimistic remove — invitation is no longer pending.
        setInvitations((prev) => prev.filter((i) => i.id !== invId))
        setDeclinePromptFor(null)
        setDeclineReason("")
      }
    } catch {
      // Silent — leaving the card visible is the right failure mode;
      // user can retry.
    } finally {
      setResponding(null)
    }
  }

  // Hide entirely when nothing to show. Loading state is silent (no
  // skeleton) since the dashboard is busy enough already.
  if (loading || invitations.length === 0) return null

  return (
    <div className="rounded-xl ring-1 ring-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] to-zinc-900/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-500/15">
        <Swords className="h-3.5 w-3.5 text-amber-300" />
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-amber-200">
          Fight invitations
        </p>
        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
          {invitations.length}
        </span>
      </div>
      <ul className="divide-y divide-amber-500/10">
        {invitations.map((inv) => {
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
    </div>
  )
}
