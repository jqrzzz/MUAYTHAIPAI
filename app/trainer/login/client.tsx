"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Mail } from "lucide-react"
import { AuthCard, SaasButton, SaasInput } from "@/components/saas"
import { SocialSignupButtons } from "@/components/ockock/social-signup-buttons"

export default function TrainerLoginClient() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"email" | "code">("email")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        const { data: trainerProfile } = await supabase
          .from("trainer_profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .single()
        if (trainerProfile) router.push("/trainer")
      }
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
      // page, no URL redirect required). emailRedirectTo is kept so
      // the link, if clicked instead, still lands on the right host.
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: false, // Trainers must be invited first
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/trainer`,
        },
      })
      if (error) throw error
      setStep("code")
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Signups not allowed")) {
        setError(
          "No trainer account found with this email. Ask your gym owner for an invitation.",
        )
      } else {
        setError(err instanceof Error ? err.message : "An error occurred")
      }
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
      // and renders /trainer with the right user state.
      window.location.href = "/trainer"
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
        footnote="ตรวจสอบอีเมลของคุณ · Trainer dashboard"
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
      title="Trainer sign-in"
      subtitle="เข้าสู่ระบบครูมวย — code-based access to your trainer dashboard."
      footnote="Need an account? Ask your gym owner for an invite."
    >
      <SocialSignupButtons next="/trainer" showWhatsApp={false} />
      <div className="relative my-4">
        <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800" />
        <p className="relative mx-auto w-fit bg-zinc-950 px-2 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
          or sign in with email
        </p>
      </div>
      <form onSubmit={handleSendCode} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-[12px] font-medium text-zinc-300"
          >
            Email <span className="text-zinc-600 font-normal">(อีเมล)</span>
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
          {isLoading ? "Sending code…" : "Email me a sign-in code"}
        </SaasButton>
      </form>
    </AuthCard>
  )
}
