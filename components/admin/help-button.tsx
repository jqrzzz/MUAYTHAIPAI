"use client"

/**
 * Floating "Get help" button for /admin pages.
 *
 * Three views inside the popover:
 *   list    — recent tickets (default if any exist) + "+ New ticket"
 *   compose — subject + body form to open a new ticket
 *   detail  — full conversation thread for one ticket + reply textarea
 *
 * On submit, AI categorizes + drafts the operator's reply (visible in
 * /platform-admin → Support). When operator replies, it lands here in
 * the detail view + an email goes to the gym admin's inbox.
 */
import { useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import { SaasButton, SaasInput, SaasTextarea } from "@/components/saas"

const SLA_LABEL: Record<string, string> = {
  urgent: "1 hour",
  high: "6 hours",
  normal: "24 hours",
  low: "3 days",
}

type View = "list" | "compose" | "detail" | "success"

interface TicketSummary {
  id: string
  subject: string
  category: string
  priority: string
  status: string
  sla_due_at: string | null
  ai_summary: string | null
  created_at: string
  resolved_at: string | null
}

interface Message {
  id: string
  direction: "inbound" | "outbound"
  body: string
  handled_by: string | null
  created_at: string
}

export default function HelpButton() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>("list")
  const [tickets, setTickets] = useState<TicketSummary[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)

  const refreshTickets = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch("/api/admin/support", { cache: "no-store" })
      const data = await res.json()
      if (res.ok) setTickets(data.tickets ?? [])
    } catch {
      // ignore
    } finally {
      setLoadingList(false)
    }
  }, [])

  // On open, fetch ticket list + decide initial view
  useEffect(() => {
    if (!open) return
    refreshTickets().then(() => {
      // If there are no tickets, jump straight to compose
      // (caller can still see history later by reopening)
    })
  }, [open, refreshTickets])

  // After tickets load on open, pick view if not already set by user
  useEffect(() => {
    if (open && view === "list" && !loadingList && tickets.length === 0) {
      setView("compose")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loadingList])

  const closeAll = () => {
    setOpen(false)
    setActiveTicketId(null)
    setView("list")
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 ring-1 ring-zinc-700 backdrop-blur text-zinc-100 text-[12px] font-medium px-3 py-2 shadow-lg transition-all hover:scale-105 active:scale-95"
        aria-label="Get help"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Help
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeAll}
        >
          <div
            className="w-full sm:max-w-md max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl ring-1 ring-zinc-800 bg-zinc-950 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {view === "detail" || view === "compose" ? (
                  <button
                    onClick={() => {
                      setView("list")
                      setActiveTicketId(null)
                    }}
                    className="text-zinc-500 hover:text-zinc-200 -ml-1 p-1 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <HelpCircle className="h-4 w-4 text-indigo-300" />
                )}
                <p className="text-[14px] font-semibold text-white">
                  {view === "compose"
                    ? "New ticket"
                    : view === "detail"
                      ? "Ticket"
                      : view === "success"
                        ? "Sent"
                        : "Help"}
                </p>
              </div>
              <button
                onClick={closeAll}
                className="text-zinc-500 hover:text-zinc-200 -mr-1 p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {view === "list" && (
                <ListView
                  tickets={tickets}
                  loading={loadingList}
                  onOpenTicket={(id) => {
                    setActiveTicketId(id)
                    setView("detail")
                  }}
                  onCompose={() => setView("compose")}
                />
              )}
              {view === "compose" && (
                <ComposeView
                  onSubmitted={(priority, category) => {
                    setView("success")
                    refreshTickets()
                    // small delay → list view shows the new ticket on top
                    setTimeout(() => {
                      // suppress the success view from sticking
                    }, 0)
                    void priority
                    void category
                  }}
                />
              )}
              {view === "detail" && activeTicketId && (
                <DetailView
                  ticketId={activeTicketId}
                  onReplied={() => refreshTickets()}
                />
              )}
              {view === "success" && (
                <SuccessView
                  onDone={() => {
                    setView("list")
                    refreshTickets()
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── list view ──────────────────────────────────────────────────── */

function ListView({
  tickets,
  loading,
  onOpenTicket,
  onCompose,
}: {
  tickets: TicketSummary[]
  loading: boolean
  onOpenTicket: (id: string) => void
  onCompose: () => void
}) {
  if (loading) {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
      </div>
    )
  }
  return (
    <>
      {tickets.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            Your tickets
          </p>
        </div>
      )}
      <ul className="divide-y divide-zinc-900/60">
        {tickets.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => onOpenTicket(t.id)}
              className="w-full text-left px-4 py-3 hover:bg-zinc-900/40 transition-colors flex items-center gap-3"
            >
              <StatusIcon status={t.status} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-zinc-100 truncate font-medium">
                  {t.subject}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 capitalize">
                  {t.status === "in_progress" ? "in progress" : t.status === "waiting_customer" ? "waiting on you" : t.status}
                  {" · "}
                  {t.priority}
                  {" · "}
                  {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
            </button>
          </li>
        ))}
      </ul>
      <div className="p-4 border-t border-zinc-900/60">
        <SaasButton onClick={onCompose} className="w-full" size="sm">
          <Plus className="h-3 w-3" />
          New ticket
        </SaasButton>
      </div>
    </>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === "resolved" || status === "closed") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
  }
  if (status === "waiting_customer") {
    return <MessageCircle className="h-4 w-4 text-amber-300 shrink-0" />
  }
  return <Clock className="h-4 w-4 text-indigo-300 shrink-0" />
}

