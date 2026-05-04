"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Loader2, ExternalLink } from "lucide-react"

const OckOckAvatar = ({ size = 32 }: { size?: number }) => (
  <Image
    src="/images/ockock-avatar.png"
    alt="OckOck"
    width={size}
    height={size}
    className="rounded-full"
  />
)

interface OckockChatTabProps {
  orgId: string
}

interface ChatMessage {
  id?: string
  role: "user" | "assistant"
  content: string
  createdAt?: string
}

const QUICK_PROMPTS = [
  "What's on today?",
  "Anything pending to approve?",
  "Show me threads waiting for me",
  "Any students with low credits?",
] as const

// Convert plain-text URLs in OckOck's reply into clickable links so
// confirm-URL deeplinks (from propose_send_draft) become one-tap.
const URL_REGEX = /(https?:\/\/[^\s)]+)/g

function renderMessageBody(text: string) {
  const parts = text.split(URL_REGEX)
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      // Reset regex state for next test
      URL_REGEX.lastIndex = 0
      const isConfirm = part.includes("/a/")
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isConfirm
              ? "inline-flex items-center gap-1 mt-1 px-3 py-1.5 rounded-md bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold no-underline"
              : "underline underline-offset-2 hover:text-orange-300"
          }
        >
          {isConfirm ? (
            <>
              <ExternalLink className="h-3 w-3" />
              Approve & send
            </>
          ) : (
            part
          )}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function OckockChatTab({ orgId: _orgId }: OckockChatTabProps) {
  // orgId is resolved server-side from the session — we keep the prop for
  // backwards compatibility with callers but no longer trust it.
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load history on mount so the chat persists across refreshes.
  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/ockock", { method: "GET" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data?.messages)) {
          setMessages(data.messages)
        }
        setHydrated(true)
      })
      .catch(() => {
        if (!cancelled) setHydrated(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setInput("")
    setSending(true)

    try {
      const res = await fetch("/api/admin/ockock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.response ||
            data.error ||
            "Sorry, OckOck couldn't reply just now. Try again.",
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error — please try again.",
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <OckOckAvatar size={48} />
          <div>
            <CardTitle className="text-white">OckOck</CardTitle>
            <CardDescription>
              Your gym&apos;s assistant. Ask about today, drafts to approve, or
              tell OckOck to reply to a customer.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="h-[480px] overflow-y-auto mb-4 space-y-3 p-4 bg-neutral-800/60 rounded-lg"
        >
          {!hydrated ? (
            <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading chat…
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-neutral-400 py-4">
              <OckOckAvatar size={64} />
              <p className="mt-4 font-medium text-white">Hey boss!</p>
              <p className="text-sm mt-2 max-w-sm mx-auto">
                Ask OckOck what&apos;s going on, who&apos;s waiting for a reply,
                or to draft a message — OckOck handles the operator
                busywork so you can focus on training.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {QUICK_PROMPTS.map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    size="sm"
                    className="border-neutral-600 text-xs bg-transparent text-neutral-300 hover:text-white"
                    onClick={() => send(p)}
                    disabled={sending}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id ?? i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && <OckOckAvatar size={32} />}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-orange-600 text-white"
                      : "bg-neutral-700 text-neutral-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {renderMessageBody(msg.content)}
                  </p>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-3">
              <OckOckAvatar size={32} />
              <div className="bg-neutral-700 p-3 rounded-lg">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask OckOck anything about your gym…"
            className="bg-neutral-800 border-neutral-700 text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            disabled={sending}
          />
          <Button
            onClick={() => send(input)}
            disabled={sending || !input.trim()}
            className="bg-orange-600 hover:bg-orange-500"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
