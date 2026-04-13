"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Swords,
  Ticket,
  Trophy,
  Star,
} from "lucide-react"

interface FighterInfo {
  id: string
  display_name: string
  photo_url: string | null
  fight_record_wins: number
  fight_record_losses: number
  fight_record_draws: number
  weight_class: string | null
  fighter_country: string | null
  organizations: { name: string; slug: string } | null
}

interface Bout {
  id: string
  bout_order: number
  weight_class: string | null
  scheduled_rounds: number
  is_main_event: boolean
  status: string
  result: string | null
  winner_id: string | null
  result_round: number | null
  result_notes: string | null
  fighter_red: FighterInfo | null
  fighter_blue: FighterInfo | null
}

interface TicketTier {
  id: string
  tier_name: string
  description: string | null
  price_thb: number
  price_usd: number | null
  quantity_total: number
  quantity_sold: number
  quantity_remaining: number
  is_active: boolean
}

interface FightEventDetail {
  id: string
  name: string
  description: string | null
  event_date: string
  event_time: string | null
  cover_image_url: string | null
  venue_name: string | null
  venue_address: string | null
  venue_city: string | null
  venue_province: string | null
  venue_country: string
  max_capacity: number | null
  status: string
  ticket_sales_open: boolean
  organizations: { name: string; slug: string; logo_url: string | null }
}

