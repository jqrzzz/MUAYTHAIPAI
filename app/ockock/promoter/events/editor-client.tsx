"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Save,
  Swords,
  Ticket,
  FileText,
  Plus,
  Trash2,
  Eye,
  Globe,
  X,
} from "lucide-react"

// ============================================
// Types
// ============================================

interface EventForm {
  name: string
  description: string
  event_date: string
  event_time: string
  venue_name: string
  venue_address: string
  venue_city: string
  venue_province: string
  venue_country: string
  max_capacity: string
}

interface Bout {
  id: string
  bout_order: number
  weight_class: string | null
  scheduled_rounds: number
  is_main_event: boolean
  status: string
  fighter_red_id: string | null
  fighter_blue_id: string | null
  fighter_red: FighterInfo | null
  fighter_blue: FighterInfo | null
  result: string | null
}

interface FighterInfo {
  id: string
  display_name: string
  photo_url: string | null
  fight_record_wins: number
  fight_record_losses: number
  fight_record_draws: number
  weight_class: string | null
  fighter_country: string | null
  organizations: { name: string } | null
}

interface BoutInvitation {
  id: string
  bout_id: string
  corner: "red" | "blue"
  fighter_id: string
  status: "pending" | "accepted" | "declined" | "cancelled"
  message: string | null
  created_at: string
  fighter: FighterInfo | null
}

interface TicketTier {
  id: string
  tier_name: string
  description: string | null
  price_thb: number
  price_usd: number | null
  quantity_total: number
  quantity_sold: number
  is_active: boolean
}

type Tab = "details" | "bouts" | "tickets"

const EMPTY_FORM: EventForm = {
  name: "",
  description: "",
  event_date: "",
  event_time: "",
  venue_name: "",
  venue_address: "",
  venue_city: "",
  venue_province: "",
  venue_country: "Thailand",
  max_capacity: "",
}

// ============================================
// Main Component
// ============================================

