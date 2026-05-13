"use client"

/**
 * The "Invite a partner" panel on /platform-admin/today. Only "full" platform
 * admins see this (partners can't promote others). Sends a POST to
 * /api/platform-admin/invites; on success, shows the invite URL too so the
 * inviter can share it manually if email delivery fails.
 */
import { useState } from "react"
import { Mail, Loader2, Check, Copy, UserPlus } from "lucide-react"
import { Surface } from "@/components/saas"

interface Result {
  ok: boolean
  message: string
  inviteUrl?: string
}

export default function InvitePartnerPanel() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [copied, setCopied] = useState(false)

  const send = async () => {
    if (!email.trim() || loading) return
    setLoading(true)
    setResult(null)
    setCopied(false)
    try {
      const res = await fetch("/api/platform-admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        invite?: { inviteUrl?: string }
        emailSent?: boolean
        error?: string
      }
      if (res.ok && data.ok) {
        setResult({
          ok: true,
          message: data.emailSent
            ? "Invite sent — they'll get an email."
            : "Invite created, but email delivery failed. Share the link manually:",
          inviteUrl: data.invite?.inviteUrl,
        })
        setEmail("")
        setName("")
      } else {
        setResult({ ok: false, message: data.error || "Something went wrong" })
      }
    } catch {
      setResult({ ok: false, message: "Network error — try again." })
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (!result?.inviteUrl) return
    try {
      await navigator.clipboard.writeText(result.inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — leave it to the user */
    }
  }

  return (
    <Surface className="p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20">
          <UserPlus className="h-4 w-4 text-indigo-300" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-white">Invite a partner</p>
          <p className="text-[12px] text-zinc-500">Operator console access, no billing surfaces.</p>
        </div>
        <span className="text-[11px] text-zinc-500">{open ? "Cancel" : "Send invite →"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-2 border-t border-zinc-900 pt-4">
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg bg-zinc-950 px-3 py-2 text-[14px] text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-60"
          />
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="off"
            className="w-full rounded-lg bg-zinc-950 px-3 py-2 text-[14px] text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-60"
          />
          <button
            onClick={send}
            disabled={!email.trim() || loading}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-500 text-[14px] font-medium text-white transition-colors hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {loading ? "Sending…" : "Send invite"}
          </button>

          {result && (
            <div
              className={`mt-2 rounded-lg px-3 py-2.5 text-[12px] ${
                result.ok ? "bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-200" : "bg-red-500/10 ring-1 ring-red-500/20 text-red-200"
              }`}
            >
              <p className="inline-flex items-center gap-1.5">
                {result.ok && <Check className="h-3 w-3" />}
                {result.message}
              </p>
              {result.inviteUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-black/40 px-2 py-1.5 font-mono text-[11px] text-zinc-300">
                    {result.inviteUrl}
                  </code>
                  <button
                    onClick={copyLink}
                    className="inline-flex h-7 items-center gap-1 rounded-md bg-zinc-800 px-2 text-[11px] text-zinc-200 hover:bg-zinc-700"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Surface>
  )
}
