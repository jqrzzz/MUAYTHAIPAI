"use client"

/**
 * Platform-invite accept page. Rendered by /invite/[token] when the token
 * matches a row in `platform_invites` (not `invites`). Three states:
 *   1. Not signed in        → ask for the magic link to {invite.email}
 *   2. Signed in, wrong email → tell them to sign in with the right one
 *   3. Signed in, right email → "Accept partner access" button
 */
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AuthCard } from "@/components/saas"

interface PlatformInvite {
  id: string
  email: string
  name: string | null
  role: "full" | "partner"
  token: string
  expires_at: string
}

export default function PlatformInviteAccept({
  invite,
  isLoggedIn,
  userEmail,
}: {
  invite: PlatformInvite
  isLoggedIn: boolean
  userEmail: string | null | undefined
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  const emailMatches = !!userEmail && userEmail.toLowerCase() === invite.email.toLowerCase()

  const sendMagicLink = async () => {
    setLoading(true)
    setError(null)
    try {
      const origin = window.location.origin
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: invite.email,
        options: { emailRedirectTo: `${origin}/invite/${invite.token}` },
      })
      if (otpErr) {
        setError(otpErr.message)
      } else {
        setMagicSent(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the link")
    } finally {
      setLoading(false)
    }
  }

  const accept = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/platform-admin/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: invite.token }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; redirect?: string }
      if (!res.ok || !data.ok) {
        setError(data.error || "Couldn't accept this invite")
        setLoading(false)
        return
      }
      router.push(data.redirect || "/platform-admin")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error")
      setLoading(false)
    }
  }

  const greeting = invite.name ? `Welcome, ${invite.name}` : "You've been invited"

  return (
    <AuthCard
      title={greeting}
      subtitle="You're being invited to OckOck as a platform partner — full access to the operator console except billing."
      footnote={
        <>
          Invited to <span className="text-zinc-300">{invite.email}</span>.
        </>
      }
    >
      {!isLoggedIn ? (
        magicSent ? (
          <div className="rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 px-3.5 py-3 text-[13px] text-emerald-200">
            <p className="font-medium">Check your inbox.</p>
            <p className="mt-1 text-emerald-200/80">
              We sent a sign-in link to <span className="font-mono">{invite.email}</span>. Click it to come back here
              and accept.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-zinc-400">
              Sign in with <span className="text-zinc-200">{invite.email}</span> to accept. No password — we'll email
              you a one-time link.
            </p>
            {error && <p className="text-[13px] text-red-300">{error}</p>}
            <button
              onClick={sendMagicLink}
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-500 text-[14px] font-medium text-white transition-colors hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Email me a sign-in link
            </button>
          </div>
        )
      ) : !emailMatches ? (
        <div className="space-y-3">
          <p className="text-[13px] text-red-300">
            This invite was sent to <span className="font-mono">{invite.email}</span>, but you're signed in as{" "}
            <span className="font-mono">{userEmail}</span>.
          </p>
          <p className="text-[12px] text-zinc-500">
            Sign out and sign back in with the right email to accept.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {error && <p className="text-[13px] text-red-300">{error}</p>}
          <button
            onClick={accept}
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-500 text-[14px] font-medium text-white transition-colors hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Accept partner access
          </button>
        </div>
      )}
    </AuthCard>
  )
}
