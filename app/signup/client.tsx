"use client"

import { Suspense, useState, useEffect } from "react"
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
import { AuthCard, SaasInput, SaasButton } from "@/components/saas"
import { SocialSignupButtons } from "@/components/ockock/social-signup-buttons"

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

function SignupInner() {
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
  const [signInUrl, setSignInUrl] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
        if (!cancelled)
          setInviteError(
            err instanceof Error ? err.message : "Invite lookup failed",
          )
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
    setSignInUrl(null)

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, inviteToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (typeof data?.signInUrl === "string") {
          setSignInUrl(data.signInUrl)
        }
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
      <AuthCard
        title="Check your email"
        subtitle={`We sent a sign-in link to ${form.ownerEmail}. Click it to enter your dashboard and start setting up.`}
        footnote="30-day free trial · no credit card required"
      >
        <div className="rounded-xl ring-1 ring-emerald-500/20 bg-emerald-500/[0.06] p-4 flex items-start gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 shrink-0 mt-0.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
          </span>
          <div className="text-[13px] text-emerald-100/90 leading-relaxed">
            Your gym is provisioned. Trial is running. Open the magic link
            on this device to keep going.
          </div>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="List your gym"
      subtitle="Bookings, the Naga–Garuda cert ladder, and OckOck answering your customers in your voice. 30-day free trial — no credit card."
      footnote={
        <>
          Already have an account?{" "}
          <Link
            href="/admin/login"
            className="text-indigo-300 hover:text-indigo-200 font-medium"
          >
            Sign in
          </Link>
        </>
      }
    >
      {invite && (
        <div className="mb-4 rounded-xl ring-1 ring-indigo-500/25 bg-indigo-500/[0.06] p-3 flex items-start gap-2.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-300 mt-0.5 shrink-0" />
          <div className="text-[12px]">
            <p className="font-medium text-indigo-100">
              Claiming{" "}
              <span className="text-white">{invite.gymName}</span>
            </p>
            <p className="text-indigo-200/70 text-[11px] mt-0.5">
              We pre-filled what we know — adjust anything that&apos;s off.
            </p>
          </div>
        </div>
      )}
      {inviteError && (
        <div className="mb-4 rounded-lg ring-1 ring-red-500/20 bg-red-500/10 p-2.5 text-[12px] text-red-300">
          Invite link issue: {inviteError}. You can still sign up below.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <FormField
          label="Gym name"
          icon={Building2}
          required
          value={form.gymName}
          onChange={(v) => update("gymName", v)}
          placeholder="e.g. Tiger Muay Thai"
        />
        <FormField
          label="Your name"
          icon={User}
          required
          value={form.ownerName}
          onChange={(v) => update("ownerName", v)}
          placeholder="Your full name"
        />
        <FormField
          label="Email"
          icon={Mail}
          type="email"
          required
          value={form.ownerEmail}
          onChange={(v) => update("ownerEmail", v)}
          placeholder="you@yourgym.com"
        />
        <div className="grid grid-cols-2 gap-2.5">
          <FormField
            label="City"
            icon={MapPin}
            value={form.city}
            onChange={(v) => update("city", v)}
            placeholder="Phuket"
          />
          <FormField
            label="Province"
            value={form.province}
            onChange={(v) => update("province", v)}
            placeholder="Phuket"
          />
        </div>

        {error && (
          <div className="rounded-lg ring-1 ring-red-500/20 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-300">
            {error}
            {signInUrl && (
              <Link
                href={signInUrl}
                className="mt-1.5 block text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline"
              >
                Sign in to your existing gym →
              </Link>
            )}
          </div>
        )}

        <SaasButton
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={!form.gymName || !form.ownerName || !form.ownerEmail}
          className="w-full"
        >
          Start free trial
          {!submitting && <ArrowRight className="h-3.5 w-3.5" />}
        </SaasButton>

        <div className="relative my-1">
          <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800" />
          <p className="relative mx-auto w-fit bg-zinc-950 px-2 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            or
          </p>
        </div>

        <SocialSignupButtons next="/admin" />

        <p className="text-center text-[11px] text-zinc-600">
          30-day free trial · no credit card required
        </p>
      </form>
    </AuthCard>
  )
}

function FormField({
  label,
  icon: Icon,
  type = "text",
  required,
  value,
  onChange,
  placeholder,
}: {
  label: string
  icon?: typeof Building2
  type?: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-zinc-300 inline-flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-zinc-500" />}
        {label}
        {required && <span className="text-indigo-400">*</span>}
      </label>
      <SaasInput
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export default function SignupClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
        </div>
      }
    >
      <SignupInner />
    </Suspense>
  )
}
