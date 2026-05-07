"use client"

/**
 * Public lead-capture form rendered on the gym's website.
 *
 * Submits to /api/public/gyms/[slug]/lead which:
 *   - Logs the inbound lead in the gym's inbox conversation log
 *   - Generates an AI draft reply for the operator to approve
 * After success, replaces itself with a success message.
 *
 * Honeypot field for spam: the hidden `_company` input must stay empty.
 * Real visitors don't fill it; bots filling every visible input do.
 */
import { useState } from "react"
import { Send } from "lucide-react"
import type { LeadFormSection } from "@/lib/website-sections"

interface Props {
  section: LeadFormSection
  gymSlug: string
}

export default function LeadFormBlock({ section, gymSlug }: Props) {
  const {
    heading,
    subtitle,
    success_message,
    require_phone = false,
    submit_label,
  } = section.props

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [honeypot, setHoneypot] = useState("") // bot trap
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)

    // Honeypot — silently swallow bot submissions
    if (honeypot.trim()) {
      setSubmitted(true)
      return
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in name, email, and message.")
      return
    }
    if (require_phone && !phone.trim()) {
      setError("Phone number is required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/gyms/${gymSlug}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          message: message.trim(),
          source_url:
            typeof window !== "undefined" ? window.location.href : undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || "Sorry, something went wrong.")
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-2xl mx-auto px-5">
        <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight">
          {heading || "Get in touch"}
        </h2>
        {subtitle && (
          <p className="text-neutral-300 text-[15px] mt-2 leading-relaxed">
            {subtitle}
          </p>
        )}

        {submitted ? (
          <div
            className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-[15px] text-emerald-200 leading-relaxed">
              {success_message ||
                "Thanks! We got your message and will be in touch soon."}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-3" noValidate>
            {/* Honeypot — hidden from real users, visible to bots */}
            <div
              className="absolute left-[-9999px] top-[-9999px]"
              aria-hidden="true"
            >
              <label>
                Company
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Name" required>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  autoComplete="name"
                  className="w-full rounded-lg bg-neutral-900/60 border border-neutral-800 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 px-3 py-2.5 text-[14px] text-white placeholder:text-neutral-600 disabled:opacity-50 transition-colors"
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  autoComplete="email"
                  className="w-full rounded-lg bg-neutral-900/60 border border-neutral-800 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 px-3 py-2.5 text-[14px] text-white placeholder:text-neutral-600 disabled:opacity-50 transition-colors"
                />
              </Field>
            </div>

            {require_phone || (
              <Field label="Phone (optional)">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                  autoComplete="tel"
                  className="w-full rounded-lg bg-neutral-900/60 border border-neutral-800 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 px-3 py-2.5 text-[14px] text-white placeholder:text-neutral-600 disabled:opacity-50 transition-colors"
                />
              </Field>
            )}
            {require_phone && (
              <Field label="Phone" required>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                  autoComplete="tel"
                  className="w-full rounded-lg bg-neutral-900/60 border border-neutral-800 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 px-3 py-2.5 text-[14px] text-white placeholder:text-neutral-600 disabled:opacity-50 transition-colors"
                />
              </Field>
            )}

            <Field label="How can we help?" required>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
                placeholder="What are you looking for? Beginner? Visiting? Long-term training?"
                className="w-full rounded-lg bg-neutral-900/60 border border-neutral-800 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 px-3 py-2.5 text-[14px] text-white placeholder:text-neutral-600 disabled:opacity-50 transition-colors resize-y"
              />
            </Field>

            {error && (
              <div
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-200"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-white text-[14px] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ backgroundColor: "var(--gym-primary)" }}
              >
                {submitting ? (
                  "Sending…"
                ) : (
                  <>
                    {submit_label || "Send message"}
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-neutral-500 mt-3">
                We typically reply within a day. Your details stay private.
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[12px] uppercase tracking-[0.14em] text-neutral-400 mb-1.5">
        {label}
        {required && <span className="text-neutral-500"> *</span>}
      </span>
      {children}
    </label>
  )
}
