"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

const OckOckAvatar = ({ size = 32 }: { size?: number }) => (
  <Image src="/images/ockock-avatar.png" alt="OckOck" width={size} height={size} className="rounded-full" />
)

interface OckockChatTabProps {
  orgId: string
}

export default function OckockChatTab({ orgId }: OckockChatTabProps) {
  const [ockockMessages, setOckockMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [ockockInput, setOckockInput] = useState("")
  const [ockockLoading, setOckockLoading] = useState(false)

  async function handleOckockSend() {
    if (!ockockInput.trim() || ockockLoading) return

    const userMessage = ockockInput.trim()
    setOckockMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setOckockInput("")
    setOckockLoading(true)

    try {
      const res = await fetch("/api/admin/ockock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, org_id: orgId }),
      })

      const data = await res.json()
      setOckockMessages((prev) => [...prev, { role: "assistant", content: data.response || data.error }])
    } catch {
      setOckockMessages((prev) => [...prev, { role: "assistant", content: "Oops! Something went wrong. Try again!" }])
    } finally {
      setOckockLoading(false)
    }
  }

  const sendQuickMessage = (message: string) => {
    setOckockInput(message)
    setTimeout(() => {
      handleOckockSend()
    }, 100)
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <OckOckAvatar size={48} />
          <div>
            <CardTitle className="text-white">OckOck</CardTitle>
            <CardDescription>Your gym business assistant</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chat messages */}
        <div className="h-[400px] overflow-y-auto mb-4 space-y-4 p-4 bg-neutral-800 rounded-lg">
          {ockockMessages.length === 0 ? (
            <div className="text-center text-neutral-400 py-8">
              <OckOckAvatar size={64} />
              <p className="mt-4 font-medium">Hey boss! OckOck here!</p>
              <p className="text-sm mt-2">
                Ask me about today's bookings, revenue, students, or anything about the gym!
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-neutral-600 text-xs bg-transparent"
                  onClick={() => sendQuickMessage("How's business today?")}
                >
                  How's business today?
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-neutral-600 text-xs bg-transparent"
                  onClick={() => sendQuickMessage("Who paid cash this week?")}
                >
                  Cash this week?
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-neutral-600 text-xs bg-transparent"
                  onClick={() => sendQuickMessage("Any students with low credits?")}
                >
                  Low credit students?
                </Button>
              </div>
            </div>
          ) : (
            ockockMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && <OckOckAvatar size={32} />}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user" ? "bg-orange-600 text-white" : "bg-neutral-700 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {ockockLoading && (
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

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={ockockInput}
            onChange={(e) => setOckockInput(e.target.value)}
            placeholder="Ask OckOck anything about your gym..."
            className="bg-neutral-800 border-neutral-700 text-white"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleOckockSend()}
          />
          <Button
            onClick={handleOckockSend}
            disabled={ockockLoading || !ockockInput.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
