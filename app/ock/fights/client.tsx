"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Swords,
  Ticket,
} from "lucide-react"

interface FightEvent {
  id: string
  name: string
  description: string | null
  event_date: string
  event_time: string | null
  cover_image_url: string | null
  venue_name: string | null
  venue_city: string | null
  venue_province: string | null
  venue_country: string
  max_capacity: number | null
  status: string
  ticket_sales_open: boolean
  organizations: {
    name: string
    slug: string
    logo_url: string | null
  }
  bout_count: number
  min_ticket_price_thb: number | null
  tickets_available: boolean
}

export default function FightsClient() {
  const [events, setEvents] = useState<FightEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/public/fights")
        const data = await response.json()
        setEvents(data.events || [])
      } catch (error) {
        console.error("Error fetching fight events:", error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Fight Events</h1>
        <p className="text-neutral-400">
          Upcoming Muay Thai fight nights across Thailand
        </p>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="ml-3 text-neutral-400">Loading events...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-20 text-center">
          <Swords className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
          <p className="mb-1 text-lg font-medium text-neutral-300">
            No upcoming events
          </p>
          <p className="text-sm text-neutral-500">
            Check back soon for new fight nights
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ event }: { event: FightEvent }) {
  const eventDate = new Date(event.event_date + "T00:00:00")
  const day = eventDate.getDate()
  const month = eventDate.toLocaleDateString("en-US", { month: "short" })
  const weekday = eventDate.toLocaleDateString("en-US", { weekday: "short" })

  const formatTime = (time: string) => {
    const [h, m] = time.split(":")
    const hour = parseInt(h)
    const ampm = hour >= 12 ? "PM" : "AM"
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  return (
    <Link
      href={`/ock/fights/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:border-amber-500/20 hover:bg-white/[0.05] sm:flex-row"
    >
      {/* Date Block */}
      <div className="flex flex-shrink-0 items-center gap-4 border-b border-white/10 bg-white/[0.03] p-5 sm:w-28 sm:flex-col sm:items-center sm:justify-center sm:border-b-0 sm:border-r sm:gap-0 sm:p-4">
        <span className="text-xs font-medium uppercase text-amber-400">
          {weekday}
        </span>
        <span className="text-3xl font-bold text-white sm:my-0.5">{day}</span>
        <span className="text-sm font-medium uppercase text-neutral-400">
          {month}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {/* Promoter */}
          <p className="mb-1 text-xs font-medium text-neutral-500">
            {event.organizations.name}
          </p>

          {/* Event Name */}
          <h3 className="mb-2 text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
            {event.name}
          </h3>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {event.venue_name && (
              <span className="flex items-center gap-1.5 text-sm text-neutral-400">
                <MapPin className="h-3.5 w-3.5" />
                {event.venue_name}
                {event.venue_city && `, ${event.venue_city}`}
              </span>
            )}
            {event.event_time && (
              <span className="flex items-center gap-1.5 text-sm text-neutral-400">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(event.event_time)}
              </span>
            )}
            {event.bout_count > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-neutral-400">
                <Swords className="h-3.5 w-3.5" />
                {event.bout_count} bout{event.bout_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Ticket Info */}
        <div className="mt-4 flex items-center gap-3">
          {event.ticket_sales_open && event.tickets_available ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400">
              <Ticket className="h-3.5 w-3.5" />
              {event.min_ticket_price_thb
                ? `From ฿${event.min_ticket_price_thb.toLocaleString()}`
                : "Tickets Available"}
            </span>
          ) : event.ticket_sales_open ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400">
              Sold Out
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-neutral-500">
              Tickets Coming Soon
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