export default function FightDetailClient() {
  const params = useParams()
  const [event, setEvent] = useState<FightEventDetail | null>(null)
  const [bouts, setBouts] = useState<Bout[]>([])
  const [tickets, setTickets] = useState<TicketTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/public/fights/${params.id}`)
        if (!response.ok) {
          setError(true)
          return
        }
        const data = await response.json()
        setEvent(data.event)
        setBouts(data.bouts || [])
        setTickets(data.tickets || [])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchEvent()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="mb-4 text-lg text-neutral-400">Event not found</p>
        <Link
          href="/ockock/fights"
          className="text-amber-400 hover:text-amber-300"
        >
          Back to events
        </Link>
      </div>
    )
  }

  const eventDate = new Date(event.event_date + "T00:00:00")
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formatTime = (time: string) => {
    const [h, m] = time.split(":")
    const hour = parseInt(h)
    const ampm = hour >= 12 ? "PM" : "AM"
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  const mainEvent = bouts.find((b) => b.is_main_event)
  const undercard = bouts.filter((b) => !b.is_main_event)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back */}
      <Link
        href="/ockock/fights"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All Events
      </Link>

      {/* Event Header */}
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-amber-400">
          {event.organizations.name}
        </p>
        <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
          {event.name}
        </h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-neutral-400">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </span>
          {event.event_time && (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(event.event_time)}
            </span>
          )}
          {event.venue_name && (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {event.venue_name}
              {event.venue_city && `, ${event.venue_city}`}
            </span>
          )}
        </div>

        {event.description && (
          <p className="mt-4 text-neutral-400 leading-relaxed">
            {event.description}
          </p>
        )}
      </div>

      {/* Fight Card */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
          <Swords className="h-5 w-5 text-amber-400" />
          Fight Card
        </h2>

        {bouts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] py-12 text-center">
            <p className="text-neutral-500">
              Fight card to be announced
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Main Event */}
            {mainEvent && (
              <div className="mb-4">
                <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-amber-400">
                  Main Event
                </p>
                <BoutCard bout={mainEvent} isMain />
              </div>
            )}

            {/* Undercard */}
            {undercard.length > 0 && (
              <>
                {mainEvent && (
                  <p className="mb-2 pt-2 text-center text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Undercard
                  </p>
                )}
                {undercard.map((bout) => (
                  <BoutCard key={bout.id} bout={bout} />
                ))}
              </>
            )}
          </div>
        )}
      </section>

      {/* Tickets */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
          <Ticket className="h-5 w-5 text-amber-400" />
          Tickets
        </h2>

        {!event.ticket_sales_open ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] py-12 text-center">
            <p className="text-neutral-500">Tickets coming soon</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] py-12 text-center">
            <p className="text-neutral-500">No tickets available</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function FighterCorner({
  fighter,
  corner,
}: {
  fighter: FighterInfo | null
  corner: "red" | "blue"
}) {
  if (!fighter) {
    return (
      <div className="flex flex-1 flex-col items-center text-center">
        <div className="mb-2 h-14 w-14 rounded-full bg-neutral-800" />
        <p className="text-sm text-neutral-500">TBA</p>
      </div>
    )
  }

  const record = `${fighter.fight_record_wins}-${fighter.fight_record_losses}-${fighter.fight_record_draws}`
  const cornerColor = corner === "red" ? "text-red-400" : "text-blue-400"

  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="mb-2 h-14 w-14 overflow-hidden rounded-full bg-neutral-800">
        {fighter.photo_url ? (
          <img
            src={fighter.photo_url}
            alt={fighter.display_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl text-neutral-500">
            {fighter.display_name.charAt(0)}
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-white">
        {fighter.display_name}
      </p>
      <p className="text-xs text-neutral-400">{record}</p>
      {fighter.fighter_country && (
        <p className="text-xs text-neutral-500">{fighter.fighter_country}</p>
      )}
      {fighter.organizations && (
        <p className={`text-xs ${cornerColor}`}>
          {fighter.organizations.name}
        </p>
      )}
    </div>
  )
}

function BoutCard({ bout, isMain = false }: { bout: Bout; isMain?: boolean }) {
  return (
    <div
      className={`rounded-xl border bg-white/[0.03] p-5 ${
        isMain
          ? "border-amber-500/30 ring-1 ring-amber-500/10"
          : "border-white/10"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Red Corner */}
        <FighterCorner fighter={bout.fighter_red} corner="red" />

        {/* VS */}
        <div className="flex flex-col items-center gap-1 px-2">
          <span className="text-lg font-bold text-neutral-500">VS</span>
          {bout.weight_class && (
            <span className="text-[10px] uppercase text-neutral-600">
              {bout.weight_class}
            </span>
          )}
          <span className="text-[10px] text-neutral-600">
            {bout.scheduled_rounds} rounds
          </span>
        </div>

        {/* Blue Corner */}
        <FighterCorner fighter={bout.fighter_blue} corner="blue" />
      </div>

      {/* Result (if completed) */}
      {bout.result && (
        <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-center text-sm">
          <span className="font-medium text-amber-400">
            {formatResult(bout.result)}
          </span>
          {bout.result_round && (
            <span className="text-neutral-400">
              {" "}
              &middot; Round {bout.result_round}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function formatResult(result: string): string {
  const map: Record<string, string> = {
    red_win_ko: "Red Corner wins by KO",
    red_win_tko: "Red Corner wins by TKO",
    red_win_decision: "Red Corner wins by Decision",
    blue_win_ko: "Blue Corner wins by KO",
    blue_win_tko: "Blue Corner wins by TKO",
    blue_win_decision: "Blue Corner wins by Decision",
    draw: "Draw",
    no_contest: "No Contest",
  }
  return map[result] || result
}

function TicketCard({ ticket }: { ticket: TicketTier }) {
  const soldOut = ticket.quantity_remaining <= 0

  return (
    <div
      className={`rounded-xl border p-5 ${
        soldOut
          ? "border-white/5 bg-white/[0.02] opacity-60"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <h3 className="mb-1 text-lg font-semibold text-white">
        {ticket.tier_name}
      </h3>
      {ticket.description && (
        <p className="mb-3 text-sm text-neutral-400">{ticket.description}</p>
      )}

      <div className="mb-3">
        <span className="text-2xl font-bold text-amber-400">
          ฿{ticket.price_thb.toLocaleString()}
        </span>
        {ticket.price_usd && (
          <span className="ml-2 text-sm text-neutral-500">
            ~${ticket.price_usd}
          </span>
        )}
      </div>

      <div className="mb-4 text-xs text-neutral-500">
        {soldOut
          ? "Sold out"
          : `${ticket.quantity_remaining} of ${ticket.quantity_total} remaining`}
      </div>

      <button
        disabled={soldOut}
        className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
          soldOut
            ? "cursor-not-allowed bg-white/5 text-neutral-600"
            : "bg-amber-500 text-black hover:bg-amber-400"
        }`}
      >
        {soldOut ? "Sold Out" : "Buy Ticket"}
      </button>
    </div>
  )
}
