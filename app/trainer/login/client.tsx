"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Users, Mail, CheckCircle } from "lucide-react"

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
        // Check if user is a trainer
        const { data: trainerProfile } = await supabase
          .from("trainer_profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .single()

        if (trainerProfile) {
          router.push("/trainer")
        }
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
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback?next=/trainer`,
        },
      })

      if (error) throw error

      setStep("sent")
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Signups not allowed")) {
        setError("No trainer account found with this email. Please contact your gym owner for an invitation.")
      } else {
        setError(err instanceof Error ? err.message : "An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-neutral-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to site
        </Link>

        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-600/20 rounded-full flex items-center justify-center mb-4">
              {step === "email" ? (
                <Users className="w-6 h-6 text-orange-500" />
              ) : (
                <Mail className="w-6 h-6 text-orange-500" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {step === "email" ? "Trainer Login" : "Check Your Email"}
            </CardTitle>
            <CardTitle className="text-lg text-neutral-400 font-normal mt-1">
              {step === "email" ? "เข้าสู่ระบบครูมวย" : "ตรวจสอบอีเมลของคุณ"}
            </CardTitle>
            <CardDescription className="text-neutral-400 mt-2">
              {step === "email"
                ? "Enter your email to access your trainer dashboard"
                : "Click the link in your email to sign in"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-300">
                    Email (อีเมล)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    "Send Magic Link (ส่งลิงก์เข้าสู่ระบบ)"
                  )}
                </Button>

                <p className="text-xs text-neutral-500 text-center mt-4">
                  Need an account? Ask your gym owner to send you an invite.
                </p>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-400">
                    We sent a login link to <strong>{email}</strong>
                  </p>
                </div>

                <p className="text-sm text-neutral-400">
                  Click the link in your email to sign in. You can close this page.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email")
                    setError(null)
                  }}
                  className="w-full text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Use a different email
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-neutral-500 mt-4">
          Trainer dashboard for Muay Thai Thailand Network gyms
        </p>
      </div>
    </div>
  )
}
