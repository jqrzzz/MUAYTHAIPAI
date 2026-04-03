"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Loader2,
  CheckCircle2,
  Building2,
  Mail,
  User,
  MapPin,
  ArrowRight,
} from "lucide-react"

interface SignupForm {
  gymName: string
  ownerName: string
  ownerEmail: string
  city: string
  province: string
  country: string
}

export default function SignupClient() {
  const [form, setForm] = useState<SignupForm>({
    gymName: "",
    ownerName: "",
    ownerEmail: "",
    city: "",
    province: "",
    country: "Thailand",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
        body: JSON.stringify(form),
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
