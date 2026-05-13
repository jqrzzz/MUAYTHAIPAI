"use client"

/**
 * OckOckGuideBubble — the floating "Ask OckOck" chat on the OckOck product
 * site. Talks to /api/landing/chat (the product-guide AI), bilingual.
 * Mounted in app/(ockock)/layout.tsx. Hidden on /for-gyms, where the hero
 * already has an inline OckOck chat (two on one page would be confusing).
 *
 * Self-contained on purpose — small enough that sharing state with the hero
 * chat wouldn't pay for the indirection.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Send, X } from "lucide-react"
import { SocialSignupButtons } from "./social-signup-buttons"

const AVATAR = "/images/ockock-avatar.png"
const GREETING =
  "Sawadee! I'm OckOck 🐃 — ask me anything about the software, the pricing, or getting your gym set up. (เขียนภาษาไทยก็ได้นะ.)"
const HIDE_ON_PREFIXES = ["/for-gyms"]

type Msg = { role: "user" | "assistant"; content: string }

export function OckOckGuideBubble() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return
      const base: Msg[] = messages.length ? messages : [{ role: "assistant", content: GREETING }]
      const next: Msg[] = [...base, { role: "user", content: trimmed }]
      setMessages(next)
      setInput("")
      setLoading(true)
      try {
        const res = await fetch("/api/landing/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        })
        const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string }
        const reply =
          (typeof data.reply === "string" && data.reply.trim()) ||
          (typeof data.error === "string" && data.error.trim()) ||
          "Hmm — something went wrong on my end 🐃. Try again?"
        setMessages((m) => [...m, { role: "assistant", content: reply }])
      } catch {
        setMessages((m) => [...m, { role: "assistant", content: "I couldn't reach my brain just now 🐃 — give it a sec." }])
      } finally {
        setLoading(false)
      }
    },
    [loading, messages],
  )

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages, loading, open])

  useEffect(() => {
    if (open) {
      if (messages.length === 0) setMessages([{ role: "assistant", content: GREETING }])
      inputRef.current?.focus()
    }
  }, [open, messages.length])

  if (HIDE_ON_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ask OckOck"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-indigo-500 py-2.5 pl-2.5 pr-4 text-[13px] font-medium text-white shadow-[0_8px_30px_-6px_rgba(99,102,241,0.55)] transition-transform hover:scale-[1.04]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AVATAR} alt="" className="h-7 w-7 rounded-full bg-white/10 object-contain p-0.5" />
          Ask OckOck
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(560px,calc(100vh-2.5rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl bg-zinc-950 text-zinc-100 shadow-2xl ring-1 ring-zinc-800">
          <header className="flex items-center gap-2 border-b border-zinc-900 bg-zinc-900/50 px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={AVATAR} alt="" className="h-7 w-7 rounded-full bg-zinc-800 object-contain p-0.5" />
            <div className="flex-1 leading-tight">
              <p className="text-[13px] font-semibold">OckOck</p>
              <p className="text-[11px] text-zinc-500">Ask about the software · Thai or English</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex items-start gap-2"}>
                {m.role === "assistant" && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={AVATAR} alt="" className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-zinc-800 object-contain p-0.5" />
                )}
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-indigo-500 px-3 py-2 text-[13px] leading-relaxed text-white"
                      : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-zinc-800/80 px-3 py-2 text-[13px] leading-relaxed text-zinc-100"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={AVATAR} alt="" className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-zinc-800 object-contain p-0.5" />
                <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-zinc-800/80 px-3 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-900 p-2.5">
            <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Talk to OckOck…"
                aria-label="Message OckOck"
                className="flex-1 rounded-xl bg-zinc-900 px-3 py-2 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition-colors hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <SocialSignupButtons compact label="Or start signup with" className="mt-3" />
            <p className="mt-2 text-center text-[11px] text-zinc-600">
              Or{" "}
              <Link href="/signup" className="text-indigo-400 hover:text-indigo-300">
                use email →
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
