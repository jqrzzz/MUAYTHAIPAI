"use client"

/**
 * Channel credentials card — owner-facing surface for connecting LINE,
 * WhatsApp, IG, FB, Telegram, etc. to OckOck.
 *
 * Shows one card per channel with:
 *   - Connection status (configured / verified / env-fallback warning)
 *   - One input per field (secrets are <input type=password> with a
 *     "saved" indicator; non-secret fields show their value)
 *   - Save action that POSTs partial updates (empty inputs are ignored
 *     so saving doesn't wipe a previously-saved secret)
 *
 * Reads + writes go through /api/admin/channels/credentials. Raw secrets
 * never leave the server — the GET response only includes a masked
 * preview.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
  Save,
  Send,
  Sparkles,
} from "lucide-react"

type ChannelName = "line" | "telegram" | "whatsapp" | "ig" | "fb" | "test"

interface FieldStatus {
  key: string
  label: string
  secret: boolean
  help: string | null
  configured: boolean
  source: "db" | "env" | "none"
  preview: string
}

interface ChannelStatus {
  channel: ChannelName
  configured: boolean
  is_active: boolean
  is_verified: boolean
  last_verified_at: string | null
  last_error: string | null
  auto_send_enabled: boolean
  using_env_fallback: boolean
  fields: FieldStatus[]
}

const CHANNEL_LABEL: Record<ChannelName, string> = {
  line: "LINE",
  telegram: "Telegram",
  whatsapp: "WhatsApp Business",
  ig: "Instagram",
  fb: "Facebook Messenger",
  test: "Test (dev only)",
}

const CHANNEL_TAGLINE: Record<ChannelName, string> = {
  line: "Connect your LINE Official Account so OckOck can answer and you can reply from the inbox.",
  telegram: "Connect a Telegram bot for chat-channel inbound + outbound.",
  whatsapp: "Connect WhatsApp Business via the Meta Cloud API.",
  ig: "Connect your Instagram Business account so DMs land in OckOck's inbox.",
  fb: "Connect your Facebook Page so Messenger DMs land in OckOck's inbox.",
  test: "Internal smoke-test adapter. Only useful in dev.",
}

export default function ChannelCredentialsCard() {
  const [channels, setChannels] = useState<ChannelStatus[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = useState<ChannelName | null>(null)
  const [savedFlash, setSavedFlash] = useState<ChannelName | null>(null)
  const [togglingAutoSend, setTogglingAutoSend] = useState<ChannelName | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/channels/credentials", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Failed to load")
      setChannels(data.channels as ChannelStatus[])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visibleChannels = useMemo(
    () => (channels ?? []).filter((c) => c.channel !== "test"),
    [channels],
  )

  function setDraft(channel: ChannelName, key: string, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [channel]: { ...(prev[channel] ?? {}), [key]: value },
    }))
  }

  async function save(channel: ChannelName) {
    const fields = drafts[channel] ?? {}
    if (Object.values(fields).every((v) => !v?.trim())) return
    setSaving(channel)
    setError(null)
    try {
      const res = await fetch("/api/admin/channels/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, fields }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Save failed")
      setDrafts((prev) => ({ ...prev, [channel]: {} }))
      setSavedFlash(channel)
      setTimeout(() => setSavedFlash((s) => (s === channel ? null : s)), 2500)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(null)
    }
  }

  async function toggleAutoSend(channel: ChannelName, next: boolean) {
    setTogglingAutoSend(channel)
    setError(null)
    try {
      const res = await fetch("/api/admin/channels/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, auto_send_enabled: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Toggle failed")
      // Optimistic update for snappy feedback, then reload to sync.
      setChannels((prev) =>
        (prev ?? []).map((c) =>
          c.channel === channel ? { ...c, auto_send_enabled: next } : c,
        ),
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setTogglingAutoSend(null)
    }
  }

  if (loading && !channels) {
    return (
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="py-10 text-center text-neutral-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
          Loading channel status…
        </CardContent>
      </Card>
    )
  }

  if (error && !channels) {
    return (
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="py-6 text-sm text-red-300">
          Could not load channels: {error}{" "}
          <button onClick={load} className="text-orange-400 underline ml-2">
            Retry
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                Connect your channels
              </CardTitle>
              <CardDescription>
                Once connected, OckOck answers DMs from these channels in your
                gym&apos;s voice — every message also lands in your Inbox so you
                can review or take over.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={load}
              disabled={loading}
              className="border-neutral-700 bg-transparent text-neutral-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {visibleChannels.map((c) => {
        const draft = drafts[c.channel] ?? {}
        const dirty = Object.values(draft).some((v) => v?.trim())
        const isSaving = saving === c.channel
        const showSavedFlash = savedFlash === c.channel

        return (
          <Card key={c.channel} className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-white text-lg">
                    {CHANNEL_LABEL[c.channel]}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {CHANNEL_TAGLINE[c.channel]}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {c.configured ? (
                    c.is_verified ? (
                      <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                        <Check className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">
                        Saved · needs test
                      </Badge>
                    )
                  ) : (
                    <Badge className="bg-neutral-800 text-neutral-400 border-neutral-700">
                      Not connected
                    </Badge>
                  )}
                  {c.using_env_fallback && (
                    <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/30">
                      Using platform env vars
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {c.using_env_fallback && (
                <div className="rounded-md bg-blue-500/[0.05] border border-blue-500/20 p-2.5 text-xs text-blue-200/80 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    Some fields are using the platform&apos;s env-var fallback
                    (legacy). Save your own values below to migrate this gym
                    to its own credentials.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {c.fields.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-neutral-300 text-xs flex items-center gap-2">
                      {f.label}
                      {f.configured && (
                        <span className="text-emerald-400 text-[10px]">✓ saved</span>
                      )}
                    </Label>
                    <Input
                      type={f.secret ? "password" : "text"}
                      placeholder={
                        f.configured
                          ? f.secret
                            ? f.preview || "••••"
                            : f.preview
                          : f.help ?? `Paste your ${f.label.toLowerCase()}`
                      }
                      value={draft[f.key] ?? ""}
                      onChange={(e) => setDraft(c.channel, f.key, e.target.value)}
                      className="bg-neutral-800 border-neutral-700 text-white text-sm"
                      disabled={isSaving}
                      autoComplete="off"
                    />
                    {f.help && (
                      <p className="text-[11px] text-neutral-500 leading-snug">
                        {f.help}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => save(c.channel)}
                  disabled={!dirty || isSaving}
                  className="bg-orange-500 hover:bg-orange-400 text-white"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : showSavedFlash ? (
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {showSavedFlash ? "Saved" : "Save"}
                </Button>
                {c.configured && !c.is_verified && (
                  <span className="text-[11px] text-neutral-500 inline-flex items-center gap-1">
                    <Send className="h-3 w-3" />
                    First inbound message will mark this verified.
                  </span>
                )}
              </div>

              {/* Auto-reply toggle. OckOck always saves a draft for
                  inbound DMs; turning this ON lets OckOck send replies
                  directly without owner approval (matches the web
                  widget). Owner can flip back to drafts-only any time. */}
              <div className="mt-3 pt-3 border-t border-neutral-800 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                    OckOck auto-reply
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                    {c.auto_send_enabled
                      ? "OckOck answers DMs immediately in your gym's voice. You'll still see every conversation in the inbox."
                      : "OckOck drafts a reply for every inbound DM and waits for you to approve it in the inbox. Flip this on once you trust the drafts."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={c.auto_send_enabled}
                  disabled={togglingAutoSend === c.channel}
                  onClick={() => toggleAutoSend(c.channel, !c.auto_send_enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:opacity-50 ${
                    c.auto_send_enabled ? "bg-orange-500" : "bg-neutral-700"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
                      c.auto_send_enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
