"use client"

/**
 * Inbox tab for the admin console.
 *
 * Layout:
 *   - Desktop: left pane = conversation list, right pane = thread view
 *   - Mobile:  single pane; tapping a conversation swaps to the thread
 *
 * Draft lifecycle:
 *   - Pending AI drafts render with Approve / Reject buttons inline
 *   - Approved drafts show as normal outbound messages
 *   - Rejected drafts are muted / strike-through (still visible for audit)
 *
 * Human replies:
 *   - Composer at the bottom of the thread lets owner/admin send a reply
 *     without the AI in the loop. Trainers don't get the composer
 *     (the API also blocks their attempts).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Inbox,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react"

type Channel = "line" | "telegram" | "whatsapp" | "ig" | "fb" | "web" | "test"

type ConversationSummary = {
  id: string
  channel: Channel
  externalThreadId: string
  status: "open" | "awaiting_human" | "closed"
  lastMessageAt: string | null
  lastMessagePreview: string | null
  assignedTo: string | null
  group: { id: string; name: string; purpose: string }
  pendingDraftCount: number
  needsReviewCount: number
}

type MessageRow = {
  id: string
  channel: Channel
  direction: "inbound" | "outbound"
  sender: string | null
  recipient: string | null
  body: string
  metadata: Record<string, unknown> | null
  handled_by: "ai" | "human" | null
  needs_review: boolean
  draft_status: "pending" | "approved" | "rejected" | null
  external_message_id: string | null
  created_at: string
}

type Participant = {
  channel_user_id: string
  display_name: string | null
  role: string
  user_id: string | null
}

type ThreadResponse = {
  conversation: {
    id: string
    channel: Channel
    externalThreadId: string
    status: "open" | "awaiting_human" | "closed"
    assignedTo: string | null
    language: string | null
    lastMessageAt: string | null
    lastMessagePreview: string | null
    group: { id: string; name: string; purpose: string }
  }
  participants: Participant[]
  messages: MessageRow[]
}

const STATUS_FILTERS: Array<{
  key: "all" | "open" | "awaiting_human" | "closed"
  label: string
}> = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "awaiting_human", label: "Awaiting" },
  { key: "closed", label: "Closed" },
]

const CHANNEL_LABEL: Record<Channel, string> = {
  line: "LINE",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  ig: "Instagram",
  fb: "Facebook",
  web: "Web",
  test: "Test",
}

const CHANNEL_COLOR: Record<Channel, string> = {
  line: "bg-green-600/20 text-green-300 border-green-700",
  telegram: "bg-sky-600/20 text-sky-300 border-sky-700",
  whatsapp: "bg-emerald-600/20 text-emerald-300 border-emerald-700",
  ig: "bg-pink-600/20 text-pink-300 border-pink-700",
  fb: "bg-blue-600/20 text-blue-300 border-blue-700",
  web: "bg-neutral-600/20 text-neutral-200 border-neutral-700",
  test: "bg-neutral-700/40 text-neutral-300 border-neutral-600",
}

interface InboxTabProps {
  /** Current user's role in this org — gates the reply composer. */
  role?: string
}

