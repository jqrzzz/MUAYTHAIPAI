"use client"

import type React from "react"
import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Mail } from "lucide-react"
import { AuthCard, SaasButton, SaasInput } from "@/components/saas"
import { SocialSignupButtons } from "@/components/ockock/social-signup-buttons"

function StudentLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"email" | "code">("email")
  const [mode, setMode] = useState<"code" | "password">("code")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) setEmail(emailParam)
  }, [searchParams])

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) router.push("/student")
    }
    checkSession()
  }, [router])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    try {
      // Supabase's default OTP email contains BOTH a 6-digit code and
      // a magic link. We drive the UI off the code (typed on this
      // page, no URL redirect required — works the same across hosts
      // on a shared Supabase project). emailRedirectTo is kept so the
      // link, if a user clicks it instead, still lands on the right
      // host with the right ?next= destination.
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/student`,
          data: fullName ? { full_name: fullName } : undefined,
        },
      })
      if (error) throw error
      setStep("code")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })
      if (error) throw error
      // Hard nav so the server picks up the freshly-set auth cookie.
      window.location.href = "/student"
    } catch (err: unknown) {
      setError(
        err instanceof Error && /invalid/i.test(err.message)
          ? "Email or password not recognized. If you haven't set a password, use the code option instead."
          : err instanceof Error
            ? err.message
            : "Could not sign in",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: code,
        type: "email",
      })
      if (error) throw error
      // Hard nav so the server picks up the freshly-set auth cookie
      // and renders /student with the right user state.
      window.location.href = "/student"
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "code") {
    return (
      <AuthCard
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${email}. Enter it below to continue.`}
        footnote="One account for every Muay Thai gym in Thailand"
      >
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="code"
              className="text-[12px] font-medium text-zinc-300"
            >
              Sign-in code
            </label>
            <SaasInput
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="text-center text-base tracking-[0.4em]"
              required
              autoFocus
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
            disabled={code.length !== 6}
            className="w-full"
          >
            {isLoading ? "Verifying…" : "Verify code"}
          </SaasButton>
        </form>
        <button
          type="button"
          onClick={() => {
            setStep("email")
            setCode("")
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
      title="Train across Thailand"
      subtitle="Sign in or create your account with just an email."
      footnote="One account for every Muay Thai gym in Thailand"
    >
      <SocialSignupButtons next="/student" showWhatsApp={false} />
      <div className="relative my-4">
        <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800" />
        <p className="relative mx-auto w-fit bg-zinc-950 px-2 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
          or sign in with email
        </p>
      </div>
      <form
        onSubmit={mode === "password" ? handlePasswordSignIn : handleSendCode}
        className="space-y-4"
      >
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

        {mode === "code" && (
          <div className="space-y-1.5">
            <label
              htmlFor="fullName"
              className="text-[12px] font-medium text-zinc-300"
            >
              Name{" "}
              <span className="text-zinc-600 font-normal">
                (optional · new accounts)
              </span>
            </label>
            <SaasInput
              id="fullName"
              type="text"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        )}

        {mode === "password" && (
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-[12px] font-medium text-zinc-300"
            >
              Password
            </label>
            <SaasInput
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
        )}

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
          {!isLoading && mode === "code" && <Mail className="h-3.5 w-3.5" />}
          {isLoading
            ? mode === "password"
              ? "Signing in…"
              : "Sending code…"
            : mode === "password"
              ? "Sign in"
              : "Email me a sign-in code"}
        </SaasButton>
      </form>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "password" ? "code" : "password")
          setError(null)
        }}
        className="mt-4 w-full text-center text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        {mode === "password"
          ? "Email me a sign-in code instead"
          : "Sign in with a password instead"}
      </button>
    </AuthCard>
  )
}

export default function StudentLoginClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
        </div>
      }
    >
      <StudentLoginInner />
    </Suspense>
  )
}
