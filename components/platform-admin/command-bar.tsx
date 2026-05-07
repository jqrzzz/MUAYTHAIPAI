"use client"

import { useState, useRef, useEffect } from "react"
import {
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  Wrench,
  Check,
  X,
  ShieldQuestion,
} from "lucide-react"

interface PendingAction {
  action: string
  action_token: string
  preview: Record<string, unknown>
  status?: "pending" | "running" | "done" | "cancelled" | "error"
  result?: string
}

type Turn = {
  role: "user" | "assistant"
  content: string
  tool_calls?: Array<{ name: string; input: unknown }>
  pending_actions?: PendingAction[]
  error?: boolean
}

const STARTER_PROMPTS = [
  "How is the network doing this month?",
  "Find muay thai gyms in Phuket and add them.",
  "How are my outreach campaigns doing?",
  "Top trainers by signoffs this month",
  "Pending discovered gyms in Chiang Mai?",
]

export default function PlatformCommandBar() {
  const [history, setHistory] = useState<Turn[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [history, loading])

  const send = async (text: string) => {
    const query = text.trim()
    if (!query || loading) return
    setInput("")
    const newUserTurn: Turn = { role: "user", content: query }
    setHistory((prev) => [...prev, newUserTurn])
    setLoading(true)

    try {
      const res = await fetch("/api/platform-admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          history: history.map((t) => ({ role: t.role, content: t.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error || "Request failed.",
            error: true,
          },
        ])
      } else {
        setHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply || "(no reply)",
            tool_calls: data.tool_calls,
            pending_actions: (data.pending_actions || []).map(
              (a: PendingAction) => ({ ...a, status: "pending" as const }),
            ),
          },
        ])
      }
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Network error",
          error: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-indigo-400" />
          Ask
        </p>
        <h2 className="text-[18px] font-semibold tracking-tight text-white mt-0.5">
          Talk to your network
        </h2>
        <p className="text-[12px] text-zinc-500 mt-0.5">
          Read-only by default. Write actions ask for confirmation.
        </p>
      </div>

      <div className="rounded-xl ring-1 ring-zinc-900 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
        <div
          ref={scrollRef}
          className="max-h-[55vh] min-h-[180px] overflow-y-auto p-4 space-y-3"
        >
          {history.length === 0 && !loading && (
            <div className="space-y-3 py-1">
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Try
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-[12px] rounded-full border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((turn, i) => (
            <div
              key={i}
              className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                  turn.role === "user"
                    ? "bg-indigo-500 text-white"
                    : turn.error
                      ? "bg-red-500/10 text-red-200 ring-1 ring-red-500/20"
                      : "bg-zinc-800/80 text-zinc-100 ring-1 ring-zinc-800"
                }`}
              >
                {turn.error && (
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-red-300/90">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </div>
                )}
                {turn.content}
                {turn.pending_actions && turn.pending_actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {turn.pending_actions.map((pa, j) => (
                      <PendingActionChip
                        key={j}
                        action={pa}
                        onUpdate={(next) =>
                          setHistory((prev) =>
                            prev.map((t, ti) => {
                              if (ti !== i) return t
                              const arr = [...(t.pending_actions || [])]
                              arr[j] = next
                              return { ...t, pending_actions: arr }
                            }),
                          )
                        }
                      />
                    ))}
                  </div>
                )}
                {turn.tool_calls && turn.tool_calls.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-700/60 text-[11px] text-zinc-500 flex flex-wrap gap-1.5">
                    {turn.tool_calls.map((tc, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 bg-zinc-900/60 ring-1 ring-zinc-800 rounded-md px-1.5 py-0.5"
                      >
                        <Wrench className="h-2.5 w-2.5" />
                        {tc.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800/80 ring-1 ring-zinc-800 text-zinc-400 rounded-2xl px-3.5 py-2.5 text-[13px] flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-900/80 p-2.5 bg-zinc-950/40">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask anything…"
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-600 resize-none outline-none text-[13px] py-2 px-2 focus:ring-0 disabled:opacity-50"
              style={{ minHeight: 36 }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-colors shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function PendingActionChip({
  action,
  onUpdate,
}: {
  action: PendingAction
  onUpdate: (next: PendingAction) => void
}) {
  const status = action.status || "pending"
  const label = humanizeAction(action.action)
  const previewText = renderPreview(action.action, action.preview)

  const confirm = async () => {
    onUpdate({ ...action, status: "running" })
    try {
      const res = await fetch("/api/platform-admin/ai/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_token: action.action_token }),
      })
      const data = await res.json()
      if (!res.ok || data.ok === false) {
        onUpdate({
          ...action,
          status: "error",
          result: data.message || data.error || "Failed",
        })
      } else {
        onUpdate({ ...action, status: "done", result: data.message || "Done." })
      }
    } catch (err) {
      onUpdate({
        ...action,
        status: "error",
        result: err instanceof Error ? err.message : "Failed",
      })
    }
  }

  const cancel = () => onUpdate({ ...action, status: "cancelled" })

  if (status === "done") {
    return (
      <div className="rounded-lg ring-1 ring-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-200">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Check className="h-3 w-3" />
          <span className="font-medium">{label}</span>
        </div>
        <p className="text-emerald-200/80">{action.result}</p>
      </div>
    )
  }
  if (status === "cancelled") {
    return (
      <div className="rounded-lg ring-1 ring-zinc-800 bg-zinc-900/40 px-3 py-2 text-[12px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <X className="h-3 w-3" /> {label} cancelled
        </div>
      </div>
    )
  }
  if (status === "error") {
    return (
      <div className="rounded-lg ring-1 ring-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
        <div className="flex items-center gap-1.5 mb-0.5">
          <AlertCircle className="h-3 w-3" /> {label} failed
        </div>
        <p className="text-red-200/80">{action.result}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg ring-1 ring-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-[12px]">
      <div className="flex items-start gap-1.5 mb-1.5 text-amber-200">
        <ShieldQuestion className="h-3 w-3 mt-0.5 shrink-0" />
        <p className="font-medium">{label} — needs your confirm</p>
      </div>
      {previewText && (
        <p className="text-zinc-300/90 mb-2 whitespace-pre-wrap leading-relaxed">
          {previewText}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={confirm}
          disabled={status === "running"}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-medium disabled:opacity-60"
        >
          {status === "running" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          Confirm
        </button>
        <button
          onClick={cancel}
          disabled={status === "running"}
          className="px-2.5 py-1 rounded-md text-zinc-400 hover:text-zinc-200 text-[11px]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function humanizeAction(name: string): string {
  switch (name) {
    case "invite_gym":
      return "Send invite"
    case "update_gym_status":
      return "Update status"
    default:
      return name
  }
}

function renderPreview(name: string, preview: Record<string, unknown>): string {
  if (name === "invite_gym") {
    const parts = [
      `Gym: ${preview.gym_name || "?"}`,
      `Email: ${preview.email || "(none on file — link only)"}`,
      preview.will_email
        ? "Will email the invite via Resend"
        : "Won't send email — link only",
      preview.re_invite ? "(Re-issuing — already invited once)" : "",
    ].filter(Boolean)
    return parts.join("\n")
  }
  if (name === "update_gym_status") {
    return `${preview.gym_name}: ${preview.from_status} → ${preview.to_status}${
      preview.notes ? `\nNotes: ${preview.notes}` : ""
    }`
  }
  try {
    return JSON.stringify(preview, null, 2)
  } catch {
    return ""
  }
}
