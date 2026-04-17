"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

const QUICK_STARTS = [
  "How much for a private session?",
  "What time are morning classes?",
  "How do I get to Pai?",
]

function getSessionId(): string {
  const key = "ockock_session_id"
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

interface OckOckChatWidgetProps {
  orgSlug: string
}

const HIDDEN_PREFIXES = ["/admin", "/login", "/signup", "/ockock", "/a/"]

export default function OckOckChatWidget({ orgSlug }: OckOckChatWidgetProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      setMessages((prev) => [...prev, { role: "user", content: trimmed }])
      setInput("")
      setLoading(true)

      try {
        const res = await fetch("/api/public/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgSlug,
            sessionId: getSessionId(),
            message: trimmed,
          }),
        })
        const data = await res.json()
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply || data.error || "Sorry, something went wrong.",
          },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Connection error — please try again." },
        ])
      } finally {
        setLoading(false)
      }
    },
    [orgSlug, loading],
  )

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-orange-600 shadow-lg shadow-orange-600/30 flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Chat with OckOck"
        >
          <Image
            src="/images/ockock-avatar.png"
            alt="OckOck"
            width={36}
            height={36}
            className="rounded-full"
          />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] h-[100dvh] sm:h-[520px] flex flex-col bg-neutral-900 sm:rounded-2xl border border-neutral-800 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800 shrink-0">
            <Image
              src="/images/ockock-avatar.png"
              alt="OckOck"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">OckOck</div>
              <div className="text-[11px] text-neutral-400">
                Muay Thai Pai assistant
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-neutral-400 hover:text-white p-1"
              aria-label="Close chat"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-950/40"
          >
            {messages.length === 0 && (
              <div className="text-center pt-8 space-y-4">
                <Image
                  src="/images/ockock-avatar.png"
                  alt="OckOck"
                  width={56}
                  height={56}
                  className="rounded-full mx-auto"
                />
                <div>
                  <p className="text-white font-medium text-sm">
                    Sawadee! I&apos;m OckOck
                  </p>
                  <p className="text-neutral-400 text-xs mt-1">
                    Ask me anything about training at Muay Thai Pai
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_STARTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q)
                        send(q)
                      }}
                      className="text-xs px-3 py-1.5 rounded-full border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-orange-600 text-white rounded-br-md"
                      : "bg-neutral-800 text-neutral-100 rounded-bl-md"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-neutral-800 p-3 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-full px-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center text-white disabled:opacity-40 hover:bg-orange-700 transition-colors shrink-0"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
