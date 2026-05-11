"use client"

/**
 * Support tab on /platform-admin.
 *
 * The customer service surface. Operator sees:
 *   - Filter chips: Open / In progress / Waiting / Resolved / All
 *     (Open and Overdue have urgent styling)
 *   - Hero stat strip showing counts + overdue
 *   - Ticket list sorted by SLA risk (overdue first, then closest deadline)
 *   - Click a ticket → drawer with full conversation + AI draft + Reply
 *
 * Mobile-friendly. Designed for backpack ops: glance at Open, see who
 * needs you most, tap, edit the AI draft, send.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  Loader2,
  LifeBuoy,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import {
  Surface,
  SectionHeader,
  StatCard,
  SaasButton,
  SaasTextarea,
  SegmentedControl,
} from "@/components/saas"

interface TicketSummary {
  id: string
  org_id: string
  gym_name: string
  gym_slug: string | null
  gym_email: string | null
  author_name: string | null
  author_email: string | null
  conversation_id: string | null
  subject: string
  initial_body: string
  source_url: string | null
  category: string
  priority: string
  ai_summary: string | null
  status: string
  sla_due_at: string | null
  minutes_remaining: number | null
  created_at: string
  resolved_at: string | null
}

interface Counts {
  open: number
  in_progress: number
  waiting_customer: number
  resolved: number
  closed: number
  overdue: number
}

type FilterTab = "open_all" | "open" | "in_progress" | "waiting_customer" | "resolved" | "all"

export default function SupportTab() {
  const [tickets, setTickets] = useState<TicketSummary[]>([])
  const [counts, setCounts] = useState<Counts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>("open_all")
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/platform-admin/support?status=${filter}`,
        { cache: "no-store" },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load")
      setTickets(data.tickets ?? [])
      setCounts(data.counts ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (openTicketId) {
    return (
      <TicketDetail
        ticketId={openTicketId}
        onBack={() => {
          setOpenTicketId(null)
          refresh()
        }}
      />
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Support"
        eyebrowIcon={LifeBuoy}
        size="lg"
        title="Customer service"
        subtitle="Tickets from gym admins. Sorted by SLA — overdue first. AI drafts a reply for every new ticket; you approve or edit."
      />

      {error && (
        <div className="rounded-xl ring-1 ring-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-300">
          {error}
          <p className="text-[11px] text-red-300/70 mt-1">
            If first load, apply migration{" "}
            <code>scripts/041-add-support-tickets.sql</code>.
          </p>
        </div>
      )}

      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={AlertCircle}
            label="Overdue"
            value={counts.overdue}
            sub={counts.overdue > 0 ? "Past SLA" : "All on track"}
            tone={counts.overdue > 0 ? "amber" : "emerald"}
          />
          <StatCard
            icon={MessageSquare}
            label="Open"
            value={counts.open}
            sub="Awaiting first reply"
            tone="indigo"
          />
          <StatCard
            icon={Clock}
            label="In progress"
            value={counts.in_progress + counts.waiting_customer}
            sub={`${counts.waiting_customer} waiting on customer`}
            tone="zinc"
          />
          <StatCard
            icon={CheckCircle2}
            label="Resolved"
            value={counts.resolved}
            sub="Last 200 tickets"
            tone="zinc"
          />
        </div>
      )}

      <div className="w-full max-w-2xl">
        <SegmentedControl<FilterTab>
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "open_all", label: `Active${counts ? ` ${counts.open + counts.in_progress + counts.waiting_customer}` : ""}` },
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In progress" },
            { value: "resolved", label: "Resolved" },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      {loading && tickets.length === 0 ? (
        <Surface>
          <div className="text-center py-12">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
          </div>
        </Surface>
      ) : tickets.length === 0 ? (
        <Surface>
          <div className="px-4 py-10 text-center">
            <LifeBuoy className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
            <p className="text-[13px] text-zinc-300 font-medium">
              {filter === "open_all" || filter === "open"
                ? "No open tickets — caught up"
                : "No tickets in this view"}
            </p>
            <p className="text-[12px] text-zinc-500 mt-1">
              When a gym admin clicks &ldquo;Help&rdquo; in /admin, the request lands here.
            </p>
          </div>
        </Surface>
      ) : (
        <Surface>
          <ul className="divide-y divide-zinc-900/60">
            {tickets.map((t) => (
              <TicketRow
                key={t.id}
                ticket={t}
                onClick={() => setOpenTicketId(t.id)}
              />
            ))}
          </ul>
        </Surface>
      )}
    </div>
  )
}

function TicketRow({
  ticket,
  onClick,
}: {
  ticket: TicketSummary
  onClick: () => void
}) {
  const overdue = ticket.minutes_remaining != null && ticket.minutes_remaining < 0
  const urgentSoon =
    ticket.minutes_remaining != null &&
    ticket.minutes_remaining >= 0 &&
    ticket.minutes_remaining < 60
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full text-left px-4 py-3 hover:bg-zinc-900/30 transition-colors flex items-start gap-3"
      >
        <PriorityChip priority={ticket.priority} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-medium text-zinc-100 truncate">
              {ticket.subject}
            </p>
            <CategoryBadge category={ticket.category} />
            <StatusBadge status={ticket.status} />
          </div>
          {ticket.ai_summary && (
            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
              <Sparkles className="h-2.5 w-2.5 inline mr-1 text-indigo-400/70" />
              {ticket.ai_summary}
            </p>
          )}
          <p className="text-[10px] text-zinc-600 mt-1">
            {ticket.gym_name}
            {ticket.author_email && (
              <>
                {" · "}
                <span className="text-zinc-500">{ticket.author_email}</span>
              </>
            )}
            {" · "}
            <span className="text-zinc-700">
              {new Date(ticket.created_at).toLocaleString()}
            </span>
          </p>
        </div>
        <div className="text-right shrink-0 min-w-[80px]">
          {ticket.minutes_remaining == null ? (
            <p className="text-[10px] text-zinc-600">—</p>
          ) : overdue ? (
            <p className="text-[11px] text-amber-300 font-medium">
              {Math.abs(Math.round(ticket.minutes_remaining / 60))}h overdue
            </p>
          ) : urgentSoon ? (
            <p className="text-[11px] text-amber-300 font-medium">
              {ticket.minutes_remaining}m left
            </p>
          ) : (
            <p className="text-[11px] text-zinc-500">
              {ticket.minutes_remaining > 60 * 24
                ? `${Math.round(ticket.minutes_remaining / (60 * 24))}d`
                : `${Math.round(ticket.minutes_remaining / 60)}h`}{" "}
              left
            </p>
          )}
        </div>
      </button>
    </li>
  )
}

/* ─── ticket detail view ─────────────────────────────────────────── */

