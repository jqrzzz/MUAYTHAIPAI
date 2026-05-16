"use client"

/**
 * Upcoming fights card — trainer "Today" view widget.
 *
 * Surfaces confirmed bouts the fighter has coming up (events they
 * accepted invitations to, plus any direct-assigned bouts). Hides
 * itself entirely when there's nothing scheduled so the dashboard
 * stays clean for trainers who don't fight.
 *
 * Sister widget to FightInvitationsCard:
 *   FightInvitationsCard → things you need to respond to
 *   UpcomingFightsCard   → things that are locked in
 */
import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, MapPin, Swords, Loader2 } from "lucide-react"

interface UpcomingBout {
  id: string
  corner: "red" | "blue"
  weight_class: string | null
  scheduled_rounds: number
  is_main_event: boolean
  bout_order: number | null
  opponent_name: string | null
  opponent_id: string | null
  event: {
    id: string
    name: string
    event_date: string | null
    event_time: string | null
    venue_name: string | null
    venue_city: string | null
  }
}

export default function UpcomingFightsCard() {
  const [bouts, setBouts] = useState<UpcomingBout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/fighter/upcoming-bouts")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setBouts((data?.bouts ?? []) as UpcomingBout[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Hide entirely when empty so non-fighters don't see a phantom
  // widget. Loading state is silent — dashboard is busy enough.
  if (loading) return null
  if (bouts.length === 0) return null

  const next = bouts[0]
  const later = bouts.slice(1)

  return (
    <div className="rounded-xl ring-1 ring-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.08] to-zinc-900/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-500/15">
        <Swords className="h-3.5 w-3.5 text-emerald-300" />
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
          Upcoming fights
        </p>
        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200">
          {bouts.length}
        </span>
      </div>

      {/* Next bout — bigger card, full detail. */}
      <BoutRow bout={next} primary />

      {/* Remaining bouts — compact list under a thin divider. */}
      {later.length > 0 && (
        <div className="border-t border-emerald-500/10">
          <ul className="divide-y divide-zinc-900/60">
            {later.map((b) => (
              <BoutRow key={b.id} bout={b} primary={false} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function BoutRow({ bout, primary }: { bout: UpcomingBout; primary: boolean }) {
  const ev = bout.event
  const dateLabel = ev.event_date
    ? new Date(ev.event_date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: primary ? "long" : "short",
        month: "short",
        day: "numeric",
      })
    : "Date TBD"
  const venueLabel =
    [ev.venue_name, ev.venue_city].filter(Boolean).join(", ") || null
  const cornerDotColor = bout.corner === "red" ? "bg-red-400" : "bg-blue-400"

  return (
    <Link
      href={`/ockock/fights/${ev.id}`}
      className={`block px-4 py-3 transition-colors hover:bg-emerald-500/[0.04] ${
        primary ? "" : "py-2.5"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 inline-block h-2 w-2 rounded-full shrink-0 ${cornerDotColor}`}
          aria-label={`${bout.corner} corner`}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium text-white ${
              primary ? "text-[14px]" : "text-[13px] truncate"
            }`}
          >
            {ev.name}
          </p>
          {bout.opponent_name ? (
            <p className="text-[12px] text-zinc-300 mt-0.5">
              vs <span className="font-medium">{bout.opponent_name}</span>
              {bout.is_main_event && (
                <span className="ml-2 text-amber-300 font-medium">· Main event</span>
              )}
            </p>
          ) : (
            <p className="text-[12px] text-zinc-500 mt-0.5">
              Opponent TBD
              {bout.is_main_event && (
                <span className="ml-2 text-amber-300 font-medium">· Main event</span>
              )}
            </p>
          )}
          <p className="text-[11px] text-zinc-500 mt-1 inline-flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" />
            {dateLabel}
            {ev.event_time && ` · ${ev.event_time.slice(0, 5)}`}
          </p>
          {venueLabel && (
            <p className="text-[11px] text-zinc-500 mt-0.5 inline-flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {venueLabel}
            </p>
          )}
          {primary && (
            <p className="text-[11px] text-zinc-500 mt-1">
              {bout.scheduled_rounds} rounds
              {bout.weight_class && ` · ${bout.weight_class}`}
              {" · "}
              <span className="capitalize">{bout.corner} corner</span>
            </p>
          )}
        </div>
        {primary && (
          <Loader2 className="opacity-0 h-3 w-3" aria-hidden />
        )}
      </div>
    </Link>
  )
}