/* ─── compose view ───────────────────────────────────────────────── */

function ComposeView({
  onSubmitted,
}: {
  onSubmitted: (priority: string, category: string) => void
}) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!subject.trim() || !body.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          source_url:
            typeof window !== "undefined" ? window.location.href : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to send")
      onSubmitted(
        data.ticket?.priority ?? "normal",
        data.ticket?.category ?? "other",
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-[12px] text-zinc-500 leading-relaxed">
        Tell us what&apos;s up. We auto-route by urgency — bookings broken or
        payments failing get our fastest attention.
      </p>
      <div className="space-y-1.5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Subject</p>
        <SaasInput
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="One-line summary"
          disabled={submitting}
          maxLength={200}
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          What&apos;s happening?
        </p>
        <SaasTextarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Walk us through it. Include any error messages, what you tried, and what you'd expect to happen instead."
          disabled={submitting}
          maxLength={4000}
        />
      </div>
      {error && (
        <div className="rounded-lg ring-1 ring-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      )}
      <SaasButton
        onClick={submit}
        loading={submitting}
        disabled={!subject.trim() || !body.trim() || submitting}
        className="w-full"
      >
        {submitting ? "Sending" : "Send"}
      </SaasButton>
    </div>
  )
}

/* ─── success splash ─────────────────────────────────────────────── */

function SuccessView({ onDone }: { onDone: () => void }) {
  return (
    <div className="p-6 text-center space-y-3">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25">
        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
      </div>
      <div>
        <p className="text-[14px] font-medium text-white">Got it — we&apos;re on it</p>
        <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">
          We&apos;ll be back in touch via email and inside this dialog. You can
          continue the thread by tapping into your ticket below.
        </p>
      </div>
      <SaasButton onClick={onDone} size="sm" variant="subtle">
        Back to tickets
      </SaasButton>
    </div>
  )
}

/* ─── detail view ────────────────────────────────────────────────── */

function DetailView({
  ticketId,
  onReplied,
}: {
  ticketId: string
  onReplied: () => void
}) {
  const [data, setData] = useState<{
    ticket: TicketSummary & { initial_body: string; resolved_at: string | null }
    messages: Message[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        cache: "no-store",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to load")
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const sendReply = async () => {
    if (!reply.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/support/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || "Failed to send")
      setReply("")
      await refresh()
      onReplied()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="px-4 py-6 text-[12px] text-zinc-500 text-center">
        {error || "Not found"}
      </div>
    )
  }

  const t = data.ticket
  const isClosed = t.status === "resolved" || t.status === "closed"

  return (
    <div className="space-y-3">
      <div className="px-4 py-3 border-b border-zinc-900/60">
        <p className="text-[14px] font-semibold text-white">{t.subject}</p>
        <p className="text-[11px] text-zinc-500 mt-0.5 capitalize">
          {t.status === "in_progress" ? "in progress" : t.status === "waiting_customer" ? "waiting on you" : t.status}
          {" · "}
          {t.priority} priority
          {" · "}
          opened {new Date(t.created_at).toLocaleDateString()}
        </p>
        {!isClosed && t.sla_due_at && (
          <p className="text-[10px] text-zinc-600 mt-1">
            We&apos;ll respond by{" "}
            {new Date(t.sla_due_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      <div className="px-4 space-y-2">
        {data.messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.direction === "inbound" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap ${
                m.direction === "inbound"
                  ? "bg-indigo-500/15 text-indigo-50 ring-1 ring-indigo-500/30"
                  : "bg-zinc-900/70 text-zinc-100 ring-1 ring-zinc-800"
              }`}
            >
              {m.body}
              <p
                className={`mt-1.5 pt-1.5 border-t text-[10px] ${
                  m.direction === "inbound"
                    ? "border-indigo-500/20 text-indigo-300/70"
                    : "border-zinc-800 text-zinc-500"
                }`}
              >
                {m.direction === "inbound"
                  ? "You"
                  : m.handled_by === "ai"
                    ? "OckOck"
                    : "Team MUAYTHAIPAI"}
                {" · "}
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!isClosed && (
        <div className="px-4 pt-3 pb-4 space-y-2 border-t border-zinc-900/60 mt-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            Add to this ticket
          </p>
          <SaasTextarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Add a note, more context, or ask a follow-up…"
            disabled={sending}
            maxLength={4000}
          />
          <SaasButton
            size="sm"
            onClick={sendReply}
            loading={sending}
            disabled={!reply.trim() || sending}
            className="w-full"
          >
            <Send className="h-3 w-3" />
            Send
          </SaasButton>
        </div>
      )}

      {isClosed && (
        <div className="mx-4 mb-4 rounded-lg ring-1 ring-emerald-500/30 bg-emerald-500/[0.06] p-3 text-[12px] text-emerald-200 inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolved
          {t.resolved_at && (
            <span className="text-emerald-300/70 ml-1">
              {new Date(t.resolved_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

void Sparkles
