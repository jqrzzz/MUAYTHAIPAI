"use client"

/**
 * Floating "Get help" button for /admin pages.
 *
 * Bottom-right corner, unobtrusive. Click → dialog with subject + body.
 * Submit creates a support_tickets row + an AI-drafted reply that the
 * platform operator approves in /platform-admin → Support.
 *
 * Acknowledgement on submit: "Got it, we'll be back in touch within
 * {SLA hours from priority}."
 */
import { useState } from "react"
import { CheckCircle2, HelpCircle, Loader2, X } from "lucide-react"
import { SaasButton, SaasInput, SaasTextarea } from "@/components/saas"

const SLA_LABEL: Record<string, string> = {
  urgent: "1 hour",
  high: "6 hours",
  normal: "24 hours",
  low: "3 days",
}

export default function HelpButton() {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    priority: string
    category: string
  } | null>(null)

  const reset = () => {
    setSubject("")
    setBody("")
    setError(null)
    setSuccess(null)
  }

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
      setSuccess({
        priority: data.ticket?.priority ?? "normal",
        category: data.ticket?.category ?? "other",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating button */}
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
          onClick={() => {
            if (!submitting) {
              setOpen(false)
              if (success) reset()
            }
          }}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl ring-1 ring-zinc-800 bg-zinc-950 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-indigo-300" />
                <p className="text-[14px] font-semibold text-white">Get help</p>
              </div>
              <button
                onClick={() => {
                  if (!submitting) {
                    setOpen(false)
                    if (success) reset()
                  }
                }}
                className="text-zinc-500 hover:text-zinc-200 -mr-1 p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {success ? (
              <div className="p-6 text-center space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-white">
                    Got it — we&apos;re on it
                  </p>
                  <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">
                    Routed as <strong className="text-zinc-300">{success.category}</strong>
                    {" · "}
                    <strong className="text-zinc-300">{success.priority}</strong>{" "}
                    priority. We&apos;ll be back in touch within{" "}
                    <strong className="text-zinc-300">
                      {SLA_LABEL[success.priority] ?? "24 hours"}
                    </strong>
                    .
                  </p>
                </div>
                <SaasButton
                  onClick={() => {
                    setOpen(false)
                    reset()
                  }}
                  size="sm"
                  variant="subtle"
                >
                  Done
                </SaasButton>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <p className="text-[12px] text-zinc-500 leading-relaxed">
                  Tell us what&apos;s up. We auto-route by urgency — bookings
                  broken or payments failing get our fastest attention.
                </p>
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                    Subject
                  </p>
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
                <div className="flex justify-end gap-2 pt-1">
                  <SaasButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!submitting) {
                        setOpen(false)
                        reset()
                      }
                    }}
                  >
                    Cancel
                  </SaasButton>
                  <SaasButton
                    onClick={submit}
                    loading={submitting}
                    disabled={!subject.trim() || !body.trim() || submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Sending
                      </>
                    ) : (
                      "Send"
                    )}
                  </SaasButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
