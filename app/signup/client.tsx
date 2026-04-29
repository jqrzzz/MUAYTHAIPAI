"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Loader2,
  CheckCircle2,
  Building2,
  Mail,
  User,
  MapPin,
  ArrowRight,
  Sparkles,
} from "lucide-react"

interface SignupForm {
  gymName: string
  ownerName: string
  ownerEmail: string
  city: string
  province: string
  country: string
}

interface InvitePreview {
  id: string
  gymName: string
  nameTh?: string | null
  city?: string | null
  province?: string | null
  country?: string | null
  website?: string | null
  suggestedEmail?: string | null
}

export default function SignupClient() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("invite")

  const [form, setForm] = useState<SignupForm>({
    gymName: "",
    ownerName: "",
    ownerEmail: "",
    city: "",
    province: "",
    country: "Thailand",
  })
  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Pre-fill from invite token if present
  useEffect(() => {
    if (!inviteToken) return
    let cancelled = false
    fetch(`/api/discovery/invite-preview?token=${encodeURIComponent(inviteToken)}`)
      .then(async (res) => {
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setInviteError(data.error || "Invite invalid")
          return
        }
        const i: InvitePreview = data.invite
        setInvite(i)
        setForm((prev) => ({
          ...prev,
          gymName: prev.gymName || i.gymName || "",
          ownerEmail: prev.ownerEmail || i.suggestedEmail || "",
          city: prev.city || i.city || "",
          province: prev.province || i.province || "",
          country: prev.country || i.country || "Thailand",
        }))
      })
      .catch((err) => {
        if (!cancelled) setInviteError(err instanceof Error ? err.message : "Invite lookup failed")
      })
    return () => {
      cancelled = true
    }
  }, [inviteToken])

  const update = (field: keyof SignupForm, value: string) =>
    setForm({ ...form, [field]: value })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, inviteToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create gym")
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">Check Your Email</h1>
          <p className="mb-6 text-neutral-400">
            We sent a login link to <span className="text-white">{form.ownerEmail}</span>.
            Click it to access your gym dashboard and start setting up.
          </p>
          <p className="text-sm text-neutral-500">
            Your 30-day free trial starts now. No credit card required.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Get Your Gym Online
          </h1>
          <p className="text-neutral-400">
            Start managing bookings, trainers, and students in minutes
          </p>
        </div>

        {invite && (
          <div className="mb-4 rounded-xl border border-orange-500/40 bg-orange-500/10 p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-200">
                  You&apos;re claiming <span className="text-white">{invite.gymName}</span>
                </p>
                <p className="text-orange-200/80 text-xs mt-0.5">
                  We pre-filled what we know — adjust anything that&apos;s wrong.
                </p>
              </div>
            </div>
          </div>
        )}
        {inviteError && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            Invite link issue: {inviteError}. You can still sign up below.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            {/* Gym Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-300">
                <Building2 className="h-3.5 w-3.5 text-neutral-500" />
                Gym Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.gymName}
                onChange={(e) => update("gymName", e.target.value)}
                placeholder="e.g. Tiger Muay Thai"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-300">
                <User className="h-3.5 w-3.5 text-neutral-500" />
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.ownerName}
                onChange={(e) => update("ownerName", e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-300">
                <Mail className="h-3.5 w-3.5 text-neutral-500" />
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={form.ownerEmail}
                onChange={(e) => update("ownerEmail", e.target.value)}
                placeholder="you@yourgym.com"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
              />
            </div>

            <hr className="border-white/5" />

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-300">
                  <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="e.g. Phuket"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
                />
              </div>
              <div>
                <label className="mb-1.5 text-sm font-medium text-neutral-300">
                  Province
                </label>
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => update("province", e.target.value)}
                  placeholder="e.g. Phuket"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !form.gymName || !form.ownerName || !form.ownerEmail}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-semibold text-white transition-colors hover:bg-orange-400 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-neutral-500">
            30-day free trial. No credit card required.
          </p>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/admin/login" className="text-orange-400 hover:text-orange-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
