"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, CheckCircle, Loader2 } from "lucide-react"

interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  city: string | null
  province: string | null
}

interface Invite {
  id: string
  token: string
  email: string
  role: string
  org_id: string
}

interface InviteAcceptClientProps {
  invite: Invite
  organization: Organization
  isLoggedIn: boolean
  userEmail?: string
}

export default function InviteAcceptClient({ invite, organization, isLoggedIn, userEmail }: InviteAcceptClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<"verify" | "code" | "name" | "success">(isLoggedIn ? "name" : "verify")
  const [email, setEmail] = useState(invite.email)
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendCode = async () => {
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
        },
      })

      if (otpError) throw otpError
      setStep("code")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: code,
        type: "email",
      })

      if (verifyError) throw verifyError
      setStep("name")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvite = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/invites/${invite.token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to accept invite")
      }

      setStep("success")
      setTimeout(() => {
        // Redirect trainers to /trainer, owners/admins to /admin
        const redirectPath = invite.role === "trainer" ? "/trainer" : "/admin"
        router.push(redirectPath)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join {organization.name}</CardTitle>
          <CardDescription>
            {organization.city && organization.province ? `${organization.city}, ${organization.province}` : "Thailand"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "verify" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                You've been invited to join as a <span className="font-medium text-foreground">{invite.role}</span>.
                Enter your email to get started.
              </p>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-background/50"
                />
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button
                onClick={handleSendCode}
                disabled={isLoading || !email.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send Verification Code
              </Button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
              </p>

              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="bg-background/50 text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button
                onClick={handleVerifyCode}
                disabled={isLoading || code.length !== 6}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify Code
              </Button>

              <Button variant="ghost" onClick={() => setStep("verify")} className="w-full">
                Use different email
              </Button>
            </div>
          )}

          {step === "name" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Almost done! Enter your name to complete your profile.
              </p>

              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kru Somchai"
                  className="bg-background/50"
                />
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <Button
                onClick={handleAcceptInvite}
                disabled={isLoading || !name.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Join {organization.name}
              </Button>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Welcome to {organization.name}!</h3>
                <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
