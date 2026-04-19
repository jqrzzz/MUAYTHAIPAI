"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Plus,
  Loader2,
  Calendar,
  MapPin,
  Swords,
  Ticket,
  Eye,
  Pencil,
  MoreVertical,
  DollarSign,
} from "lucide-react"

interface PromoterEvent {
  id: string
  name: string
  event_date: string
  event_time: string | null
  venue_name: string | null
  venue_city: string | null
  status: "draft" | "published" | "cancelled" | "completed"
  ticket_sales_open: boolean
  max_capacity: number | null
  bout_count: number
  tickets_sold: number
  revenue_thb: number
  created_at: string
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Draft", bg: "bg-neutral-500/15", text: "text-neutral-400" },
  published: { label: "Published", bg: "bg-emerald-500/15", text: "text-emerald-400" },
  cancelled: { label: "Cancelled", bg: "bg-red-500/15", text: "text-red-400" },
  completed: { label: "Completed", bg: "bg-blue-500/15", text: "text-blue-400" },
}

export default function PromoterDashboardClient({ orgName }: { orgName: string }) {
  const [events, setEvents] = useState<PromoterEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("/api/promoter/events")
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setEvents(data.events || [])
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const upcoming = events.filter(
    (e) => e.status === "published" && new Date(e.event_date) >= new Date()
  )
  const drafts = events.filter((e) => e.status === "draft")
  const past = events.filter(
    (e) => e.status === "completed" || (e.status === "published" && new Date(e.event_date) < new Date())
  )

  const totalRevenue = events.reduce((sum, e) => sum + e.revenue_thb, 0)
  const totalTicketsSold = events.reduce((sum, e) => sum + e.tickets_sold, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Promoter Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-400">{orgName}</p>
        </div>
        <Link
          href="/ockock/promoter/events/new"
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          New Event
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Upcoming"
          value={upcoming.length.toString()}
          icon={<Calendar className="h-4 w-4" />}
        />
        <SummaryCard
          label="Drafts"
          value={drafts.length.toString()}
          icon={<Pencil className="h-4 w-4" />}
        />
        <SummaryCard
          label="Tickets Sold"
          value={totalTicketsSold.toLocaleString()}
          icon={<Ticket className="h-4 w-4" />}
        />
        <SummaryCard
          label="Revenue"
          value={`฿${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
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
          <p className="mb-2 text-lg font-medium text-neutral-300">
            No events yet
          </p>
          <p className="mb-6 text-sm text-neutral-500">
            Create your first fight event to get started
          </p>
          <Link
            href="/ockock/promoter/events/new"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Drafts first, then upcoming, then past */}
          {drafts.length > 0 && (
            <EventSection title="Drafts" events={drafts} />
          )}
          {upcoming.length > 0 && (
            <EventSection title="Upcoming" events={upcoming} />
          )}
          {past.length > 0 && (
            <EventSection title="Past Events" events={past} />
          )}
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-2 text-neutral-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}

function EventSection({
  title,
  events,
}: {
  title: string
  events: PromoterEvent[]
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </h2>
      <div className="space-y-2">
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}

function EventRow({ event }: { event: PromoterEvent }) {
  const eventDate = new Date(event.event_date + "T00:00:00")
  const dateStr = eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const status = STATUS_STYLES[event.status] || STATUS_STYLES.draft

  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
      {/* Date */}
      <div className="hidden w-20 flex-shrink-0 text-center sm:block">
        <p className="text-sm font-semibold text-white">
          {eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
        <p className="text-xs text-neutral-500">
          {eventDate.toLocaleDateString("en-US", { weekday: "short" })}
        </p>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-white">{event.name}</h3>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span className="sm:hidden">{dateStr}</span>
          {event.venue_city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.venue_city}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Swords className="h-3 w-3" />
            {event.bout_count} bout{event.bout_count !== 1 ? "s" : ""}
          </span>
          {event.tickets_sold > 0 && (
            <span className="flex items-center gap-1">
              <Ticket className="h-3 w-3" />
              {event.tickets_sold} sold
            </span>
          )}
          {event.revenue_thb > 0 && (
            <span className="text-amber-400">
              ฿{event.revenue_thb.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/ockock/promoter/events/${event.id}`}
          className="rounded-lg border border-white/10 p-2 text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
          title="Edit event"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        {event.status === "published" && (
          <Link
            href={`/ockock/fights/${event.id}`}
            className="rounded-lg border border-white/10 p-2 text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
            title="View public page"
          >
            <Eye className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  )
}
