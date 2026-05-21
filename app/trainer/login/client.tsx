"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Mail, CheckCircle2 } from "lucide-react"
import { AuthCard, SaasButton, SaasInput } from "@/components/saas"
import { SocialSignupButtons } from "@/components/ockock/social-signup-buttons"

export default function TrainerLoginClient() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"email" | "sent">("email")
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

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Trainers must be invited first
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/auth/callback?next=/trainer`,
        },
      })
      if (error) throw error
      setStep("sent")
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

  if (step === "sent") {
    return (
      <AuthCard
        title="Check your email"
        subtitle={`We sent a sign-in link to ${email}. Click it to continue.`}
        footnote="ตรวจสอบอีเมลของคุณ · Trainer dashboard"
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
      title="Trainer sign-in"
      subtitle="เข้าสู่ระบบครูมวย — magic-link access to your trainer dashboard."
      footnote="Need an account? Ask your gym owner for an invite."
    >
      <SocialSignupButtons next="/trainer" showWhatsApp={false} />
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
          {isLoading ? "Sending link…" : "Email me a sign-in link"}
        </SaasButton>
      </form>
    </AuthCard>
  )
}
