"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  UserPlus,
  Loader2,
  Mail,
  Check,
  Copy,
  ShieldCheck,
  Clock,
  RefreshCw,
} from "lucide-react"

interface Admin {
  id: string
  email: string
  name: string | null
  role: string
  since: string | null
}
interface Invite {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string
  expires_at: string
}

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—")

export default function TeamView({ currentUserId }: { currentUserId: string }) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Invite form
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"partner" | "full">("partner")
  const [sending, setSending] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string; url?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/platform-admin/team", { cache: "no-store" })
      if (!res.ok) throw new Error("failed")
      const d = await res.json()
      setAdmins(d.admins ?? [])
      setInvites(d.invites ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const sendInvite = async () => {
    if (!email.trim() || sending) return
    setSending(true)
    setInviteMsg(null)
    setCopied(false)
    try {
      const res = await fetch("/api/platform-admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, role }),
      })
      const d = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        emailSent?: boolean
        invite?: { inviteUrl?: string }
        error?: string
      }
      if (res.ok && d.ok) {
        setInviteMsg({
          ok: true,
          text: d.emailSent ? "Invite sent — they'll get an email." : "Invite created, but email failed. Share this link:",
          url: d.invite?.inviteUrl,
        })
        setEmail("")
        setName("")
        refresh()
      } else {
        setInviteMsg({ ok: false, text: d.error || "Something went wrong" })
      }
    } catch {
      setInviteMsg({ ok: false, text: "Network error — try again." })
    } finally {
      setSending(false)
    }
  }

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  const revoke = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch("/api/platform-admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", userId: id }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        setInviteMsg({ ok: false, text: e.error || "Couldn't remove access." })
      } else {
        setConfirmRevokeId(null)
        refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  const cancelInvite = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch("/api/platform-admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancelInvite", inviteId: id }),
      })
      if (res.ok) refresh()
    } finally {
      setBusyId(null)
    }
  }

  const RoleBadge = ({ r }: { r: string }) =>
    r === "full" ? (
      <Badge className="gap-1 bg-indigo-600/80 text-xs text-white">
        <ShieldCheck className="h-3 w-3" />
        Full
      </Badge>
    ) : (
      <Badge className="bg-zinc-700 text-xs text-zinc-200">Partner</Badge>
    )

  return (
    <div className="space-y-5">
      {/* Invite */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-indigo-400" />
            <p className="text-sm font-medium text-white">Invite a co-founder or partner</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={sending}
              className="rounded-lg bg-zinc-950 px-3 py-2 text-[14px] text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-60"
            />
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
              autoComplete="off"
              className="rounded-lg bg-zinc-950 px-3 py-2 text-[14px] text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-60"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "partner" | "full")}
              disabled={sending}
              className="rounded-lg bg-zinc-950 px-3 py-2 text-[13px] text-zinc-100 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40"
            >
              <option value="partner">Partner — no billing surfaces</option>
              <option value="full">Full — co-founder, sees everything</option>
            </select>
            <button
              onClick={sendInvite}
              disabled={!email.trim() || sending}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-4 text-[14px] font-medium text-white transition-colors hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {sending ? "Sending…" : "Send invite"}
            </button>
          </div>
          {inviteMsg && (
            <div
              className={`rounded-lg px-3 py-2.5 text-[12px] ${
                inviteMsg.ok
                  ? "bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/20"
                  : "bg-red-500/10 text-red-200 ring-1 ring-red-500/20"
              }`}
            >
              <p className="inline-flex items-center gap-1.5">
                {inviteMsg.ok && <Check className="h-3 w-3" />}
                {inviteMsg.text}
              </p>
              {inviteMsg.url && (
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-black/40 px-2 py-1.5 font-mono text-[11px] text-zinc-300">
                    {inviteMsg.url}
                  </code>
                  <button
                    onClick={() => copyUrl(inviteMsg.url!)}
                    className="inline-flex h-7 items-center gap-1 rounded-md bg-zinc-800 px-2 text-[11px] text-zinc-200 hover:bg-zinc-700"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* People with access */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
            <p className="text-sm font-medium text-white">People with access</p>
            <button
              onClick={refresh}
              className="text-zinc-500 hover:text-zinc-200"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {loading ? (
            <div className="py-10 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-zinc-500">
              Couldn&apos;t load the team.{" "}
              <button onClick={refresh} className="text-indigo-300 underline">
                Try again
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {admins.map((a) => {
                const isSelf = a.id === currentUserId
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm text-zinc-300">
                      {(a.name || a.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-white">{a.name || a.email}</p>
                        <RoleBadge r={a.role} />
                        {isSelf && <span className="text-[11px] text-zinc-500">you</span>}
                      </div>
                      {a.name && <p className="truncate text-xs text-zinc-500">{a.email}</p>}
                    </div>
                    {!isSelf &&
                      (confirmRevokeId === a.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => revoke(a.id)}
                            disabled={busyId === a.id}
                            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
                          >
                            {busyId === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Remove"}
                          </button>
                          <button
                            onClick={() => setConfirmRevokeId(null)}
                            className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setInviteMsg(null)
                            setConfirmRevokeId(a.id)
                          }}
                          className="rounded-md px-2.5 py-1 text-xs text-zinc-400 ring-1 ring-zinc-800 hover:text-red-300 hover:ring-red-900/60"
                        >
                          Remove
                        </button>
                      ))}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {invites.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-0">
            <div className="border-b border-zinc-800 px-4 py-2.5">
              <p className="text-sm font-medium text-white">Pending invites</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {invites.map((i) => (
                <div key={i.id} className="flex items-center gap-3 px-4 py-3">
                  <Clock className="h-4 w-4 shrink-0 text-amber-400/80" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm text-zinc-200">{i.email}</p>
                      <RoleBadge r={i.role} />
                    </div>
                    <p className="text-xs text-zinc-600">
                      Invited {fmtDate(i.created_at)} · expires {fmtDate(i.expires_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => cancelInvite(i.id)}
                    disabled={busyId === i.id}
                    className="rounded-md px-2.5 py-1 text-xs text-zinc-400 ring-1 ring-zinc-800 hover:text-red-300 hover:ring-red-900/60 disabled:opacity-60"
                  >
                    {busyId === i.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cancel"}
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