export default function InboxTab({ role }: InboxTabProps) {
  const canReply = role === "owner" || role === "admin"

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "awaiting_human" | "closed">("all")

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [thread, setThread] = useState<ThreadResponse | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)
  const [threadError, setThreadError] = useState<string | null>(null)

  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [draftActionId, setDraftActionId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const threadScrollRef = useRef<HTMLDivElement | null>(null)

  const loadList = useCallback(async () => {
    setLoadingList(true)
    setListError(null)
    try {
      const qs = statusFilter === "all" ? "" : `?status=${statusFilter}`
      const res = await fetch(`/api/admin/inbox/conversations${qs}`, {
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load")
      setConversations(data.conversations as ConversationSummary[])
    } catch (err) {
      setListError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoadingList(false)
    }
  }, [statusFilter])

  const loadThread = useCallback(async (id: string) => {
    setLoadingThread(true)
    setThreadError(null)
    try {
      const res = await fetch(`/api/admin/inbox/conversations/${id}`, {
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load thread")
      setThread(data as ThreadResponse)
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : String(err))
      setThread(null)
    } finally {
      setLoadingThread(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    if (selectedId) loadThread(selectedId)
    else setThread(null)
  }, [selectedId, loadThread])

  // Auto-scroll to bottom when a thread (re)loads.
  useEffect(() => {
    if (thread && threadScrollRef.current) {
      threadScrollRef.current.scrollTop = threadScrollRef.current.scrollHeight
    }
  }, [thread])

  function flash(type: "ok" | "err", text: string) {
    setFeedback({ type, text })
    setTimeout(() => setFeedback(null), 3500)
  }

  async function handleApproveDraft(draftId: string) {
    setDraftActionId(draftId)
    try {
      const res = await fetch(`/api/admin/inbox/drafts/${draftId}/approve`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Approve failed")
      }
      flash("ok", "Draft sent")
      if (selectedId) await loadThread(selectedId)
      await loadList()
    } catch (err) {
      flash("err", err instanceof Error ? err.message : String(err))
    } finally {
      setDraftActionId(null)
    }
  }

  async function handleRejectDraft(draftId: string) {
    setDraftActionId(draftId)
    try {
      const res = await fetch(`/api/admin/inbox/drafts/${draftId}/reject`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Reject failed")
      }
      flash("ok", "Draft rejected")
      if (selectedId) await loadThread(selectedId)
      await loadList()
    } catch (err) {
      flash("err", err instanceof Error ? err.message : String(err))
    } finally {
      setDraftActionId(null)
    }
  }

  async function handleSendReply() {
    if (!selectedId || !replyText.trim() || sendingReply) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/admin/inbox/conversations/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Send failed")
      }
      setReplyText("")
      flash("ok", "Reply sent")
      await loadThread(selectedId)
      await loadList()
    } catch (err) {
      flash("err", err instanceof Error ? err.message : String(err))
    } finally {
      setSendingReply(false)
    }
  }

  async function handleStatusChange(next: "open" | "closed") {
    if (!selectedId) return
    try {
      const res = await fetch(`/api/admin/inbox/conversations/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Status update failed")
      flash("ok", `Conversation ${next}`)
      await loadThread(selectedId)
      await loadList()
    } catch (err) {
      flash("err", err instanceof Error ? err.message : String(err))
    }
  }

  const participantName = useMemo(() => {
    if (!thread) return null
    const firstBound = thread.participants.find((p) => p.user_id === null) ||
      thread.participants[0]
    return firstBound?.display_name || firstBound?.channel_user_id || null
  }, [thread])

  return (
    <div className="space-y-3">
      {/* Header + filters */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Inbox className="w-6 h-6 text-orange-500" />
              <div>
                <CardTitle className="text-white">Inbox</CardTitle>
                <p className="text-xs text-neutral-400">
                  Messages from students and visitors across all channels
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      statusFilter === f.key
                        ? "bg-orange-600 text-white"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={loadList}
                disabled={loadingList}
                className="text-neutral-400 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {feedback && (
        <div
          className={`px-4 py-2 rounded border text-sm ${
            feedback.type === "ok"
              ? "bg-green-900/30 border-green-700 text-green-200"
              : "bg-red-900/30 border-red-700 text-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[340px,1fr] gap-3">
        {/* Conversation list */}
        <Card
          className={`bg-neutral-900 border-neutral-800 ${
            selectedId ? "hidden md:block" : ""
          }`}
        >
          <CardContent className="p-2 max-h-[75vh] overflow-y-auto">
            {loadingList && !conversations.length ? (
              <div className="p-6 text-center text-neutral-400 text-sm">Loading…</div>
            ) : listError ? (
              <div className="p-6 text-center text-red-300 text-sm">{listError}</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-neutral-400 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                No conversations yet
              </div>
            ) : (
              <ul className="space-y-1">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedId === c.id
                          ? "bg-neutral-800"
                          : "hover:bg-neutral-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 px-1.5 h-4 ${CHANNEL_COLOR[c.channel]}`}
                        >
                          {CHANNEL_LABEL[c.channel]}
                        </Badge>
                        {c.status === "awaiting_human" && (
                          <Badge className="text-[10px] py-0 px-1.5 h-4 bg-amber-600/20 text-amber-300 border-amber-700 border">
                            Needs you
                          </Badge>
                        )}
                        {c.status === "closed" && (
                          <Badge className="text-[10px] py-0 px-1.5 h-4 bg-neutral-700/40 text-neutral-400 border-neutral-600 border">
                            Closed
                          </Badge>
                        )}
                        {c.pendingDraftCount > 0 && (
                          <Badge className="text-[10px] py-0 px-1.5 h-4 bg-purple-600/20 text-purple-300 border-purple-700 border">
                            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                            {c.pendingDraftCount}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-white truncate">
                        {c.group.name}
                      </div>
                      <div className="text-xs text-neutral-400 truncate">
                        {c.lastMessagePreview || "No messages yet"}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-1">
                        {c.lastMessageAt
                          ? new Date(c.lastMessageAt).toLocaleString()
                          : "—"}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Thread view */}
        <Card
          className={`bg-neutral-900 border-neutral-800 ${
            selectedId ? "" : "hidden md:block"
          }`}
        >
          {!selectedId ? (
            <CardContent className="p-10 text-center text-neutral-400 text-sm h-full flex items-center justify-center">
              <div>
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
                Select a conversation
              </div>
            </CardContent>
          ) : loadingThread && !thread ? (
            <CardContent className="p-10 text-center text-neutral-400 text-sm">
              Loading…
            </CardContent>
          ) : threadError ? (
            <CardContent className="p-10 text-center text-red-300 text-sm">
              {threadError}
            </CardContent>
          ) : thread ? (
            <>
              {/* Thread header */}
              <div className="p-3 border-b border-neutral-800 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="md:hidden text-neutral-300"
                  onClick={() => setSelectedId(null)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 px-1.5 h-4 ${CHANNEL_COLOR[thread.conversation.channel]}`}
                >
                  {CHANNEL_LABEL[thread.conversation.channel]}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {participantName || thread.conversation.externalThreadId}
                  </div>
                  <div className="text-xs text-neutral-400 truncate">
                    {thread.conversation.group.name} · {thread.conversation.group.purpose}
                  </div>
                </div>
                {canReply && thread.conversation.status !== "closed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                    onClick={() => handleStatusChange("closed")}
                  >
                    Close
                  </Button>
                )}
                {canReply && thread.conversation.status === "closed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                    onClick={() => handleStatusChange("open")}
                  >
                    Reopen
                  </Button>
                )}
              </div>

              {/* Messages */}
              <div
                ref={threadScrollRef}
                className="max-h-[55vh] overflow-y-auto p-3 space-y-3 bg-neutral-950/40"
              >
                {thread.messages.length === 0 ? (
                  <div className="text-center text-neutral-500 text-sm py-8">
                    No messages
                  </div>
                ) : (
                  thread.messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      msg={m}
                      canAct={canReply}
                      busy={draftActionId === m.id}
                      onApprove={() => handleApproveDraft(m.id)}
                      onReject={() => handleRejectDraft(m.id)}
                    />
                  ))
                )}
              </div>

              {/* Composer */}
              {canReply ? (
                <div className="border-t border-neutral-800 p-3">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a reply…"
                      className="bg-neutral-800 border-neutral-700 text-white min-h-[44px] max-h-32 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault()
                          handleSendReply()
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="bg-orange-600 hover:bg-orange-700 h-[44px]"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">
                    ⌘/Ctrl+Enter to send
                  </div>
                </div>
              ) : (
                <div className="border-t border-neutral-800 p-3 text-xs text-neutral-500 text-center">
                  Trainers can read but not send replies.
                </div>
              )}
            </>
          ) : null}
        </Card>
      </div>
    </div>
  )
}

function MessageBubble({
  msg,
  canAct,
  busy,
  onApprove,
  onReject,
}: {
  msg: MessageRow
  canAct: boolean
  busy: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const isInbound = msg.direction === "inbound"
  const isPendingDraft = msg.draft_status === "pending"
  const isRejectedDraft = msg.draft_status === "rejected"
  const isAI = msg.handled_by === "ai"

  // Outbound messages align right; inbound left.
  const align = isInbound ? "items-start" : "items-end"
  const bubbleBg = isInbound
    ? "bg-neutral-800 text-white"
    : isPendingDraft
      ? "bg-purple-900/40 border border-purple-700 text-purple-50"
      : isRejectedDraft
        ? "bg-neutral-800/50 text-neutral-500 line-through"
        : isAI
          ? "bg-orange-900/50 text-orange-50"
          : "bg-orange-600 text-white"

  return (
    <div className={`flex flex-col gap-1 ${align}`}>
      <div className={`max-w-[85%] rounded-lg px-3 py-2 ${bubbleBg}`}>
        <div className="flex items-center gap-2 mb-1 text-[10px] uppercase tracking-wider opacity-70">
          {isInbound ? (
            <span>Inbound</span>
          ) : isPendingDraft ? (
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> AI Draft · Pending
            </span>
          ) : isRejectedDraft ? (
            <span>Draft · Rejected</span>
          ) : isAI ? (
            <span className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          ) : (
            <span>Sent</span>
          )}
          <span className="opacity-60">{formatTime(msg.created_at)}</span>
          {msg.needs_review && !isPendingDraft && (
            <span className="text-amber-300">· review</span>
          )}
        </div>
        <div className="whitespace-pre-wrap text-sm">{msg.body}</div>
      </div>

      {isPendingDraft && canAct && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onApprove}
            disabled={busy}
            className="bg-green-600 hover:bg-green-700 h-7 text-xs"
          >
            <CheckCheck className="w-3 h-3 mr-1" />
            Approve & send
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            disabled={busy}
            className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 h-7 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Reject
          </Button>
        </div>
      )}
      {!isInbound && msg.draft_status === "approved" && msg.external_message_id && (
        <div className="text-[10px] text-neutral-500 flex items-center gap-1">
          <Check className="w-3 h-3" /> Delivered
        </div>
      )}
    </div>
  )
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}
