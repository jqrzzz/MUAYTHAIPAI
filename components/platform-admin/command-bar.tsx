"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Send, Loader2, AlertCircle, Wrench } from "lucide-react"

type Turn = {
  role: "user" | "assistant"
  content: string
  tool_calls?: Array<{ name: string; input: unknown }>
  error?: boolean
}

const STARTER_PROMPTS = [
  "How is the network doing this month?",
  "Find muay thai gyms in Phuket and add them.",
  "Pending discovered gyms in Chiang Mai?",
  "Passport for student@example.com",
  "Students 1 skill from Phayra Nak?",
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