interface Message {
  id: string
  direction: "inbound" | "outbound"
  sender: string | null
  recipient: string | null
  body: string
  handled_by: string | null
  draft_status: string | null
  needs_review: boolean
  metadata: Record<string, unknown> | null
  created_at: string
}

interface TicketDetailData {
  ticket: TicketSummary & {
    initial_body: string
    resolution_summary: string | null
    organizations: { name: string; email: string | null } | null
    users: { full_name: string | null; email: string | null } | null
  }
  messages: Message[]
}

function TicketDetail({
  ticketId,
  onBack,
}: {
  ticketId: string
  onBack: () => void
}) {
  const [data, setData] = useState<TicketDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState("")
  const [sending, setSending] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/platform-admin/support/${ticketId}`, {
        cache: "no-store",
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to load")
      setData(json as TicketDetailData)
      // Pre-fill reply with the AI draft if present
      const draft = (json.messages ?? []).find(
        (m: Message) => m.draft_status === "pending" && m.direction === "outbound",
      )
      if (draft && !replyBody) {
        setReplyBody(draft.body)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const aiDraft = useMemo(
    () =>
      (data?.messages ?? []).find(
        (m) => m.draft_status === "pending" && m.direction === "outbound",
      ),
    [data],
  )

  const sendReply = async (markStatus: "in_progress" | "resolved" | "waiting_customer") => {
    if (!replyBody.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/platform-admin/support/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim(), mark_status: markStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to send")
      onBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSending(false)
    }
  }

  const updateStatus = async (status: "resolved" | "closed" | "in_progress") => {
    try {
      const res = await fetch(`/api/platform-admin/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error || "Failed")
      }
      onBack()
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  if (loading && !data) {
    return (
      <Surface>
        <div className="text-center py-12">
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
        </div>
      </Surface>
    )
  }

  if (error || !data) {
    return (
      <Surface>
        <div className="text-center py-8 text-[13px] text-zinc-500 px-4">
          {error || "Not found"}
        </div>
      </Surface>
    )
  }

  const t = data.ticket
  const messages = data.messages.filter(
    (m) => m.draft_status !== "pending" || m.direction !== "outbound",
  )

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="text-[12px] text-zinc-400 hover:text-zinc-100 inline-flex items-center gap-1.5"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to support queue
      </button>

      <Surface>
        <div className="px-4 py-3 border-b border-zinc-900/80 flex items-start gap-3">
          <PriorityChip priority={t.priority} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-semibold text-white">{t.subject}</p>
              <CategoryBadge category={t.category} />
              <StatusBadge status={t.status} />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              From <strong className="text-zinc-300">{t.gym_name}</strong>
              {t.author_email && (
                <>
                  {" · "}
                  <a
                    href={`mailto:${t.author_email}`}
                    className="text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-0.5"
                  >
                    {t.author_email}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </>
              )}
              {" · "}
              {new Date(t.created_at).toLocaleString()}
            </p>
            {t.source_url && (
              <p className="text-[10px] text-zinc-600 mt-0.5 truncate">
                from{" "}
                <a
                  href={t.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 underline"
                >
                  {t.source_url}
                </a>
              </p>
            )}
          </div>
          <div className="shrink-0 flex flex-col gap-1.5">
            {t.status !== "resolved" && t.status !== "closed" && (
              <SaasButton size="sm" variant="ghost" onClick={() => updateStatus("resolved")}>
                <CheckCircle2 className="h-3 w-3" />
                Mark resolved
              </SaasButton>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Initial inbound message */}
          {messages.map((m) => (
            <MessageBubble key={m.id} m={m} />
          ))}
        </div>
      </Surface>

      {/* AI draft + reply composer */}
      {t.status !== "resolved" && t.status !== "closed" && (
        <Surface>
          <div className="px-4 py-3 border-b border-zinc-900/80 flex items-center gap-2">
            {aiDraft ? (
              <>
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                <p className="text-[12px] font-medium text-zinc-100">
                  AI draft ready — review + send
                </p>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5 text-zinc-400" />
                <p className="text-[12px] font-medium text-zinc-100">Reply</p>
              </>
            )}
          </div>
          <div className="p-4 space-y-3">
            <SaasTextarea
              rows={6}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Your reply..."
              disabled={sending}
            />
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <SaasButton
                size="sm"
                variant="subtle"
                onClick={() => sendReply("waiting_customer")}
                disabled={!replyBody.trim() || sending}
                loading={sending}
              >
                Send + waiting on customer
              </SaasButton>
              <SaasButton
                size="sm"
                variant="subtle"
                onClick={() => sendReply("in_progress")}
                disabled={!replyBody.trim() || sending}
                loading={sending}
              >
                <Send className="h-3 w-3" />
                Send
              </SaasButton>
              <SaasButton
                size="sm"
                onClick={() => sendReply("resolved")}
                disabled={!replyBody.trim() || sending}
                loading={sending}
              >
                <CheckCircle2 className="h-3 w-3" />
                Send + resolve
              </SaasButton>
            </div>
            {!aiDraft && (
              <p className="text-[10px] text-zinc-600">
                No AI draft — write your reply from scratch above.
              </p>
            )}
          </div>
        </Surface>
      )}

      {(t.status === "resolved" || t.status === "closed") && (
        <Surface>
          <div className="p-4 flex items-center justify-between gap-3">
            <p className="text-[13px] text-emerald-300 inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolved {t.resolved_at && new Date(t.resolved_at).toLocaleString()}
            </p>
            <SaasButton size="sm" variant="ghost" onClick={() => updateStatus("in_progress")}>
              Reopen
            </SaasButton>
          </div>
        </Surface>
      )}
    </div>
  )
}

