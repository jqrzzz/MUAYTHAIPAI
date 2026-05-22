"use client"

import type React from "react"
import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Mail, CheckCircle2 } from "lucide-react"
import { AuthCard, SaasButton, SaasInput } from "@/components/saas"
import { SocialSignupButtons } from "@/components/ockock/social-signup-buttons"

// Whitelist of post-login destinations we'll honor from ?redirect=.
// Prevents open-redirect tomfoolery via crafted URLs while still letting
// callers like /promoter (the OckOck promoter dashboard) and /ockock/*
// (the legacy internal path, kept for safety) punt users through login
// and back.
function safeRedirect(raw: string | null): string {
  if (!raw) return "/admin"
  // Only same-origin paths starting with / and not //
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin"
  const allowed = ["/admin", "/trainer", "/promoter", "/ockock", "/platform-admin"]
  if (allowed.some((p) => raw === p || raw.startsWith(`${p}/`) || raw.startsWith(`${p}?`))) {
    return raw
  }
  return "/admin"
}

// Map ?error= codes from the redirector to short, human-readable banners.
function errorMessageFor(code: string | null): string | null {
  switch (code) {
    case "no_promoter_access":
      return "You need to be a gym owner, admin, or promoter to access fight events. Sign in with a staff account or ask your gym owner for access."
    case "no_admin_access":
      return "You need gym owner or admin access to view this page."
    case "session_expired":
      return "Your session expired. Sign in again to continue."
    default:
      return null
  }
}

function AdminLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get("email") ?? "")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"email" | "sent">("email")
  const [error, setError] = useState<string | null>(null)
  const redirectTo = safeRedirect(searchParams.get("redirect"))
  const contextMessage = errorMessageFor(searchParams.get("error"))

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) router.push(redirectTo)
    }
    checkSession()
  }, [router, redirectTo])

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          // After the user clicks the magic link, /auth/callback finishes
          // auth and forwards them to ?next= — pass our safe redirectTo
          // so they end up on /ockock/promoter (or wherever) and not the
          // generic /admin dashboard.
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) throw error
      setStep("sent")
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Signups not allowed")) {
        setError(
          "No staff account found with this email. You need an invite from a gym owner first.",
        )
      } else {
        setError(err instanceof Error ? err.message : "An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "sent") {
    return (
      <AuthCard
        title="Check your email"
        subtitle={`We sent a sign-in link to ${email}. Click it to continue.`}
        footnote="For gym staff, trainers, and platform admins"
      >
        <div className="rounded-xl ring-1 ring-emerald-500/20 bg-emerald-500/[0.06] p-4 flex items-start gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 shrink-0 mt-0.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
          </span>
          <div className="text-[13px] text-emerald-100/90 leading-relaxed">
            Magic link delivered. Open it on this device to stay signed in.
          </div>
        </div>
        <button
          onClick={() => {
            setStep("email")
            setError(null)
          }}
          className="mt-5 w-full text-center text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          Use a different email
        </button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Sign in to your gym"
      subtitle="Magic-link sign-in for owners, admins, and trainers."
      footnote="For gym staff, trainers, and platform admins"
    >
      {contextMessage && (
        <div className="mb-4 rounded-lg ring-1 ring-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-[12px] text-amber-200">
          {contextMessage}
        </div>
      )}
      <SocialSignupButtons next={redirectTo} showWhatsApp={false} />
      <div className="relative my-4">
        <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800" />
        <p className="relative mx-auto w-fit bg-zinc-950 px-2 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
          or sign in with email
        </p>
      </div>
      <form onSubmit={handleSendMagicLink} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-[12px] font-medium text-zinc-300"
          >
            Email
          </label>
          <SaasInput
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="rounded-lg ring-1 ring-red-500/20 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-300">
            {error}
          </div>
        )}

        <SaasButton
          type="submit"
          variant="primary"
          loading={isLoading}
          className="w-full"
        >
          {!isLoading && <Mail className="h-3.5 w-3.5" />}
          {isLoading ? "Sending link…" : "Email me a sign-in link"}
        </SaasButton>
      </form>
    </AuthCard>
  )
}

export default function AdminLoginClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
        </div>
      }
    >
      <AdminLoginInner />
    </Suspense>
  )
}
