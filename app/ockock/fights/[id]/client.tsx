"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
  X,
  Bell,
  CheckCircle2,
} from "lucide-react"

// Mirrors HTML5 input type="email" — good enough to catch the common
// typos (`a@`, `@b`, `joe@gmail`) that `.includes("@")` waves through.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
          href="/fights"
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
        href="/fights"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All Events
      </Link>

      {/* Cover image — renders as a 16:9 hero above the event name
          when the promoter uploaded one. Soft gradient overlay so
          the wordmark below stays readable on busy artwork. */}
      {event.cover_image_url && (
        <div className="mb-6 relative overflow-hidden rounded-2xl ring-1 ring-white/10 aspect-[16/9] bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.cover_image_url}
            alt={`${event.name} cover`}
            loading="lazy"
            // If the cover URL 404s (broken upload, deleted bucket
            // object, etc.) collapse the wrapper instead of leaving
            // a blank 16:9 ratio box. The hero text below still
            // reads fine on its own.
            onError={(e) => {
              const wrapper = e.currentTarget.parentElement
              if (wrapper) wrapper.style.display = "none"
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
        </div>
      )}

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
          <NotifyMeForm eventId={String(params.id)} eventName={event.name} />
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] py-12 text-center">
            <p className="text-neutral-500">No tickets available</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                eventId={String(params.id)}
                eventName={event.name}
              />
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
    <Link
      href={`/fighters/${fighter.id}`}
      className="group flex flex-1 flex-col items-center text-center rounded-lg px-2 py-1 transition-colors hover:bg-white/5"
    >
      <div className="relative mb-2 h-14 w-14 overflow-hidden rounded-full bg-neutral-800 ring-1 ring-transparent group-hover:ring-white/20 transition">
        {fighter.photo_url ? (
          <Image
            src={fighter.photo_url}
            alt={fighter.display_name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl text-neutral-500">
            {fighter.display_name.charAt(0)}
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
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
    </Link>
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

function TicketCard({
  ticket,
  eventId,
  eventName,
}: {
  ticket: TicketTier
  eventId: string
  eventName: string
}) {
  const soldOut = ticket.quantity_remaining <= 0
  const [open, setOpen] = useState(false)

  return (
    <>
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
          onClick={() => setOpen(true)}
          className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            soldOut
              ? "cursor-not-allowed bg-white/5 text-neutral-600"
              : "bg-amber-500 text-black hover:bg-amber-400"
          }`}
        >
          {soldOut ? "Sold Out" : "Buy Ticket"}
        </button>
      </div>
      {open && (
        <BuyTicketDialog
          ticket={ticket}
          eventId={eventId}
          eventName={eventName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

// Two-step ticket-purchase dialog. Collects guest info, calls the
// public checkout endpoint, then redirects to Stripe Checkout. The
// webhook flips the order to paid + sends the confirmation email; we
// rely on the success page to confirm the order reference to the buyer.
function BuyTicketDialog({
  ticket,
  eventId,
  eventName,
  onClose,
}: {
  ticket: TicketTier
  eventId: string
  eventName: string
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxQty = Math.min(ticket.quantity_remaining, 10)
  const totalThb = ticket.price_thb * quantity

  // Escape-to-close. Backdrop click already works; this matches the
  // expected modal interaction for keyboard users.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose, submitting])

  async function submit() {
    setError(null)
    if (!name.trim()) {
      setError("Your full name is required.")
      return
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Enter a valid email — your ticket is sent here.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(
        `/api/public/fights/${eventId}/tickets/${ticket.id}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity,
            guest_name: name.trim(),
            guest_email: email.trim(),
            guest_phone: phone.trim() || undefined,
          }),
        },
      )
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || "Couldn't start checkout. Try again.")
        return
      }
      window.location.href = data.url
    } catch {
      setError("Network error. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buy ticket"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="w-full max-w-md rounded-xl border border-white/10 bg-neutral-950 p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              {ticket.tier_name}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">{eventName}</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              ฿{ticket.price_thb.toLocaleString()} per ticket
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-neutral-500 hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="ticket-buyer-name" className="block text-xs font-medium text-neutral-400 mb-1">
              Full name *
            </label>
            <input
              id="ticket-buyer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoFocus
              required
              className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label htmlFor="ticket-buyer-email" className="block text-xs font-medium text-neutral-400 mb-1">
              Email * <span className="text-neutral-600">(ticket goes here)</span>
            </label>
            <input
              id="ticket-buyer-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label htmlFor="ticket-buyer-phone" className="block text-xs font-medium text-neutral-400 mb-1">
              Phone <span className="text-neutral-600">(optional)</span>
            </label>
            <input
              id="ticket-buyer-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label htmlFor="ticket-qty" className="block text-xs font-medium text-neutral-400 mb-1">
              Quantity
            </label>
            <select
              id="ticket-qty"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            >
              {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.14em] text-amber-300/80">Total</span>
          <span className="text-lg font-bold text-amber-300">฿{totalThb.toLocaleString()}</span>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening Stripe…
              </>
            ) : (
              <>Continue to payment</>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <p className="mt-3 text-[10px] text-neutral-600 text-center">
          You&apos;ll be redirected to Stripe to complete payment securely. Confirmation email goes to the address above.
        </p>
      </form>
    </div>
  )
}

// "Notify me when tickets go on sale" form. Replaces the previous
// dead-end "Tickets coming soon" panel on events that have a public
// page but haven't opened ticket sales yet. POSTs to the public
// notify endpoint, which is rate-limited and dedups per email so a
// double-tap doesn't double-register.
function NotifyMeForm({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Enter a valid email so we know where to ping you.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/fights/${eventId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `company` is the honeypot — kept as an empty string so a
        // bot that auto-fills every field gets caught server-side.
        body: JSON.stringify({ email: email.trim(), company: "" }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(
          data.error ||
            (res.status === 429
              ? "Too many requests. Try again in an hour."
              : "Couldn't register — try again."),
        )
        return
      }
      setDone(true)
    } catch {
      setError("Network error — try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] py-10 px-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
        <p className="text-base font-medium text-emerald-200">
          You&apos;re on the list.
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          We&apos;ll email you the moment tickets for {eventName} open.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-white/10 bg-white/[0.03] py-8 px-6 text-center"
    >
      <Bell className="mx-auto mb-2 h-7 w-7 text-amber-400/70" />
      <p className="mb-1 text-base font-medium text-neutral-200">
        Tickets coming soon
      </p>
      <p className="mb-5 text-xs text-neutral-500">
        Drop your email — we&apos;ll ping you when sales open.
      </p>
      <div className="mx-auto flex max-w-sm flex-col gap-2 sm:flex-row">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="flex-1 rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-white/30"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>Notify me</>
          )}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-400">
          {error}
        </p>
      )}
      <p className="mt-3 text-[10px] text-neutral-600">
        One email when tickets open. No newsletter, no spam.
      </p>
    </form>
  )
}
