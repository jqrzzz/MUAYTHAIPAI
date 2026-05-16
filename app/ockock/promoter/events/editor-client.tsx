"use client"

import { useState, useEffect, useRef } from "react"
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
  TrendingUp,
  CheckCircle2,
  Search,
} from "lucide-react"
import { InlineConfirm } from "@/components/ui/inline-confirm"

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
  // Cover image — uploaded separately via /api/promoter/events/[id]/
  // cover. The URL lives on the form so saveEvent treats it as just
  // another field and the public fight page / OG image render it.
  cover_image_url: string
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

type Tab = "details" | "bouts" | "tickets" | "sales"

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
  cover_image_url: "",
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
  const [togglingSales, setTogglingSales] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Distinct from `error` — if the initial event-data load fails we
  // can't safely show the form (saves would PATCH the wrong record
  // against stale/empty state). Renders a full-page error UI instead.
  const [loadFailed, setLoadFailed] = useState(false)
  // Transient "Saved" confirmation after a successful PATCH so the user
  // knows the round-trip worked. Cleared by a timer below.
  const [savedFlash, setSavedFlash] = useState(false)

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
          cover_image_url: e.cover_image_url || "",
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
        // Set the hard-fail flag so the render below shows a retry UI
        // instead of an empty form against a stale event ID. The error
        // string is only used to surface details if we ever decide to
        // show them — for now the UI is generic.
        console.error("[event-editor] load failed:", err)
        setLoadFailed(true)
        setError("Failed to load event")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [mode, eventId])

  // Save event details
  async function saveEvent() {
    setError(null)

    // Client-side validation. The server validates too, but failing
    // here gives an immediate inline error instead of a round-trip.
    if (!form.name.trim()) {
      setError("Event name is required.")
      return
    }
    if (!form.event_date) {
      setError("Event date is required.")
      return
    }
    const capacityNum = form.max_capacity ? Number(form.max_capacity) : null
    if (capacityNum !== null && (!Number.isInteger(capacityNum) || capacityNum < 0)) {
      setError("Capacity must be a whole number 0 or greater.")
      return
    }

    setSaving(true)

    try {
      const body = {
        name: form.name.trim(),
        description: form.description || null,
        event_date: form.event_date,
        event_time: form.event_time || null,
        venue_name: form.venue_name || null,
        venue_address: form.venue_address || null,
        venue_city: form.venue_city || null,
        venue_province: form.venue_province || null,
        venue_country: form.venue_country || "Thailand",
        max_capacity: capacityNum,
        cover_image_url: form.cover_image_url || null,
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
        router.push(`/promoter/events/${data.event.id}`)
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
        setSavedFlash(true)
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

  // Toggle ticket sales. Uses a dedicated `togglingSales` flag (not the
  // shared `saving`) so the switch can disable itself without locking
  // out the rest of the form. Double-taps are blocked while in flight
  // so we can't queue duplicate PATCHes.
  async function toggleTicketSales() {
    if (!eventId || togglingSales) return
    setTogglingSales(true)
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
    } finally {
      setTogglingSales(false)
    }
  }

  // Clear the "Saved" flash after 2.5s so it doesn't linger.
  useEffect(() => {
    if (!savedFlash) return
    const t = setTimeout(() => setSavedFlash(false), 2500)
    return () => clearTimeout(t)
  }, [savedFlash])

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

  // Hard load failure (only possible in edit mode). Showing the empty
  // form here would let the user PATCH the wrong record once they
  // typed anything, so we block the editor entirely and offer a retry.
  if (loadFailed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Link
          href="/promoter"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] px-6 py-12 text-center">
          <p className="mb-2 text-lg font-medium text-red-300">Couldn&apos;t load this event</p>
          <p className="mb-6 text-sm text-neutral-400">
            The event data didn&apos;t come back. Don&apos;t edit blind — try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "details", label: "Details", icon: <FileText className="h-4 w-4" /> },
    ...(mode === "edit"
      ? [
          { key: "bouts" as Tab, label: "Fight Card", icon: <Swords className="h-4 w-4" /> },
          { key: "tickets" as Tab, label: "Tickets", icon: <Ticket className="h-4 w-4" /> },
          { key: "sales" as Tab, label: "Sales", icon: <TrendingUp className="h-4 w-4" /> },
        ]
      : []),
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back */}
      <Link
        href="/promoter"
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
                href={`/fights/${eventId}`}
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

      {/* Saved confirmation — clears itself after 2.5s. Lives above the
          tabs so users get visible feedback after PATCH succeeds. */}
      {savedFlash && (
        <div role="status" aria-live="polite" className="mb-4 rounded-lg bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          Saved
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      {TABS.length > 1 && (
        <div
          role="tablist"
          aria-label="Event editor sections"
          className="mb-6 flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1"
        >
          {TABS.map((t) => {
            const selected = tab === t.key
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={selected}
                aria-controls={`tab-panel-${t.key}`}
                id={`tab-${t.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(t.key)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Tab Content */}
      {tab === "details" && (
        <DetailsTab
          form={form}
          setForm={setForm}
          eventId={eventId}
          eventStatus={eventStatus}
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
          togglingSales={togglingSales}
          onToggleSales={toggleTicketSales}
          onAdd={addTicketTier}
          onDelete={deleteTicketTier}
          onUpdate={updateTicketTier}
        />
      )}
      {tab === "sales" && eventId && (
        <SalesTab eventId={eventId} />
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
  eventId,
  eventStatus,
  onSave,
  saving,
  isCreate,
}: {
  form: EventForm
  setForm: (f: EventForm) => void
  eventId?: string
  eventStatus?: string
  onSave: () => void
  saving: boolean
  isCreate: boolean
}) {
  const update = (field: keyof EventForm, value: string) =>
    setForm({ ...form, [field]: value })

  // Cover image upload state. Only meaningful in edit mode — create
  // mode shows the field but disabled with a note since the event
  // doesn't have an ID yet to attach the file to.
  const coverFileInputRef = useRef<HTMLInputElement>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !eventId) return
    setCoverUploading(true)
    setCoverError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch(`/api/promoter/events/${eventId}/cover`, {
        method: "POST",
        body: fd,
      })
      const data = (await res.json().catch(() => ({}))) as { cover_image_url?: string; error?: string }
      if (!res.ok) {
        setCoverError(data.error || "Upload failed")
        return
      }
      setForm({ ...form, cover_image_url: data.cover_image_url || "" })
    } catch {
      setCoverError("Network error — try again")
    } finally {
      setCoverUploading(false)
      if (coverFileInputRef.current) coverFileInputRef.current.value = ""
    }
  }

  async function handleCoverRemove() {
    if (!eventId || !form.cover_image_url) return
    setCoverUploading(true)
    setCoverError(null)
    try {
      const res = await fetch(`/api/promoter/events/${eventId}/cover`, {
        method: "DELETE",
      })
      if (res.ok) {
        setForm({ ...form, cover_image_url: "" })
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setCoverError(data.error || "Remove failed")
      }
    } catch {
      setCoverError("Network error — try again")
    } finally {
      setCoverUploading(false)
    }
  }

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

      {/* Cover image — only editable in edit mode (needs an event ID
          to attach the upload to). In create mode we show a hint to
          come back after saving. */}
      <Field label="Cover image">
        <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <div className="h-20 w-32 shrink-0 overflow-hidden rounded-md bg-zinc-950 ring-1 ring-white/10">
            {form.cover_image_url ? (
              // Plain <img> so we don't need to whitelist the Supabase
              // Storage hostname in next/image config.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.cover_image_url}
                alt="Event cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-600">
                No cover
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-zinc-500">
              Shows on the public fight page hero, the event card on
              the fights list (ockock.app/fights), and the social preview when shared.
              JPEG / PNG / WebP / GIF, up to 8MB. Landscape works best.
            </p>
            {isCreate ? (
              <p className="mt-2 text-[11px] text-amber-300/80">
                Save the event first, then come back to upload a cover.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverUpload}
                  disabled={coverUploading}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  disabled={coverUploading}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-50"
                >
                  {coverUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {form.cover_image_url ? "Replace cover" : "Upload cover"}
                </button>
                {form.cover_image_url && (
                  <button
                    type="button"
                    onClick={handleCoverRemove}
                    disabled={coverUploading}
                    className="inline-flex items-center rounded-md px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </button>
                )}
              </div>
            )}
            {coverError && (
              <p className="mt-2 text-xs text-red-400">{coverError}</p>
            )}
          </div>
        </div>
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
            min={0}
            step={1}
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

      {/* Danger zone — only render in edit mode (no event to cancel
          in create mode) and never re-render once the event is
          already cancelled. */}
      {!isCreate && eventId && eventStatus !== "cancelled" && (
        <DangerZone
          eventId={eventId}
          onCancelled={() => setEventStatus("cancelled")}
        />
      )}
      {!isCreate && eventStatus === "cancelled" && (
        <div className="mt-10 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] p-4 text-sm text-rose-200">
          <p className="font-semibold">This event is cancelled.</p>
          <p className="mt-1 text-xs text-rose-200/80">
            Ticket sales are closed and any paid orders were refunded.
            The event is hidden from the public fights list.
          </p>
        </div>
      )}
    </div>
  )
}

// Cancel-event control. Visually segregated as "Danger zone" because
// the action is destructive + irreversible. Two-step InlineConfirm
// with an optional reason textarea that gets stamped on each
// Stripe refund (so the receipt to the buyer references the
// cancellation, not a generic refund).
const REASON_MAX = 500

function DangerZone({
  eventId,
  onCancelled,
}: {
  eventId: string
  onCancelled: () => void
}) {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<{
    stripe_refunds_initiated: number
    cash_marked_cancelled: number
    failed: number
    total: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function cancelEvent() {
    setSubmitting(true)
    setError(null)
    setSummary(null)
    try {
      const res = await fetch(`/api/promoter/events/${eventId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Cancellation failed")
        return
      }
      setSummary(data.summary)
      // Soft swap to the "already cancelled" panel — parent flips
      // eventStatus, we ask Next to revalidate any server data, no
      // full page reload, scroll position preserved. The summary
      // stays visible for 2s before the panel swaps out so the
      // promoter has time to read the refund counts.
      setTimeout(() => {
        onCancelled()
        router.refresh()
      }, 2000)
    } catch {
      setError("Network error — try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Result summary stays visible until the page reloads in 2s. Gives
  // the promoter a beat to read what just happened.
  if (summary) {
    return (
      <div className="mt-10 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] p-4">
        <p className="text-sm font-semibold text-rose-200">Event cancelled.</p>
        <ul className="mt-2 space-y-1 text-xs text-rose-200/80">
          <li>
            <span className="font-mono tabular-nums text-rose-100">
              {summary.stripe_refunds_initiated}
            </span>{" "}
            Stripe refund{summary.stripe_refunds_initiated === 1 ? "" : "s"} initiated
            {summary.stripe_refunds_initiated > 0 && " (Stripe emails the buyer when processed)"}
          </li>
          <li>
            <span className="font-mono tabular-nums text-rose-100">
              {summary.cash_marked_cancelled}
            </span>{" "}
            cash/transfer order{summary.cash_marked_cancelled === 1 ? "" : "s"} marked refunded
            {summary.cash_marked_cancelled > 0 && " (reach out manually to return cash)"}
          </li>
          {summary.failed > 0 && (
            <li className="text-amber-300">
              <span className="font-mono tabular-nums">{summary.failed}</span> failed —
              check Stripe Dashboard
            </li>
          )}
        </ul>
        <p className="mt-3 text-[10px] text-rose-200/60">Refreshing…</p>
      </div>
    )
  }

  return (
    <div className="mt-10 rounded-xl border border-rose-500/30 bg-rose-500/[0.04] p-4">
      <p className="text-sm font-semibold text-rose-200">Danger zone</p>
      <p className="mt-1 text-xs text-rose-200/70">
        Cancel this event and refund all paid orders. Stripe orders get
        a real money refund (Stripe emails the buyer). Cash/transfer
        orders are marked refunded — you&apos;ll need to reach out and
        return cash manually.
      </p>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="cancel-reason" className="block text-xs font-medium text-rose-200">
            Reason <span className="text-rose-200/60">(optional — stamped on every refund)</span>
          </label>
          {/* Visible counter so the silent truncation at 500 isn't a
              surprise. Only shown past 80% to avoid clutter. */}
          {reason.length > REASON_MAX * 0.8 && (
            <span
              className={`text-[10px] tabular-nums ${
                reason.length >= REASON_MAX ? "text-rose-300" : "text-rose-200/60"
              }`}
            >
              {reason.length}/{REASON_MAX}
            </span>
          )}
        </div>
        <textarea
          id="cancel-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={REASON_MAX}
          rows={2}
          placeholder="e.g. Severe weather — venue closed. Refund processing now."
          className="w-full resize-none rounded-md border border-rose-500/20 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-rose-200/40 outline-none focus:border-rose-400/50"
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-400">{error}</p>
      )}

      <div className="mt-3">
        <InlineConfirm
          onConfirm={cancelEvent}
          disabled={submitting}
          title="Cancel event and refund all paid orders"
          confirmLabel="Yes, cancel + refund all"
          className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/25 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cancelling…
            </>
          ) : (
            <>
              <X className="h-3.5 w-3.5" />
              Cancel event
            </>
          )}
        </InlineConfirm>
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
          <InlineConfirm
            onConfirm={onDelete}
            title="Delete bout"
            confirmLabel="Delete"
            className="rounded p-1 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </InlineConfirm>
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
        <InlineConfirm
          onConfirm={() => onCancelInvitation(pending.id)}
          title="Cancel invitation"
          confirmLabel="Cancel invite"
          className="mt-2 rounded px-2 py-0.5 text-[10px] text-neutral-400 hover:bg-red-500/10 hover:text-red-400"
        >
          Cancel invite
        </InlineConfirm>
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
        <InlineConfirm
          onConfirm={onClear}
          title="Clear fighter"
          confirmLabel="Clear"
          className="rounded px-2 py-0.5 text-[10px] text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
        >
          Clear
        </InlineConfirm>
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

  // Escape closes the picker — matches the standard modal interaction
  // and avoids forcing the promoter to aim for the backdrop on mobile.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

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
            <div className="py-8 px-4 text-center">
              <p className="text-sm text-neutral-500">
                {q ? `No fighters match "${query}"` : "No fighters opted in yet"}
              </p>
              <p className="mt-1 text-[11px] text-neutral-600">
                Fighters need to flip &ldquo;Open to Fights&rdquo; on their trainer profile to appear here.
              </p>
              {!q && (
                <a
                  href="/trainer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-[11px] font-medium text-amber-300 hover:bg-amber-500/15"
                >
                  Open my trainer profile ↗
                </a>
              )}
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
  togglingSales,
  onToggleSales,
  onAdd,
  onDelete,
  onUpdate,
}: {
  tickets: TicketTier[]
  ticketSalesOpen: boolean
  togglingSales: boolean
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
          type="button"
          role="switch"
          aria-checked={ticketSalesOpen}
          aria-label={ticketSalesOpen ? "Close ticket sales" : "Open ticket sales"}
          onClick={onToggleSales}
          disabled={togglingSales}
          className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
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
  // Surface the specific reason a save was rejected rather than
  // silently coercing bad input back to the old value. Cleared on
  // each edit attempt + every keystroke.
  const [editError, setEditError] = useState<string | null>(null)

  function save() {
    setEditError(null)
    const trimmedName = name.trim()
    if (!trimmedName) {
      setEditError("Tier name is required.")
      return
    }
    const priceNum = Number(price)
    if (!Number.isFinite(priceNum) || priceNum <= 0 || !Number.isInteger(priceNum)) {
      setEditError("Price must be a whole positive number (THB).")
      return
    }
    const qtyNum = Number(qty)
    if (!Number.isFinite(qtyNum) || qtyNum < 0 || !Number.isInteger(qtyNum)) {
      setEditError("Quantity must be a whole number 0 or greater.")
      return
    }
    // Don't let the promoter set total below what's already sold —
    // the API would reject this, but failing here is friendlier.
    if (qtyNum < tier.quantity_sold) {
      setEditError(
        `Can't set total below ${tier.quantity_sold} — that many are already sold.`,
      )
      return
    }
    onUpdate({
      tier_name: trimmedName,
      price_thb: priceNum,
      quantity_total: qtyNum,
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
                min={1}
                step={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
              />
            </Field>
            <Field label="Total Quantity">
              <input
                type="number"
                min={tier.quantity_sold}
                step={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500/50"
              />
            </Field>
          </div>
          {editError && (
            <p role="alert" className="text-xs text-red-400">{editError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={save}
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-black hover:bg-amber-400"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditError(null)
                // Reset local state so the next "Edit" starts clean
                // from the canonical tier values, not abandoned input.
                setName(tier.tier_name)
                setPrice(tier.price_thb.toString())
                setQty(tier.quantity_total.toString())
                setEditing(false)
              }}
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
          aria-label="Edit ticket tier"
        >
          <FileText className="h-3.5 w-3.5" />
        </button>
        <InlineConfirm
          onConfirm={onDelete}
          title="Delete ticket tier"
          confirmLabel="Delete"
          className="rounded p-1.5 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </InlineConfirm>
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

// ============================================
// Sales Tab — real-time view of ticket sales for the event
// ============================================

interface SalesTotals {
  tickets_sold: number
  revenue_thb: number
  scanned_at_door: number
  orders: number
  // True if there are more orders than the API's aggregation cap, in
  // which case the totals are computed from the first 10k and may
  // under-count. Hint shown next to the numbers.
  approximate?: boolean
}

interface SalesTier {
  id: string
  tier_name: string
  price_thb: number
  quantity_total: number
  quantity_sold: number
  quantity_remaining: number
  revenue_thb: number
  is_active: boolean
}

interface SalesOrder {
  id: string
  order_reference: string
  guest_name: string | null
  guest_email: string | null
  quantity: number
  total_price_thb: number
  created_at: string
  scanned_at: string | null
  scan_count: number
  tier_name: string | null
  payment_status?: string
  status?: string
  payment_method?: string | null
}

// Default page size — matches the API default. Buttons walk the
// promoter through larger pages on demand.
const SALES_PAGE_SIZE = 200
// Max page size the API will honor; surfaced as a "Load all" option
// when the page-by-page cadence isn't fast enough.
const SALES_MAX_PAGE = 1000

function SalesTab({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState<SalesTotals | null>(null)
  const [tiers, setTiers] = useState<SalesTier[]>([])
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [pagination, setPagination] = useState<{
    limit: number
    returned: number
    total: number
    has_more: boolean
  } | null>(null)
  // Promoter-controlled page size. Stepping up triggers a fresh load
  // (we always fetch from the top with the new cap rather than
  // accumulating client-side, so polling stays consistent).
  const [pageSize, setPageSize] = useState(SALES_PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  // Refund-in-flight tracking. After the Stripe API call returns, we
  // optimistically show "Refund pending" until the webhook flips the
  // order to refunded — which usually takes <2 seconds. A short
  // poll-on-success keeps the UI honest.
  const [refundingId, setRefundingId] = useState<string | null>(null)
  const [refundPendingIds, setRefundPendingIds] = useState<Set<string>>(new Set())
  const [refundError, setRefundError] = useState<string | null>(null)

  const refundOrder = async (orderId: string) => {
    setRefundingId(orderId)
    setRefundError(null)
    try {
      const res = await fetch(
        `/api/promoter/events/${eventId}/orders/${orderId}/refund`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      )
      const data = await res.json()
      if (!res.ok) {
        setRefundError(data.error || "Refund failed.")
        return
      }
      // Mark optimistic "refund pending" then refetch after a beat to
      // pick up the webhook's payment_status flip.
      setRefundPendingIds((prev) => new Set(prev).add(orderId))
      setTimeout(() => load(), 1500)
      setTimeout(() => load(), 4000)
    } catch {
      setRefundError("Network error — try again.")
    } finally {
      setRefundingId(null)
    }
  }

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  // "Live" toggle — polls /sales every POLL_MS so the promoter sees
  // new orders / scans roll in without manually refreshing. Pauses
  // when the tab isn't visible (no point hitting the API while the
  // user is in another window) and resumes when it comes back.
  const [live, setLive] = useState(true)
  // 5s heartbeat so the "Updated Xs ago" label advances between
  // polls — purely for the relative-time display, doesn't trigger
  // any network activity.
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 5_000)
    return () => clearInterval(t)
  }, [])

  const load = async (opts?: { background?: boolean; limit?: number }) => {
    const limit = opts?.limit ?? pageSize
    try {
      const res = await fetch(
        `/api/promoter/events/${eventId}/sales?limit=${limit}`,
        { cache: "no-store" },
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || "Couldn't load sales data.")
        return
      }
      const data = await res.json()
      setTotals(data.totals)
      setTiers(data.tiers ?? [])
      setOrders(data.orders ?? [])
      setPagination(data.pagination ?? null)
      setError(null)
      setLastUpdated(new Date())
    } catch {
      // Background polls fail silent — only foreground loads surface
      // the error to avoid spam if the network blips during a poll.
      if (!opts?.background) setError("Network error. Try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  // Step up the page size and reload from the top. Re-fetching (vs
  // appending) keeps the data consistent with the polling cadence:
  // every poll uses the current `pageSize`, so the user always sees
  // the most recent N rows in order.
  const loadMore = async () => {
    const next = Math.min(pageSize + SALES_PAGE_SIZE, SALES_MAX_PAGE)
    setPageSize(next)
    setLoadingMore(true)
    await load({ limit: next })
  }

  // Initial load on mount + when eventId changes.
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Live polling loop. 20s cadence — slow enough to be cheap, fast
  // enough that event-night door scans land within the next pull.
  // Listening to document.visibilityState lets us pause when the
  // page is backgrounded (mobile lock screen, tab switched).
  useEffect(() => {
    if (!live) return
    const POLL_MS = 20_000
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    const tick = () => {
      if (cancelled) return
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return
      load({ background: true })
    }

    timer = setInterval(tick, POLL_MS)
    // Catch up immediately when the tab regains focus.
    const onVis = () => {
      if (document.visibilityState === "visible") load({ background: true })
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis)
    }
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVis)
      }
    }
    // pageSize is included so polling picks up the current page after
    // the promoter clicks "Load more" — otherwise the closure-captured
    // load() would keep fetching the smaller initial page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, eventId, pageSize])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        <p className="mb-3">{error}</p>
        <button
          onClick={() => {
            setError(null)
            setLoading(true)
            load()
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20"
        >
          Retry
        </button>
      </div>
    )
  }

  const q = query.trim().toLowerCase()
  const filteredOrders = q
    ? orders.filter(
        (o) =>
          (o.guest_name || "").toLowerCase().includes(q) ||
          (o.guest_email || "").toLowerCase().includes(q) ||
          (o.order_reference || "").toLowerCase().includes(q),
      )
    : orders

  const scanProgress =
    totals && totals.tickets_sold > 0
      ? Math.round((totals.scanned_at_door / totals.tickets_sold) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Revenue"
          value={`${totals?.approximate ? "~" : ""}฿${(totals?.revenue_thb ?? 0).toLocaleString()}`}
          icon={<TrendingUp className="h-4 w-4 text-emerald-300" />}
          tone="emerald"
        />
        <StatCard
          label="Tickets sold"
          value={`${totals?.approximate ? "~" : ""}${(totals?.tickets_sold ?? 0).toLocaleString()}`}
          icon={<Ticket className="h-4 w-4 text-amber-300" />}
          tone="amber"
        />
        <StatCard
          label="Orders"
          value={(totals?.orders ?? 0).toLocaleString()}
          icon={<FileText className="h-4 w-4 text-sky-300" />}
          tone="sky"
        />
        <StatCard
          label="Scanned at door"
          value={`${totals?.scanned_at_door ?? 0}${
            totals && totals.tickets_sold > 0 ? ` / ${totals.tickets_sold}` : ""
          }`}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />}
          tone="emerald"
          sub={totals && totals.tickets_sold > 0 ? `${scanProgress}% admitted` : undefined}
        />
      </div>
      {totals?.approximate && (
        <p className="-mt-3 text-[11px] text-amber-400/80">
          Totals shown are approximate (first 10,000 orders). Export for exact numbers.
        </p>
      )}

      {/* Live status bar — shows freshness + toggle. Worth its own row
          because event-night promoters check this constantly. */}
      <div className="-mt-2 mb-2 flex items-center justify-between text-[11px] text-neutral-500">
        <button
          type="button"
          onClick={() => setLive((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900/50 ring-1 ring-zinc-800 px-2 py-0.5 hover:bg-zinc-900 transition-colors"
          aria-pressed={live}
          title={live ? "Click to pause auto-refresh" : "Click to enable live updates"}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              live ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
            }`}
          />
          <span className={live ? "text-emerald-300" : "text-zinc-500"}>
            {live ? "Live" : "Paused"}
          </span>
        </button>
        <span className="tabular-nums">
          {lastUpdated ? `Updated ${formatRelativeTime(lastUpdated)}` : "—"}
        </span>
      </div>

      {/* Per-tier breakdown */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            By tier
          </h3>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true)
              load()
            }}
            disabled={refreshing}
            className="text-xs text-neutral-500 hover:text-white"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {tiers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-6 text-center text-sm text-neutral-500">
            No tiers yet — add some in the Tickets tab.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            {tiers.map((t, i) => {
              const pct =
                t.quantity_total > 0
                  ? Math.round((t.quantity_sold / t.quantity_total) * 100)
                  : 0
              return (
                <div
                  key={t.id}
                  className={`px-4 py-3 ${i > 0 ? "border-t border-white/5" : ""} ${
                    !t.is_active ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {t.tier_name}
                        {!t.is_active && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-neutral-500">
                            inactive
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500">
                        ฿{t.price_thb.toLocaleString()} · {t.quantity_sold} of{" "}
                        {t.quantity_total} sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-300 tabular-nums">
                        ฿{t.revenue_thb.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-neutral-500">{pct}% sold</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full bg-amber-500/70"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Orders */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Buyers ({(pagination?.total ?? orders.length).toLocaleString()})
          </h3>
        </div>
        {refundError && (
          <div
            role="alert"
            className="mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            {refundError}
          </div>
        )}
        <div className="mb-2 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or reference…"
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-white/30"
          />
        </div>
        {filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-8 text-center">
            <Ticket className="mx-auto mb-2 h-8 w-8 text-neutral-600" />
            <p className="text-sm text-neutral-400">
              {orders.length === 0
                ? "No paid orders yet — share the public fight page to drive sales."
                : `No buyers match "${query}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            {filteredOrders.map((o, i) => {
              const purchasedAt = new Date(o.created_at).toLocaleDateString(
                undefined,
                { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
              )
              return (
                <div
                  key={o.id}
                  className={`px-4 py-3 ${i > 0 ? "border-t border-white/5" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {o.guest_name || "Guest"}
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-neutral-500">
                          ×{o.quantity}
                        </span>
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {o.guest_email || "—"}
                        {o.tier_name && ` · ${o.tier_name}`}
                      </p>
                      <p className="text-[10px] text-neutral-600 inline-flex flex-wrap items-center gap-1.5">
                        <span className="font-mono">{o.order_reference}</span>
                        {/* Payment-method badge — only render for non-Stripe so
                            the Sales tab can distinguish walkup vs online sales
                            at a glance. Stripe is the default; cash + transfer
                            stand out. */}
                        {o.payment_method === "cash" && (
                          <span className="rounded bg-emerald-500/10 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wider text-emerald-300">
                            Cash
                          </span>
                        )}
                        {o.payment_method === "transfer" && (
                          <span className="rounded bg-sky-500/10 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wider text-sky-300">
                            Transfer
                          </span>
                        )}
                        <span>·</span>
                        <span>{purchasedAt}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {o.payment_status === "refunded" ? (
                        <>
                          <p className="text-sm font-semibold text-zinc-500 line-through tabular-nums">
                            ฿{o.total_price_thb.toLocaleString()}
                          </p>
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-rose-400">
                            Refunded
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-emerald-300 tabular-nums">
                            ฿{o.total_price_thb.toLocaleString()}
                          </p>
                          {o.scanned_at ? (
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-emerald-400">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Admitted
                              {o.scan_count > 1 && ` (${o.scan_count}×)`}
                            </p>
                          ) : refundPendingIds.has(o.id) ? (
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-amber-400">
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              Refund pending
                            </p>
                          ) : (
                            <p className="mt-0.5 text-[10px] text-neutral-500">
                              Not yet scanned
                            </p>
                          )}
                          {/* Refund button only renders for Stripe-paid
                              orders that haven't been scanned. Cash and
                              transfer orders need to be reconciled
                              manually — no Stripe payment intent to
                              refund through. */}
                          {!o.scanned_at &&
                            !refundPendingIds.has(o.id) &&
                            (!o.payment_method || o.payment_method === "stripe") && (
                            <InlineConfirm
                              onConfirm={() => refundOrder(o.id)}
                              disabled={refundingId === o.id}
                              title="Refund this order via Stripe"
                              className="mt-1.5 inline-flex items-center rounded-md border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition-colors disabled:opacity-50"
                              confirmLabel="Refund"
                            >
                              {refundingId === o.id ? "Refunding…" : "Refund"}
                            </InlineConfirm>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {pagination && pagination.total > 0 && (
          <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-[11px] text-neutral-600">
              Showing {pagination.returned.toLocaleString()} of{" "}
              {pagination.total.toLocaleString()} order
              {pagination.total === 1 ? "" : "s"}
              {pagination.has_more && " — most recent first"}
            </p>
            {pagination.has_more && pageSize < SALES_MAX_PAGE && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/10 disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading…
                  </>
                ) : (
                  <>Load more</>
                )}
              </button>
            )}
            {pagination.has_more && pageSize >= SALES_MAX_PAGE && (
              <p className="text-[11px] text-neutral-600">
                Hit the per-page max ({SALES_MAX_PAGE.toLocaleString()}). Export to see the full history.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
  sub,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: "amber" | "emerald" | "sky"
  sub?: string
}) {
  const toneRing =
    tone === "emerald"
      ? "ring-emerald-500/20"
      : tone === "sky"
        ? "ring-sky-500/20"
        : "ring-amber-500/20"
  return (
    <div className={`rounded-xl bg-white/[0.03] ring-1 ${toneRing} p-3`}>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-neutral-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// "Updated 5s ago" style relative time. Sales tab polls every 20s
// so we mostly need sub-minute resolution. Falls back to a clock
// time once the data's more than an hour stale (shouldn't happen
// with the polling on, but harmless).
function formatRelativeTime(d: Date): string {
  const diff = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
  if (diff < 5) return "just now"
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}