export default function EventEditorClient({
  mode,
  eventId,
}: {
  mode: "create" | "edit"
  eventId?: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("details")
  const [form, setForm] = useState<EventForm>(EMPTY_FORM)
  const [eventStatus, setEventStatus] = useState<string>("draft")
  const [ticketSalesOpen, setTicketSalesOpen] = useState(false)
  const [bouts, setBouts] = useState<Bout[]>([])
  const [tickets, setTickets] = useState<TicketTier[]>([])
  // Keyed by bout_id, holds the pending invitations sent for that bout
  // so each BoutCard can show "Awaiting [Fighter]" until accept/decline.
  const [invitationsByBout, setInvitationsByBout] = useState<
    Record<string, BoutInvitation[]>
  >({})
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load existing event data
  useEffect(() => {
    if (mode !== "edit" || !eventId) return

    async function load() {
      try {
        const [eventRes, boutsRes, ticketsRes] = await Promise.all([
          fetch(`/api/promoter/events/${eventId}`),
          fetch(`/api/promoter/events/${eventId}/bouts`),
          fetch(`/api/promoter/events/${eventId}/tickets`),
        ])

        if (!eventRes.ok) throw new Error("Event not found")

        const eventData = await eventRes.json()
        const boutsData = await boutsRes.json()
        const ticketsData = await ticketsRes.json()

        const e = eventData.event
        setForm({
          name: e.name || "",
          description: e.description || "",
          event_date: e.event_date || "",
          event_time: e.event_time || "",
          venue_name: e.venue_name || "",
          venue_address: e.venue_address || "",
          venue_city: e.venue_city || "",
          venue_province: e.venue_province || "",
          venue_country: e.venue_country || "Thailand",
          max_capacity: e.max_capacity?.toString() || "",
        })
        setEventStatus(e.status)
        setTicketSalesOpen(e.ticket_sales_open)
        const loadedBouts: Bout[] = boutsData.bouts || []
        setBouts(loadedBouts)
        setTickets(ticketsData.tickets || [])

        // Pull pending invitations for each bout in parallel. Endpoint
        // returns [] if migration 059 isn't applied so this stays safe
        // pre-migration; the editor just looks like it always did.
        if (loadedBouts.length > 0) {
          const invs = await Promise.all(
            loadedBouts.map(async (b) => {
              try {
                const r = await fetch(
                  `/api/promoter/events/${eventId}/bouts/${b.id}/invitations`,
                )
                if (!r.ok) return [b.id, [] as BoutInvitation[]] as const
                const j = await r.json()
                const pending = ((j.invitations ?? []) as BoutInvitation[]).filter(
                  (i) => i.status === "pending",
                )
                return [b.id, pending] as const
              } catch {
                return [b.id, [] as BoutInvitation[]] as const
              }
            }),
          )
          setInvitationsByBout(Object.fromEntries(invs))
        }
      } catch (err) {
        setError("Failed to load event")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [mode, eventId])

  // Save event details
  async function saveEvent() {
    setSaving(true)
    setError(null)

    try {
      const body = {
        name: form.name,
        description: form.description || null,
        event_date: form.event_date,
        event_time: form.event_time || null,
        venue_name: form.venue_name || null,
        venue_address: form.venue_address || null,
        venue_city: form.venue_city || null,
        venue_province: form.venue_province || null,
        venue_country: form.venue_country || "Thailand",
        max_capacity: form.max_capacity ? parseInt(form.max_capacity) : null,
      }

      if (mode === "create") {
        const res = await fetch("/api/promoter/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to create event")
        }
        const data = await res.json()
        router.push(`/ockock/promoter/events/${data.event.id}`)
      } else {
        const res = await fetch(`/api/promoter/events/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to update event")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  // Publish / unpublish
  async function togglePublish() {
    if (!eventId) return
    setSaving(true)
    const newStatus = eventStatus === "published" ? "draft" : "published"

    try {
      const res = await fetch(`/api/promoter/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      setEventStatus(newStatus)
    } catch {
      setError("Failed to update status")
    } finally {
      setSaving(false)
    }
  }

  // Toggle ticket sales
  async function toggleTicketSales() {
    if (!eventId) return
    const newValue = !ticketSalesOpen

    try {
      const res = await fetch(`/api/promoter/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_sales_open: newValue }),
      })
      if (!res.ok) throw new Error("Failed to update")
      setTicketSalesOpen(newValue)
    } catch {
      setError("Failed to toggle ticket sales")
    }
  }

  // Add bout
  async function addBout() {
    if (!eventId) return
    try {
      const res = await fetch(`/api/promoter/events/${eventId}/bouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight_class: null, scheduled_rounds: 5 }),
      })
      if (!res.ok) throw new Error("Failed to add bout")
      const data = await res.json()
      setBouts([...bouts, { ...data.bout, fighter_red: null, fighter_blue: null }])
    } catch {
      setError("Failed to add bout")
    }
  }

  // Delete bout
  async function deleteBout(boutId: string) {
    if (!eventId) return
    try {
      const res = await fetch(
        `/api/promoter/events/${eventId}/bouts?boutId=${boutId}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Failed to delete bout")
      setBouts(bouts.filter((b) => b.id !== boutId))
    } catch {
      setError("Failed to delete bout")
    }
  }

  // Toggle main event
  async function toggleMainEvent(boutId: string, current: boolean) {
    if (!eventId) return
    try {
      const res = await fetch(
        `/api/promoter/events/${eventId}/bouts?boutId=${boutId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_main_event: !current }),
        }
      )
      if (!res.ok) throw new Error("Failed to update")
      setBouts(bouts.map((b) =>
        b.id === boutId ? { ...b, is_main_event: !current } : b
      ))
    } catch {
      setError("Failed to update bout")
    }
  }

  // Send a pending invitation to a fighter for a corner. Adds to the
  // local invitationsByBout map so the BoutCard surfaces "Awaiting…"
  // without a refetch. Promoter can cancel via cancelInvitation.
  async function inviteFighter(
    boutId: string,
    corner: "red" | "blue",
    fighter: FighterInfo,
    message?: string,
  ) {
    if (!eventId) return
    try {
      const res = await fetch(
        `/api/promoter/events/${eventId}/bouts/${boutId}/invitations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fighter_id: fighter.id,
            corner,
            message: message ?? undefined,
          }),
        },
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to send invitation")
        return
      }
      setInvitationsByBout((prev) => ({
        ...prev,
        [boutId]: [...(prev[boutId] ?? []), data.invitation as BoutInvitation],
      }))
    } catch {
      setError("Network error — couldn't send invitation")
    }
  }

  async function cancelInvitation(boutId: string, invId: string) {
    if (!eventId) return
    try {
      const res = await fetch(
        `/api/promoter/events/${eventId}/bouts/${boutId}/invitations/${invId}`,
        { method: "DELETE" },
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Failed to cancel invitation")
        return
      }
      setInvitationsByBout((prev) => ({
        ...prev,
        [boutId]: (prev[boutId] ?? []).filter((i) => i.id !== invId),
      }))
    } catch {
      setError("Network error — couldn't cancel invitation")
    }
  }

  // Assign or clear a fighter from a corner. Passing a null fighter
  // unassigns (back to "TBD"). On success we optimistically update the
  // local bout so the card shows the new fighter without a refetch.
  async function assignFighter(
    boutId: string,
    corner: "red" | "blue",
    fighter: FighterInfo | null,
  ) {
    if (!eventId) return
    const field = corner === "red" ? "fighter_red_id" : "fighter_blue_id"
    try {
      const res = await fetch(
        `/api/promoter/events/${eventId}/bouts?boutId=${boutId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: fighter?.id ?? null }),
        },
      )
      if (!res.ok) throw new Error("Failed to assign fighter")
      setBouts(
        bouts.map((b) =>
          b.id === boutId
            ? corner === "red"
              ? { ...b, fighter_red_id: fighter?.id ?? null, fighter_red: fighter }
              : { ...b, fighter_blue_id: fighter?.id ?? null, fighter_blue: fighter }
            : b,
        ),
      )
    } catch {
      setError(`Failed to ${fighter ? "assign" : "clear"} ${corner} corner`)
    }
  }

  // Add ticket tier
  async function addTicketTier() {
    if (!eventId) return
    try {
      const res = await fetch(`/api/promoter/events/${eventId}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier_name: "General Admission",
          price_thb: 500,
          quantity_total: 100,
        }),
      })
      if (!res.ok) throw new Error("Failed to add ticket tier")
      const data = await res.json()
      setTickets([...tickets, data.ticket])
    } catch {
      setError("Failed to add ticket tier")
    }
  }

  // Delete ticket tier
  async function deleteTicketTier(ticketId: string) {
    if (!eventId) return
    try {
      const res = await fetch(
        `/api/promoter/events/${eventId}/tickets?ticketId=${ticketId}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete")
      }
      setTickets(tickets.filter((t) => t.id !== ticketId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ticket tier")
    }
  }

  // Update ticket tier inline
  async function updateTicketTier(ticketId: string, updates: Partial<TicketTier>) {
    if (!eventId) return
    try {
      const res = await fetch(
        `/api/promoter/events/${eventId}/tickets?ticketId=${ticketId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      )
      if (!res.ok) throw new Error("Failed to update")
      const data = await res.json()
      setTickets(tickets.map((t) => (t.id === ticketId ? data.ticket : t)))
    } catch {
      setError("Failed to update ticket tier")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    )
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "details", label: "Details", icon: <FileText className="h-4 w-4" /> },
    ...(mode === "edit"
      ? [
          { key: "bouts" as Tab, label: "Fight Card", icon: <Swords className="h-4 w-4" /> },
          { key: "tickets" as Tab, label: "Tickets", icon: <Ticket className="h-4 w-4" /> },
        ]
      : []),
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back */}
      <Link
        href="/ockock/promoter"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Title & Status */}
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-bold text-white">
          {mode === "create" ? "Create Event" : form.name || "Edit Event"}
        </h1>
        {mode === "edit" && (
          <div className="flex items-center gap-2">
            {eventStatus === "published" && (
              <Link
                href={`/ockock/fights/${eventId}`}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                <Eye className="h-3.5 w-3.5" />
                View Public
              </Link>
            )}
            <button
              onClick={togglePublish}
              disabled={saving}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                eventStatus === "published"
                  ? "bg-neutral-500/15 text-neutral-400 hover:bg-red-500/15 hover:text-red-400"
                  : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              {eventStatus === "published" ? "Unpublish" : "Publish"}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      {TABS.length > 1 && (
        <div className="mb-6 flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {tab === "details" && (
        <DetailsTab
          form={form}
          setForm={setForm}
          onSave={saveEvent}
          saving={saving}
          isCreate={mode === "create"}
        />
      )}
      {tab === "bouts" && (
        <BoutsTab
          bouts={bouts}
          invitationsByBout={invitationsByBout}
          onAdd={addBout}
          onDelete={deleteBout}
          onToggleMain={toggleMainEvent}
          onAssignFighter={assignFighter}
          onInviteFighter={inviteFighter}
          onCancelInvitation={cancelInvitation}
        />
      )}
      {tab === "tickets" && (
        <TicketsTab
          tickets={tickets}
          ticketSalesOpen={ticketSalesOpen}
          onToggleSales={toggleTicketSales}
          onAdd={addTicketTier}
          onDelete={deleteTicketTier}
          onUpdate={updateTicketTier}
        />
      )}
    </div>
  )
}

// ============================================
// Details Tab
// ============================================

function DetailsTab({
  form,
  setForm,
  onSave,
  saving,
  isCreate,
}: {
  form: EventForm
  setForm: (f: EventForm) => void
  onSave: () => void
  saving: boolean
  isCreate: boolean
}) {
  const update = (field: keyof EventForm, value: string) =>
    setForm({ ...form, [field]: value })

  return (
    <div className="space-y-5">
      <Field label="Event Name" required>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Friday Night Fights Vol. 12"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Tell people about this event..."
          rows={3}
          className="input-field resize-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date" required>
          <input
            type="date"
            value={form.event_date}
            onChange={(e) => update("event_date", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
          />
        </Field>
        <Field label="Time">
          <input
            type="time"
            value={form.event_time}
            onChange={(e) => update("event_time", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
          />
        </Field>
      </div>

      <hr className="border-white/10" />

      <Field label="Venue Name">
        <input
          type="text"
          value={form.venue_name}
          onChange={(e) => update("venue_name", e.target.value)}
          placeholder="e.g. Chiang Mai Boxing Stadium"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
        />
      </Field>

      <Field label="Venue Address">
        <input
          type="text"
          value={form.venue_address}
          onChange={(e) => update("venue_address", e.target.value)}
          placeholder="Street address"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="City">
          <input
            type="text"
            value={form.venue_city}
            onChange={(e) => update("venue_city", e.target.value)}
            placeholder="e.g. Pai"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
          />
        </Field>
        <Field label="Province">
          <input
            type="text"
            value={form.venue_province}
            onChange={(e) => update("venue_province", e.target.value)}
            placeholder="e.g. Mae Hong Son"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
          />
        </Field>
        <Field label="Capacity">
          <input
            type="number"
            value={form.max_capacity}
            onChange={(e) => update("max_capacity", e.target.value)}
            placeholder="e.g. 500"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
          />
        </Field>
      </div>

      <div className="pt-2">
        <button
          onClick={onSave}
          disabled={saving || !form.name || !form.event_date}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isCreate ? "Create Event" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}

// ============================================
// Bouts Tab
// ============================================

function BoutsTab({
  bouts,
  invitationsByBout,
  onAdd,
  onDelete,
  onToggleMain,
  onAssignFighter,
  onInviteFighter,
  onCancelInvitation,
}: {
  bouts: Bout[]
  invitationsByBout: Record<string, BoutInvitation[]>
  onAdd: () => void
  onDelete: (id: string) => void
  onToggleMain: (id: string, current: boolean) => void
  onAssignFighter: (boutId: string, corner: "red" | "blue", fighter: FighterInfo | null) => void | Promise<void>
  onInviteFighter: (boutId: string, corner: "red" | "blue", fighter: FighterInfo, message?: string) => void | Promise<void>
  onCancelInvitation: (boutId: string, invId: string) => void | Promise<void>
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          {bouts.length} bout{bouts.length !== 1 ? "s" : ""} on the card
        </p>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Bout
        </button>
      </div>

      {bouts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
          <Swords className="mx-auto mb-2 h-8 w-8 text-neutral-600" />
          <p className="text-sm text-neutral-500">
            No bouts yet. Add your first bout to build the fight card.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bouts.map((bout, index) => (
            <BoutCard
              key={bout.id}
              bout={bout}
              index={index}
              invitations={invitationsByBout[bout.id] ?? []}
              onDelete={() => onDelete(bout.id)}
              onToggleMain={() => onToggleMain(bout.id, bout.is_main_event)}
              onAssignFighter={(corner, fighter) => onAssignFighter(bout.id, corner, fighter)}
              onInviteFighter={(corner, fighter, message) => onInviteFighter(bout.id, corner, fighter, message)}
              onCancelInvitation={(invId) => onCancelInvitation(bout.id, invId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BoutCard({
  bout,
  index,
  invitations,
  onDelete,
  onToggleMain,
  onAssignFighter,
  onInviteFighter,
  onCancelInvitation,
}: {
  bout: Bout
  index: number
  invitations: BoutInvitation[]
  onDelete: () => void
  onToggleMain: () => void
  onAssignFighter: (corner: "red" | "blue", fighter: FighterInfo | null) => void | Promise<void>
  onInviteFighter: (corner: "red" | "blue", fighter: FighterInfo, message?: string) => void | Promise<void>
  onCancelInvitation: (invId: string) => void | Promise<void>
}) {
  const [pickerOpen, setPickerOpen] = useState<"red" | "blue" | null>(null)
  const pendingByCorner = {
    red: invitations.find((i) => i.corner === "red" && i.status === "pending") ?? null,
    blue: invitations.find((i) => i.corner === "blue" && i.status === "pending") ?? null,
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Bout #{index + 1}</span>
          {bout.is_main_event && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              MAIN EVENT
            </span>
          )}
          {bout.weight_class && (
            <span className="text-xs text-neutral-500">{bout.weight_class}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMain}
            className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
              bout.is_main_event
                ? "bg-amber-500/15 text-amber-400"
                : "bg-white/5 text-neutral-500 hover:text-white"
            }`}
          >
            {bout.is_main_event ? "Remove Main" : "Set Main"}
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
            aria-label="Delete bout"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Fighters — corners are interactive: click to open picker,
          existing assignments show a Change/Clear control. Pending
          invitations show an Awaiting state with a Cancel option. */}
      <div className="flex items-center gap-3">
        <CornerSlot
          corner="red"
          fighter={bout.fighter_red}
          pending={pendingByCorner.red}
          onPick={() => setPickerOpen("red")}
          onClear={() => onAssignFighter("red", null)}
          onCancelInvitation={onCancelInvitation}
        />
        <span className="text-sm font-bold text-neutral-600">VS</span>
        <CornerSlot
          corner="blue"
          fighter={bout.fighter_blue}
          pending={pendingByCorner.blue}
          onPick={() => setPickerOpen("blue")}
          onClear={() => onAssignFighter("blue", null)}
          onCancelInvitation={onCancelInvitation}
        />
      </div>

      <p className="mt-2 text-center text-[10px] text-neutral-600">
        {bout.scheduled_rounds} rounds
      </p>

      {pickerOpen && (
        <FighterPickerDialog
          corner={pickerOpen}
          weightClass={bout.weight_class}
          excludeIds={[
            bout.fighter_red?.id,
            bout.fighter_blue?.id,
            // Don't surface fighters with a pending invitation for this bout —
            // either corner — so the promoter doesn't double-invite.
            ...invitations.filter((i) => i.status === "pending").map((i) => i.fighter_id),
          ].filter((x): x is string => !!x)}
          onClose={() => setPickerOpen(null)}
          onAssign={async (f) => {
            await onAssignFighter(pickerOpen, f)
            setPickerOpen(null)
          }}
          onInvite={async (f, message) => {
            await onInviteFighter(pickerOpen, f, message)
            setPickerOpen(null)
          }}
        />
      )}
    </div>
  )
}

// Single corner — three possible states:
//   1. Empty       → CTA to open the picker
//   2. Pending     → "Awaiting [Fighter]" with Cancel link (invitation sent,
//                    fighter hasn't responded)
//   3. Assigned    → confirmed fighter with Change / Clear
function CornerSlot({
  corner,
  fighter,
  pending,
  onPick,
  onClear,
  onCancelInvitation,
}: {
  corner: "red" | "blue"
  fighter: FighterInfo | null
  pending: BoutInvitation | null
  onPick: () => void
  onClear: () => void
  onCancelInvitation: (invId: string) => void | Promise<void>
}) {
  const tone =
    corner === "red"
      ? { bg: "bg-red-500/5", label: "text-red-400", ring: "ring-red-500/20" }
      : { bg: "bg-blue-500/5", label: "text-blue-400", ring: "ring-blue-500/20" }

  // Pending state — fighter is invited but hasn't accepted. Takes
  // priority over the empty CTA so the promoter sees who's outstanding
  // and can cancel if they want to invite someone else.
  if (!fighter && pending) {
    return (
      <div className={`flex-1 rounded-lg ${tone.bg} ring-1 ring-amber-500/30 p-3 text-center`}>
        <p className={`text-[10px] font-semibold uppercase ${tone.label}`}>
          {corner === "red" ? "Red Corner" : "Blue Corner"}
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-300">
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          Awaiting response
        </p>
        <p className="mt-0.5 text-sm font-medium text-white truncate">
          {pending.fighter?.display_name ?? "Invited fighter"}
        </p>
        <button
          onClick={() => onCancelInvitation(pending.id)}
          className="mt-2 rounded px-2 py-0.5 text-[10px] text-neutral-400 hover:bg-red-500/10 hover:text-red-400"
        >
          Cancel invite
        </button>
      </div>
    )
  }

  if (!fighter) {
    return (
      <button
        onClick={onPick}
        className={`flex-1 rounded-lg border border-dashed border-white/15 ${tone.bg} p-3 text-center transition-colors hover:border-white/30 hover:bg-white/5`}
      >
        <p className={`text-[10px] font-semibold uppercase ${tone.label}`}>
          {corner === "red" ? "Red Corner" : "Blue Corner"}
        </p>
        <p className="mt-1 text-sm font-medium text-neutral-400">
          + Assign fighter
        </p>
        <p className="text-[10px] text-neutral-600 mt-0.5">Browse Open-to-Fight roster</p>
      </button>
    )
  }

  const record = `${fighter.fight_record_wins}-${fighter.fight_record_losses}-${fighter.fight_record_draws}`
  return (
    <div className={`flex-1 rounded-lg ${tone.bg} ring-1 ${tone.ring} p-3 text-center`}>
      <p className={`text-[10px] font-semibold uppercase ${tone.label}`}>
        {corner === "red" ? "Red Corner" : "Blue Corner"}
      </p>
      <p className="mt-1 font-semibold text-white truncate">{fighter.display_name}</p>
      <p className="text-xs text-neutral-500">{record}</p>
      {fighter.organizations && (
        <p className="text-[10px] text-neutral-600 truncate">
          {(fighter.organizations as { name: string }).name}
        </p>
      )}
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <button
          onClick={onPick}
          className="rounded px-2 py-0.5 text-[10px] text-neutral-400 hover:bg-white/5 hover:text-white"
        >
          Change
        </button>
        <span className="text-neutral-700">·</span>
        <button
          onClick={onClear}
          className="rounded px-2 py-0.5 text-[10px] text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

// Search-and-select dialog for picking a fighter for a corner. The
// promoter can either send an invitation (requires fighter consent —
// fighter accepts/declines) or assign directly (instant — best for
// fighters at their own gym or already-confirmed verbally). The fighter
// pool is the public fighters API filtered to open_to_fights=true.
function FighterPickerDialog({
  corner,
  weightClass,
  excludeIds,
  onClose,
  onAssign,
  onInvite,
}: {
  corner: "red" | "blue"
  weightClass: string | null
  excludeIds: string[]
  onClose: () => void
  onAssign: (fighter: FighterInfo) => void | Promise<void>
  onInvite: (fighter: FighterInfo, message?: string) => void | Promise<void>
}) {
  const [query, setQuery] = useState("")
  const [matchWeight, setMatchWeight] = useState(!!weightClass)
  const [results, setResults] = useState<FighterInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [picking, setPicking] = useState<string | null>(null)
  // Invite-or-assign toggle. Default to invite — it's the safer flow
  // for cross-gym promoters and explicit consent is the better norm.
  const [mode, setMode] = useState<"invite" | "assign">("invite")
  const [inviteMessage, setInviteMessage] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const params = new URLSearchParams({
        open_to_fights: "true",
        limit: "50",
      })
      if (matchWeight && weightClass) params.set("weight_class", weightClass)
      try {
        const res = await fetch(`/api/public/fighters?${params}`)
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        if (cancelled) return
        // The public API formats fields differently (name vs display_name,
        // country vs fighter_country, gym vs organizations) — normalize
        // back to the FighterInfo shape the editor uses internally.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fighters: FighterInfo[] = (data.fighters ?? []).map((f: any) => ({
          id: f.id,
          display_name: f.name ?? f.display_name ?? "",
          photo_url: f.image ?? f.photo_url ?? null,
          fight_record_wins: f.wins ?? f.fight_record_wins ?? 0,
          fight_record_losses: f.losses ?? f.fight_record_losses ?? 0,
          fight_record_draws: f.draws ?? f.fight_record_draws ?? 0,
          weight_class: f.weight_class ?? null,
          fighter_country: f.country ?? f.fighter_country ?? null,
          organizations: f.gym ?? f.organizations ?? null,
        }))
        setResults(fighters.filter((f) => !excludeIds.includes(f.id)))
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // Re-run when weight filter toggles. excludeIds is stable per-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchWeight, weightClass])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? results.filter((f) => f.display_name?.toLowerCase().includes(q))
    : results

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Assign ${corner} corner fighter`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-neutral-950 p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className={`text-[10px] font-semibold uppercase ${corner === "red" ? "text-red-400" : "text-blue-400"}`}>
              {corner === "red" ? "Red Corner" : "Blue Corner"}
            </p>
            <h3 className="text-base font-semibold text-white">Pick a fighter</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-neutral-500 hover:bg-white/5 hover:text-white"
            aria-label="Close picker"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode toggle — Invite (with consent) is the default; the
            "Assign now" path is for promoters booking their own gym's
            fighters or fighters who've already verbally confirmed. */}
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/10 bg-neutral-900 p-1">
          <button
            type="button"
            onClick={() => setMode("invite")}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              mode === "invite"
                ? "bg-amber-500/20 text-amber-200"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Send invitation
          </button>
          <button
            type="button"
            onClick={() => setMode("assign")}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              mode === "assign"
                ? "bg-emerald-500/20 text-emerald-200"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Assign now
          </button>
        </div>
        <p className="mb-3 text-[11px] text-neutral-500 leading-relaxed">
          {mode === "invite"
            ? "Fighter must accept before they appear on the card. Best for cross-gym bookings."
            : "Fighter is added to the card immediately. Use for your own gym or already-confirmed fighters."}
        </p>

        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by fighter name…"
          className="mb-2 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-white/30"
        />

        {mode === "invite" && (
          <textarea
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Optional note to the fighter (e.g. 'Three-round bout, June 15 in Bangkok')"
            className="mb-2 w-full resize-none rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-white/30"
          />
        )}

        {weightClass && (
          <label className="mb-3 flex cursor-pointer items-center gap-2 text-xs text-neutral-400">
            <input
              type="checkbox"
              checked={matchWeight}
              onChange={(e) => setMatchWeight(e.target.checked)}
              className="rounded border-neutral-600 bg-neutral-800"
            />
            Only show fighters in {weightClass}
          </label>
        )}

        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-white/5">
          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto h-4 w-4 animate-spin text-neutral-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-neutral-500">
                {q ? `No fighters match "${query}"` : "No fighters available"}
              </p>
              <p className="mt-1 text-[11px] text-neutral-600">
                Fighters need to opt in (Open to Fights) to appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {filtered.map((f) => {
                const record = `${f.fight_record_wins}-${f.fight_record_losses}-${f.fight_record_draws}`
                const isPicking = picking === f.id
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      disabled={isPicking}
                      onClick={async () => {
                        setPicking(f.id)
                        try {
                          if (mode === "invite") {
                            await onInvite(f, inviteMessage.trim() || undefined)
                          } else {
                            await onAssign(f)
                          }
                        } finally {
                          setPicking(null)
                        }
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03] disabled:opacity-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{f.display_name}</p>
                        <p className="text-[11px] text-neutral-500">
                          {record}
                          {f.weight_class && ` · ${f.weight_class}`}
                          {f.fighter_country && ` · ${f.fighter_country}`}
                        </p>
                        {f.organizations && (
                          <p className="text-[10px] text-neutral-600 truncate">
                            {(f.organizations as { name: string }).name}
                          </p>
                        )}
                      </div>
                      {isPicking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />
                      ) : (
                        <span
                          className={`text-[10px] font-medium uppercase ${
                            mode === "invite" ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {mode === "invite" ? "Invite" : "Assign"}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Tickets Tab
// ============================================

function TicketsTab({
  tickets,
  ticketSalesOpen,
  onToggleSales,
  onAdd,
  onDelete,
  onUpdate,
}: {
  tickets: TicketTier[]
  ticketSalesOpen: boolean
  onToggleSales: () => void
  onAdd: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<TicketTier>) => void
}) {
  return (
    <div className="space-y-4">
      {/* Sales toggle */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <p className="text-sm font-medium text-white">Ticket Sales</p>
          <p className="text-xs text-neutral-500">
            {ticketSalesOpen
              ? "Sales are open — tickets visible to the public"
              : "Sales are closed — tickets hidden from public"}
          </p>
        </div>
        <button
          onClick={onToggleSales}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            ticketSalesOpen ? "bg-emerald-500" : "bg-white/10"
          }`}
        >
          <div
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              ticketSalesOpen ? "left-[1.375rem]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {/* Tiers */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400">
          {tickets.length} ticket tier{tickets.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Tier
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
          <Ticket className="mx-auto mb-2 h-8 w-8 text-neutral-600" />
          <p className="text-sm text-neutral-500">
            No ticket tiers. Add tiers to start selling tickets.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((tier) => (
            <TicketTierCard
              key={tier.id}
              tier={tier}
              onDelete={() => onDelete(tier.id)}
              onUpdate={(updates) => onUpdate(tier.id, updates)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TicketTierCard({
  tier,
  onDelete,
  onUpdate,
}: {
  tier: TicketTier
  onDelete: () => void
  onUpdate: (updates: Partial<TicketTier>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tier.tier_name)
  const [price, setPrice] = useState(tier.price_thb.toString())
  const [qty, setQty] = useState(tier.quantity_total.toString())

  function save() {
    onUpdate({
      tier_name: name,
      price_thb: parseInt(price) || tier.price_thb,
      quantity_total: parseInt(qty) || tier.quantity_total,
    })
    setEditing(false)
  }

  const remaining = tier.quantity_total - tier.quantity_sold

  if (editing) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-white/[0.03] p-4">
        <div className="space-y-3">
          <Field label="Tier Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (THB)">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
              />
            </Field>
            <Field label="Total Quantity">
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-black hover:bg-amber-400"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-4 py-1.5 text-sm text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-white">{tier.tier_name}</p>
          {!tier.is_active && (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-400">
              Inactive
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-neutral-400">
          ฿{tier.price_thb.toLocaleString()} &middot;{" "}
          {tier.quantity_sold > 0
            ? `${tier.quantity_sold} sold / ${remaining} remaining`
            : `${tier.quantity_total} available`}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setEditing(true)}
          className="rounded p-1.5 text-neutral-500 hover:bg-white/5 hover:text-white"
        >
          <FileText className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1.5 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ============================================
// Shared
// ============================================

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-300">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}