function MessageBubble({ m }: { m: Message }) {
  const isInbound = m.direction === "inbound"
  return (
    <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed whitespace-pre-wrap ${
        isInbound
          ? "bg-zinc-900/70 text-zinc-100 ring-1 ring-zinc-800"
          : "bg-indigo-500/15 text-indigo-50 ring-1 ring-indigo-500/30"
      }`}>
        {m.body}
        <p className={`mt-1.5 pt-1.5 border-t text-[10px] ${
          isInbound
            ? "border-zinc-800 text-zinc-500"
            : "border-indigo-500/20 text-indigo-300/70"
        }`}>
          {isInbound
            ? `From ${m.sender ?? "—"}`
            : m.handled_by === "ai"
              ? "AI draft"
              : "You"}
          {" · "}
          {new Date(m.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

/* ─── chips & badges ─────────────────────────────────────────────── */

function PriorityChip({ priority }: { priority: string }) {
  const tone =
    priority === "urgent"
      ? "bg-red-500/15 text-red-200 ring-red-500/30"
      : priority === "high"
        ? "bg-amber-500/15 text-amber-200 ring-amber-500/25"
        : priority === "low"
          ? "bg-zinc-800 text-zinc-500 ring-zinc-700/40"
          : "bg-indigo-500/15 text-indigo-200 ring-indigo-500/25"
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.12em] font-medium px-1.5 py-0.5 rounded ring-1 shrink-0 mt-0.5 ${tone}`}
    >
      {priority}
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 px-1.5 py-0.5 rounded ring-1 ring-zinc-800 bg-zinc-900/40">
      {category}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "open"
      ? "bg-indigo-500/15 text-indigo-200 ring-indigo-500/25"
      : status === "in_progress"
        ? "bg-amber-500/15 text-amber-200 ring-amber-500/25"
        : status === "waiting_customer"
          ? "bg-zinc-800 text-zinc-300 ring-zinc-700/60"
          : status === "resolved" || status === "closed"
            ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25"
            : "bg-zinc-800 text-zinc-300 ring-zinc-700/60"
  const label = status === "in_progress" ? "in progress" : status === "waiting_customer" ? "waiting" : status
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.12em] font-medium px-1.5 py-0.5 rounded ring-1 ${tone}`}
    >
      {label}
    </span>
  )
}

void X
