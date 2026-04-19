"use client"

/**
 * Channels tab for the admin console.
 *
 * Lets the gym owner/admin:
 *   1. Bootstrap the default chat groups (public_inbox, owner_assist) if missing
 *   2. Register the gym's channel accounts (LINE OA userId, Telegram bot id,
 *      WhatsApp phone_number_id, etc.) against a group so the engine's
 *      autoBind can route first-contact messages correctly
 *   3. Toggle or remove a connection
 *
 * Webhook URLs + env-var hints are shown inline so the owner knows exactly
 * what to paste into LINE Developers Console / BotFather / Meta App
 * dashboard.
 *
 * Secrets (LINE_CHANNEL_SECRET, TELEGRAM_BOT_TOKEN, WHATSAPP_APP_SECRET,
 * etc.) are NOT stored in the DB — they live in the hosting platform's
 * env vars (Vercel / fly.io / etc.). This tab tells the owner which vars
 * to set; it does not capture the values.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Check,
  Copy,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  AlertCircle,
} from "lucide-react"

type Channel = "line" | "telegram" | "whatsapp" | "ig" | "fb" | "web" | "test"

type GroupRow = {
  id: string
  org_id: string
  name: string
  purpose: "public_inbox" | "owner_assist" | "staff"
  description: string | null
  is_active: boolean
  channelCount?: number
}

type ChannelRow = {
  id: string
  channel: Channel
  external_account_id: string
  display_label: string | null
  is_active: boolean
  last_inbound_at: string | null
  created_at: string
}

const CHANNEL_OPTIONS: Array<{
  value: Channel
  label: string
  placeholder: string
  help: string
  webhookPath: string
  envHints: string[]
}> = [
  {
    value: "line",
    label: "LINE",
    placeholder: "U1234… (LINE OA userId)",
    help:
      "Paste the LINE Official Account's user ID (found in the webhook's `destination` field after the first delivery, or under LINE Developers → Messaging API → Your user ID).",
    webhookPath: "/api/webhooks/line",
    envHints: ["LINE_CHANNEL_SECRET", "LINE_CHANNEL_ACCESS_TOKEN"],
  },
  {
    value: "telegram",
    label: "Telegram",
    placeholder: "Numeric bot id (first segment of the token)",
    help:
      "The numeric id from your bot token (the part before the colon — e.g. for `1234567:ABC…`, enter `1234567`). Set this same value in the TELEGRAM_BOT_ID env var.",
    webhookPath: "/api/webhooks/telegram",
    envHints: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "TELEGRAM_BOT_ID"],
  },
  {
    value: "whatsapp",
    label: "WhatsApp (Cloud API)",
    placeholder: "Phone number id from Meta App dashboard",
    help:
      "From Meta App dashboard → WhatsApp → API Setup → `Phone number ID`. Also set WHATSAPP_VERIFY_TOKEN (you pick), WHATSAPP_APP_SECRET, and WHATSAPP_ACCESS_TOKEN in env.",
    webhookPath: "/api/webhooks/whatsapp",
    envHints: [
      "WHATSAPP_APP_SECRET",
      "WHATSAPP_VERIFY_TOKEN",
      "WHATSAPP_ACCESS_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
    ],
  },
  {
    value: "test",
    label: "Test (dev only)",
    placeholder: "any identifier",
    help:
      "Used by the in-memory test adapter for smoke-testing the chat engine. Don't use in production.",
    webhookPath: "/api/webhooks/test",
    envHints: ["TEST_WEBHOOK_SECRET"],
  },
]

const CHANNEL_BY_VALUE = new Map(CHANNEL_OPTIONS.map((c) => [c.value, c]))

interface ChannelsTabProps {
  role?: string
}

export default function ChannelsTab({ role }: ChannelsTabProps) {
  const canManage = role === "owner" || role === "admin"

  const [groups, setGroups] = useState<GroupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [bootstrapping, setBootstrapping] = useState(false)

  const [siteOrigin, setSiteOrigin] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined") setSiteOrigin(window.location.origin)
  }, [])

  const loadGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/chat-groups", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load")
      setGroups(data.groups as GroupRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  function flash(type: "ok" | "err", text: string) {
    setFeedback({ type, text })
    setTimeout(() => setFeedback(null), 3500)
  }

  async function handleBootstrap() {
    setBootstrapping(true)
    try {
      const res = await fetch("/api/admin/chat-groups/bootstrap", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Bootstrap failed")
      flash("ok", data.created > 0 ? `Created ${data.created} group(s)` : "Up to date")
      setGroups(data.groups as GroupRow[])
    } catch (err) {
      flash("err", err instanceof Error ? err.message : String(err))
    } finally {
      setBootstrapping(false)
    }
  }

  const publicInbox = useMemo(() => groups.find((g) => g.purpose === "public_inbox"), [groups])
  const ownerAssist = useMemo(() => groups.find((g) => g.purpose === "owner_assist"), [groups])
  const staff = useMemo(() => groups.find((g) => g.purpose === "staff"), [groups])

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Link2 className="w-6 h-6 text-orange-500" />
              <div>
                <CardTitle className="text-white">Channel Connections</CardTitle>
                <CardDescription>
                  Route incoming messages from LINE, Telegram, WhatsApp, and more
                  into the right inbox.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canManage && (!publicInbox || !ownerAssist) && (
                <Button
                  onClick={handleBootstrap}
                  disabled={bootstrapping}
                  className="bg-orange-600 hover:bg-orange-700"
                  size="sm"
                >
                  {bootstrapping ? "Setting up…" : "Set up default groups"}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={loadGroups}
                disabled={loading}
                className="text-neutral-400 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {feedback && (
        <div
          className={`px-4 py-2 rounded border text-sm ${
            feedback.type === "ok"
              ? "bg-green-900/30 border-green-700 text-green-200"
              : "bg-red-900/30 border-red-700 text-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {error && (
        <div className="px-4 py-2 rounded border border-red-700 bg-red-900/30 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Public inbox panel */}
      {publicInbox ? (
        <GroupPanel
          group={publicInbox}
          canManage={canManage}
          siteOrigin={siteOrigin}
          onFeedback={flash}
          variant="public"
        />
      ) : (
        loading ? null : (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6 text-center text-neutral-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              No public inbox set up yet. Click &ldquo;Set up default groups&rdquo; above to create one.
            </CardContent>
          </Card>
        )
      )}

      {/* Owner assist panel (read-only for now — channel binding lands in a follow-up) */}
      {ownerAssist && (
        <GroupPanel
          group={ownerAssist}
          canManage={canManage}
          siteOrigin={siteOrigin}
          onFeedback={flash}
          variant="owner"
        />
      )}

      {/* Staff panel, if any (optional) */}
      {staff && (
        <GroupPanel
          group={staff}
          canManage={canManage}
          siteOrigin={siteOrigin}
          onFeedback={flash}
          variant="staff"
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// GroupPanel
// ---------------------------------------------------------------------------

function GroupPanel({
  group,
  canManage,
  siteOrigin,
  onFeedback,
  variant,
}: {
  group: GroupRow
  canManage: boolean
  siteOrigin: string
  onFeedback: (t: "ok" | "err", text: string) => void
  variant: "public" | "owner" | "staff"
}) {
  const [channels, setChannels] = useState<ChannelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [formChannel, setFormChannel] = useState<Channel>("line")
  const [formAccountId, setFormAccountId] = useState("")
  const [formLabel, setFormLabel] = useState("")
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/chat-groups/${group.id}/channels`, {
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load channels")
      setChannels(data.channels as ChannelRow[])
    } catch (err) {
      onFeedback("err", err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [group.id, onFeedback])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd() {
    if (!formAccountId.trim() || adding) return
    setAdding(true)
    try {
      const res = await fetch(`/api/admin/chat-groups/${group.id}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: formChannel,
          external_account_id: formAccountId.trim(),
          display_label: formLabel.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Add failed")
      onFeedback("ok", "Channel connected")
      setFormAccountId("")
      setFormLabel("")
      await load()
    } catch (err) {
      onFeedback("err", err instanceof Error ? err.message : String(err))
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(row: ChannelRow) {
    setBusyId(row.id)
    try {
      const res = await fetch(
        `/api/admin/chat-groups/${group.id}/channels/${row.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !row.is_active }),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Toggle failed")
      setChannels((prev) => prev.map((c) => (c.id === row.id ? data.channel : c)))
    } catch (err) {
      onFeedback("err", err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(row: ChannelRow) {
    if (!confirm(`Remove ${row.channel} connection "${row.display_label || row.external_account_id}"?`)) {
      return
    }
    setBusyId(row.id)
    try {
      const res = await fetch(
        `/api/admin/chat-groups/${group.id}/channels/${row.id}`,
        { method: "DELETE" },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Delete failed")
      onFeedback("ok", "Connection removed")
      setChannels((prev) => prev.filter((c) => c.id !== row.id))
    } catch (err) {
      onFeedback("err", err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const selected = CHANNEL_BY_VALUE.get(formChannel)

  const variantLabel =
    variant === "public"
      ? "For all visitor & student messages"
      : variant === "owner"
        ? "Private — owner's AI assistant"
        : "Internal staff channel"

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              {group.name}
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 h-4 border-neutral-600 text-neutral-300"
              >
                {group.purpose}
              </Badge>
            </CardTitle>
            <CardDescription>{group.description || variantLabel}</CardDescription>
          </div>
          <div className="text-xs text-neutral-400">
            {channels.filter((c) => c.is_active).length} active · {channels.length} total
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Connected rows */}
        {loading ? (
          <div className="text-sm text-neutral-400 py-2">Loading…</div>
        ) : channels.length === 0 ? (
          <div className="text-sm text-neutral-400 py-2">
            No channels connected to this group yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {channels.map((c) => {
              const meta = CHANNEL_BY_VALUE.get(c.channel)
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded border border-neutral-800 bg-neutral-950/40"
                >
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 h-4 border-neutral-600 text-neutral-300 shrink-0"
                  >
                    {meta?.label ?? c.channel}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {c.display_label || c.external_account_id}
                    </div>
                    <div className="text-xs text-neutral-500 truncate font-mono">
                      {c.external_account_id}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      Last inbound:{" "}
                      {c.last_inbound_at
                        ? new Date(c.last_inbound_at).toLocaleString()
                        : "never"}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === c.id}
                        onClick={() => handleToggle(c)}
                        className={`text-xs h-7 ${
                          c.is_active ? "text-green-400" : "text-neutral-500"
                        }`}
                      >
                        {c.is_active ? (
                          <>
                            <Check className="w-3 h-3 mr-1" /> Active
                          </>
                        ) : (
                          "Paused"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === c.id}
                        onClick={() => handleDelete(c)}
                        className="text-red-400 hover:text-red-300 h-7"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {/* Add form */}
        {canManage && (
          <div className="border-t border-neutral-800 pt-3 space-y-2">
            <div className="text-xs font-medium text-neutral-300">Connect a channel</div>
            <div className="grid grid-cols-1 md:grid-cols-[160px,1fr,1fr,auto] gap-2">
              <Select
                value={formChannel}
                onValueChange={(v) => setFormChannel(v as Channel)}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                  {CHANNEL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder={selected?.placeholder ?? "account id"}
                value={formAccountId}
                onChange={(e) => setFormAccountId(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
              <Input
                placeholder="Label (optional — e.g. Pai Office LINE)"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
              />
              <Button
                onClick={handleAdd}
                disabled={adding || !formAccountId.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            {selected && (
              <div className="rounded border border-neutral-800 bg-neutral-950/40 p-3 space-y-2">
                <div className="text-xs text-neutral-400">{selected.help}</div>
                <WebhookHint
                  origin={siteOrigin}
                  path={selected.webhookPath}
                  envHints={selected.envHints}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function WebhookHint({
  origin,
  path,
  envHints,
}: {
  origin: string
  path: string
  envHints: string[]
}) {
  const [copied, setCopied] = useState(false)
  const url = origin ? `${origin}${path}` : path

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — user can copy manually */
    }
  }

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-neutral-500">Webhook URL:</span>
        <code className="font-mono text-neutral-200 truncate">{url}</code>
        <Button
          size="sm"
          variant="ghost"
          onClick={copy}
          className="h-6 px-1.5 text-neutral-400"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>
      {envHints.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-neutral-500">Required env vars:</span>
          {envHints.map((h) => (
            <code
              key={h}
              className="font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200"
            >
              {h}
            </code>
          ))}
        </div>
      )}
    </div>
  )
}
