"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Globe,
  Mail,
  Phone,
  Star,
  Send,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react"

interface OnboardGym {
  id: string
  name: string
  name_th: string | null
  city: string | null
  province: string | null
  country: string | null
  website: string | null
  email: string | null
  phone: string | null
  google_rating: number | null
  google_review_count: number | null
  ai_summary: string | null
  ai_tags: string[] | null
  status: string
  invite_token: string
  invited_at: string | null
  invite_email: string | null
  claimed_at: string | null
  linked_org_id: string | null
}

export default function OnboardClient({
  gym,
  inviteUrl,
}: {
  gym: OnboardGym
  inviteUrl: string
}) {
  const router = useRouter()
  const [emailDraft, setEmailDraft] = useState(gym.invite_email || gym.email || "")
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailMsg, setEmailMsg] = useState<string | null>(null)
  const [pollStatus, setPollStatus] = useState(gym.status)
  const [polling, setPolling] = useState(true)

  // Poll for claim status — when the gym signs up, the status flips
  useEffect(() => {
    if (!polling || pollStatus === "onboarded") return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/platform-admin/discovery/${gym.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.gym?.status && data.gym.status !== pollStatus) {
            setPollStatus(data.gym.status)
            if (data.gym.status === "onboarded") {
              setPolling(false)
            }
          }
        }
      } catch {
        /* ignore */
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [polling, pollStatus, gym.id])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const sendEmail = async () => {
    if (!emailDraft.trim()) return
    setSending(true)
    setEmailMsg(null)
    try {
      const res = await fetch("/api/platform-admin/discovery/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gym.id, email: emailDraft.trim() }),
      })
      const data = await res.json()
      setEmailMsg(data.message || (res.ok ? "Sent." : "Failed."))
    } catch (err) {
      setEmailMsg(err instanceof Error ? err.message : "Failed")
    } finally {
      setSending(false)
    }
  }

  const claimed = pollStatus === "onboarded" || gym.claimed_at != null
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=10&data=${encodeURIComponent(
    inviteUrl
  )}`

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Link
            href="/platform-admin"
            className="text-zinc-400 hover:text-white flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-lg font-semibold">Onboard from backpack</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 space-y-4">
        {/* Gym header */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{gym.name}</h2>
              {gym.name_th && <p className="text-sm text-zinc-400 mt-0.5">{gym.name_th}</p>}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                claimed
                  ? "bg-orange-500 text-white"
                  : "bg-amber-900/60 text-amber-200"
              }`}
            >
              {claimed ? "Claimed 🥊" : "Awaiting scan"}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
            {(gym.city || gym.province) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                {[gym.city, gym.province].filter(Boolean).join(", ")}
              </span>
            )}
            {gym.website && (
              <a
                href={gym.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-orange-400 hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                website
              </a>
            )}
            {gym.google_rating != null && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                {gym.google_rating.toFixed(1)} ({gym.google_review_count})
              </span>
            )}
            {gym.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-zinc-500" />
                {gym.phone}
              </span>
            )}
          </div>
          {gym.ai_summary && (
            <p className="text-sm text-zinc-400 italic">{gym.ai_summary}</p>
          )}
        </div>

        {claimed ? (
          <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-emerald-200">
              {gym.name} is now on the network.
            </p>
            <p className="text-sm text-emerald-200/70 mt-1">
              They&apos;ve claimed the listing — their dashboard is live.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                href="/platform-admin"
                className="rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-sm font-medium"
              >
                Back to network
              </Link>
              <button
                onClick={() => router.push("/platform-admin")}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Onboard another
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* QR */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-center space-y-3">
                <p className="text-sm text-zinc-400">
                  Have the gym owner scan this code with their phone camera.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSrc}
                  alt="Scan to claim"
                  className="mx-auto h-72 w-72 rounded-lg bg-white p-3"
                />
                <div className="flex items-center gap-2 max-w-md mx-auto">
                  <code className="flex-1 truncate rounded bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-300 text-left">
                    {inviteUrl}
                  </code>
                  <button
                    onClick={copy}
                    className="rounded border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 inline-flex items-center gap-1"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 inline-flex items-center gap-1.5">
                  <RefreshCw className={`h-3 w-3 ${polling ? "animate-spin" : ""}`} />
                  Watching for sign-up… you&apos;ll see confirmation here automatically
                </p>
              </div>
            </div>

            {/* Email fallback */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-zinc-200">Or email it directly</p>
                <p className="text-xs text-zinc-500">
                  Useful if the owner isn&apos;t in the room.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  placeholder="owner@gym.com"
                  className="flex-1 rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                />
                <button
                  onClick={sendEmail}
                  disabled={sending || !emailDraft.trim()}
                  className="inline-flex items-center gap-1 rounded bg-orange-500 hover:bg-orange-600 px-3 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Send
                </button>
              </div>
              {gym.invite_email && (
                <p className="text-xs text-zinc-500">
                  Last sent to <span className="text-zinc-300">{gym.invite_email}</span>
                </p>
              )}
              {emailMsg && (
                <p className="text-xs text-zinc-300 whitespace-pre-wrap">{emailMsg}</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
