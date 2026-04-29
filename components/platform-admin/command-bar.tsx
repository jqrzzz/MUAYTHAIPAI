"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
  "Pending discovered gyms in Chiang Mai?",
  "Passport for student@example.com",
  "Top trainers by signoffs this month",
  "Cert issuances by level in the last 90 days.",
]

export default function PlatformCommandBar() {
  const [history, setHistory] = useState<Turn[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
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
          { role: "assistant", content: data.error || "Request failed.", error: true },
        ])
      } else {
        setHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply || "(no reply)",
            tool_calls: data.tool_calls,
            pending_actions: (data.pending_actions || []).map(
              (a: PendingAction) => ({ ...a, status: "pending" as const })
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-orange-500" />
        <div>
          <h2 className="text-lg font-semibold text-white">Command</h2>
          <p className="text-sm text-zinc-400">
            Ask anything about the network. Read-only — write actions still happen in their tabs.
          </p>
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-0">
          <div ref={scrollRef} className="max-h-[55vh] min-h-[200px] overflow-y-auto p-4 space-y-4">
            {history.length === 0 && !loading && (
              <div className="space-y-2">
                <p className="text-sm text-zinc-500">Try:</p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="text-xs rounded-full border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
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
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    turn.role === "user"
                      ? "bg-orange-500 text-white"
                      : turn.error
                        ? "bg-red-950/50 text-red-200 border border-red-900"
                        : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {turn.error && (
                    <div className="flex items-center gap-1.5 mb-1 text-xs text-red-300">
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
                              })
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                  {turn.tool_calls && turn.tool_calls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-700 text-xs text-zinc-400 flex flex-wrap gap-1.5">
                      {turn.tool_calls.map((tc, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center gap-1 bg-zinc-900 rounded px-1.5 py-0.5"
                        >
                          <Wrench className="h-3 w-3" />
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
                <div className="bg-zinc-800 text-zinc-400 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 p-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask anything…"
                rows={1}
                className="bg-zinc-950 border-zinc-700 text-white resize-none min-h-0 py-2"
                disabled={loading}
              />
              <Button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="bg-orange-500 hover:bg-orange-600 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
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
      <div className="rounded border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 text-xs text-emerald-200">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Check className="h-3 w-3" /> {label}
        </div>
        <p>{action.result}</p>
      </div>
    )
  }
  if (status === "cancelled") {
    return (
      <div className="rounded border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <X className="h-3 w-3" /> {label} cancelled
        </div>
      </div>
    )
  }
  if (status === "error") {
    return (
      <div className="rounded border border-red-700/40 bg-red-900/20 px-3 py-2 text-xs text-red-200">
        <div className="flex items-center gap-1.5 mb-0.5">
          <AlertCircle className="h-3 w-3" /> {label} failed
        </div>
        <p>{action.result}</p>
      </div>
    )
  }

  return (
    <div className="rounded border border-amber-700/40 bg-amber-900/15 px-3 py-2 text-xs">
      <div className="flex items-start gap-1.5 mb-1.5 text-amber-200">
        <ShieldQuestion className="h-3 w-3 mt-0.5 shrink-0" />
        <p className="font-medium">{label} — needs your confirm</p>
      </div>
      {previewText && (
        <p className="text-zinc-300 mb-2 whitespace-pre-wrap">{previewText}</p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={confirm}
          disabled={status === "running"}
          className="bg-orange-500 hover:bg-orange-600 h-7 text-xs"
        >
          {status === "running" ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Check className="h-3 w-3 mr-1" />
          )}
          Confirm
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={cancel}
          disabled={status === "running"}
          className="text-zinc-400 hover:text-white h-7 text-xs"
        >
          Cancel
        </Button>
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
