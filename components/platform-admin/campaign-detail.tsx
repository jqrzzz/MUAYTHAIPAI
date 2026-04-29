"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  Sparkles,
  Send,
  Check,
  X,
  Trash2,
  Save,
  Eye,
  Pencil,
  AlertCircle,
} from "lucide-react"

interface Campaign {
  id: string
  name: string
  description: string | null
  channel: string
  target_filter: Record<string, unknown>
  subject_template: string | null
  body_template: string
  personalize_prompt: string | null
  personalize: boolean
  status: string
  from_name: string | null
  from_email: string | null
  total_targets: number
  total_drafted: number
  total_sent: number
  total_claimed: number
}

interface CampaignSend {
  id: string
  gym_id: string
  gym_name: string
  gym_city: string | null
  gym_province: string | null
  gym_ai_summary: string | null
  channel: string
  to_address: string | null
  subject: string | null
  body: string | null
  status: string
  drafted_at: string | null
  approved_at: string | null
  sent_at: string | null
  error: string | null
}

const SEND_STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-700 text-zinc-200",
  approved: "bg-emerald-900/60 text-emerald-200",
  rejected: "bg-zinc-800 text-zinc-500 line-through",
  skipped: "bg-zinc-800 text-zinc-500",
  sending: "bg-blue-900/60 text-blue-200",
  sent: "bg-orange-600 text-white",
  failed: "bg-red-900/60 text-red-200",
  opened: "bg-blue-700 text-white",
  clicked: "bg-purple-700 text-white",
  claimed: "bg-emerald-600 text-white",
}

export default function CampaignDetail({
  campaignId,
  onUpdated,
  onDeleted,
}: {
  campaignId: string
  onUpdated: () => void
  onDeleted: () => void
}) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [breakdown, setBreakdown] = useState<Record<string, number>>({})
  const [sends, setSends] = useState<CampaignSend[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [filterText, setFilterText] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editing, setEditing] = useState<Record<string, string>>({})

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([
        fetch(`/api/platform-admin/campaigns/${campaignId}`).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch(`/api/platform-admin/campaigns/${campaignId}/drafts`).then((r) =>
          r.ok ? r.json() : null
        ),
      ])
      setCampaign(c?.campaign || null)
      setBreakdown(c?.breakdown || {})
      setSends(s?.sends || [])
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    setFilterText(JSON.stringify(campaign?.target_filter ?? {}, null, 2))
  }, [campaign?.id])

  const save = async (patch: Partial<Campaign>) => {
    setSaving(true)
    setActionMsg(null)
    try {
      const res = await fetch(`/api/platform-admin/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) {
        setActionMsg(data.error || "Save failed")
      } else {
        setCampaign(data.campaign)
        onUpdated()
        setActionMsg("Saved.")
      }
    } finally {
      setSaving(false)
    }
  }

  const saveFilter = async () => {
    let parsed
    try {
      parsed = JSON.parse(filterText)
    } catch {
      setActionMsg("Filter is not valid JSON")
      return
    }
    await save({ target_filter: parsed })
  }

  const generateDrafts = async () => {
    setDrafting(true)
    setActionMsg(null)
    try {
      const res = await fetch(
        `/api/platform-admin/campaigns/${campaignId}/drafts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 5 }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setActionMsg(data.error || "Drafting failed")
      } else {
        setActionMsg(
          `Drafted ${data.generated}, skipped ${data.skipped}${
            data.failures?.length ? `, ${data.failures.length} failed` : ""
          } · ${data.remaining} eligible left`
        )
        fetchAll()
      }
    } finally {
      setDrafting(false)
    }
  }

  const updateSend = async (
    id: string,
    patch: Partial<{ status: string; subject: string; body: string }>
  ) => {
    const res = await fetch(
      `/api/platform-admin/campaigns/${campaignId}/sends/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }
    )
    if (res.ok) {
      const data = await res.json()
      setSends((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                ...patch,
                status: patch.status || s.status,
                approved_at:
                  patch.status === "approved"
                    ? new Date().toISOString()
                    : s.approved_at,
              }
            : s
        )
      )
    }
  }

  const sendApproved = async () => {
    setSending(true)
    setActionMsg(null)
    try {
      const res = await fetch(
        `/api/platform-admin/campaigns/${campaignId}/send-approved`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 10 }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setActionMsg(data.error || "Send failed")
      } else {
        setActionMsg(
          `Sent ${data.sent}, failed ${data.failed} · ${data.remaining} approved left`
        )
        fetchAll()
      }
    } finally {
      setSending(false)
    }
  }

  const deleteCampaign = async () => {
    if (
      !confirm(
        "Delete this campaign? All drafts and send records will be removed."
      )
    )
      return
    const res = await fetch(`/api/platform-admin/campaigns/${campaignId}`, {
      method: "DELETE",
    })
    if (res.ok) onDeleted()
  }

  if (loading || !campaign) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500" />
        </CardContent>
      </Card>
    )
  }

  const draftCount = breakdown["draft"] || 0
  const approvedCount = breakdown["approved"] || 0
  const filteredSends =
    statusFilter === "all" ? sends : sends.filter((s) => s.status === statusFilter)

  return (
    <div className="space-y-4">
      {/* Header / Settings */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <Input
                value={campaign.name}
                onChange={(e) =>
                  setCampaign((c) => (c ? { ...c, name: e.target.value } : c))
                }
                onBlur={() => save({ name: campaign.name })}
                className="bg-transparent border-0 text-lg font-semibold text-white p-0 h-auto focus-visible:ring-0"
              />
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  className={
                    SEND_STATUS_COLORS[campaign.status] ||
                    "bg-zinc-700 text-zinc-200"
                  }
                >
                  {campaign.status}
                </Badge>
                <span className="text-xs text-zinc-500">
                  {campaign.channel} · {campaign.total_targets} targets ·{" "}
                  {campaign.total_drafted} drafted · {campaign.total_sent} sent ·{" "}
                  {campaign.total_claimed} claimed
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-red-900 text-red-300"
              onClick={deleteCampaign}
              title="Delete campaign"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-zinc-400 hover:text-white">
              Edit template, filter & sender
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-zinc-400">Description</label>
                <Input
                  value={campaign.description || ""}
                  onChange={(e) =>
                    setCampaign((c) =>
                      c ? { ...c, description: e.target.value } : c
                    )
                  }
                  onBlur={() =>
                    save({ description: campaign.description || null })
                  }
                  className="bg-zinc-950 border-zinc-700 text-white text-sm mt-1"
                  placeholder="(optional internal note)"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400">From name</label>
                  <Input
                    value={campaign.from_name || ""}
                    onChange={(e) =>
                      setCampaign((c) =>
                        c ? { ...c, from_name: e.target.value } : c
                      )
                    }
                    onBlur={() => save({ from_name: campaign.from_name || null })}
                    className="bg-zinc-950 border-zinc-700 text-white text-sm mt-1"
                    placeholder="MUAYTHAIPAI Network"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">From email</label>
                  <Input
                    value={campaign.from_email || ""}
                    onChange={(e) =>
                      setCampaign((c) =>
                        c ? { ...c, from_email: e.target.value } : c
                      )
                    }
                    onBlur={() =>
                      save({ from_email: campaign.from_email || null })
                    }
                    className="bg-zinc-950 border-zinc-700 text-white text-sm mt-1"
                    placeholder="network@muaythaipai.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400">Subject template</label>
                <Input
                  value={campaign.subject_template || ""}
                  onChange={(e) =>
                    setCampaign((c) =>
                      c ? { ...c, subject_template: e.target.value } : c
                    )
                  }
                  onBlur={() =>
                    save({ subject_template: campaign.subject_template || null })
                  }
                  className="bg-zinc-950 border-zinc-700 text-white text-sm mt-1"
                  placeholder="{{gym_name}} — join the MUAYTHAIPAI network"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Body template</label>
                <Textarea
                  value={campaign.body_template}
                  onChange={(e) =>
                    setCampaign((c) =>
                      c ? { ...c, body_template: e.target.value } : c
                    )
                  }
                  onBlur={() => save({ body_template: campaign.body_template })}
                  rows={8}
                  className="bg-zinc-950 border-zinc-700 text-white text-xs font-mono mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400">
                  AI personalization note (optional — guides each rewrite)
                </label>
                <Textarea
                  value={campaign.personalize_prompt || ""}
                  onChange={(e) =>
                    setCampaign((c) =>
                      c ? { ...c, personalize_prompt: e.target.value } : c
                    )
                  }
                  onBlur={() =>
                    save({
                      personalize_prompt: campaign.personalize_prompt || null,
                    })
                  }
                  rows={2}
                  className="bg-zinc-950 border-zinc-700 text-white text-xs mt-1"
                  placeholder="e.g. lean into camp's pro-fighter angle if tagged 'fighter-focused'"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="personalize"
                  checked={campaign.personalize}
                  onChange={(e) => save({ personalize: e.target.checked })}
                />
                <label htmlFor="personalize" className="text-xs text-zinc-300">
                  Run each draft through Claude for natural per-gym wording
                </label>
              </div>
              <div>
                <label className="text-xs text-zinc-400">
                  Target filter (JSON) — keys: status, source, province, city,
                  has_website, has_extraction, has_email, ai_tags_any,
                  min_rating, limit
                </label>
                <Textarea
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  rows={6}
                  className="bg-zinc-950 border-zinc-700 text-white text-xs font-mono mt-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveFilter}
                  disabled={saving}
                  className="border-zinc-700 text-zinc-200 mt-2"
                >
                  <Save className="h-3 w-3 mr-1" /> Save filter
                </Button>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          size="sm"
          onClick={generateDrafts}
          disabled={drafting}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {drafting ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          Draft next 5
        </Button>
        {approvedCount > 0 && (
          <Button
            size="sm"
            onClick={sendApproved}
            disabled={sending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {sending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Send className="h-3 w-3 mr-1" />
            )}
            Send {approvedCount} approved
          </Button>
        )}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-white h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            <SelectItem value="all">All ({sends.length})</SelectItem>
            {Object.entries(breakdown).map(([s, c]) => (
              <SelectItem key={s} value={s}>
                {s} ({c})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {actionMsg && (
          <p className="text-xs text-zinc-400 whitespace-pre-wrap">{actionMsg}</p>
        )}
      </div>

      {/* Drafts queue */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-0">
          {sends.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No drafts yet</p>
              <p className="text-sm mt-1">
                Click <strong className="text-white">Draft next 5</strong> to
                generate AI-personalized messages.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800 max-h-[60vh] overflow-y-auto">
              {filteredSends.map((s) => {
                const isEditing = editing[s.id] != null
                return (
                  <div key={s.id} className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-white truncate">
                            {s.gym_name}
                          </p>
                          <Badge
                            className={`text-xs ${
                              SEND_STATUS_COLORS[s.status] ||
                              "bg-zinc-700 text-zinc-200"
                            }`}
                          >
                            {s.status}
                          </Badge>
                          {s.gym_city && (
                            <span className="text-xs text-zinc-500">
                              {s.gym_city}
                              {s.gym_province ? `, ${s.gym_province}` : ""}
                            </span>
                          )}
                        </div>
                        {s.to_address ? (
                          <p className="text-xs text-zinc-500 truncate">
                            → {s.to_address}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-400 inline-flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            No {s.channel} address
                          </p>
                        )}
                      </div>
                    </div>

                    {s.subject && (
                      <p className="text-sm text-zinc-200 font-medium">
                        {s.subject}
                      </p>
                    )}
                    {isEditing ? (
                      <Textarea
                        value={editing[s.id]}
                        onChange={(e) =>
                          setEditing((p) => ({ ...p, [s.id]: e.target.value }))
                        }
                        rows={6}
                        className="bg-zinc-950 border-zinc-700 text-white text-xs font-mono"
                      />
                    ) : (
                      s.body && (
                        <pre className="text-xs text-zinc-400 whitespace-pre-wrap bg-zinc-950 border border-zinc-800 rounded p-2 max-h-32 overflow-y-auto">
                          {s.body}
                        </pre>
                      )
                    )}
                    {s.error && (
                      <p className="text-xs text-red-400">{s.error}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600 h-7 text-xs"
                            onClick={async () => {
                              await updateSend(s.id, { body: editing[s.id] })
                              setEditing((p) => {
                                const next = { ...p }
                                delete next[s.id]
                                return next
                              })
                            }}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-zinc-400 h-7 text-xs"
                            onClick={() =>
                              setEditing((p) => {
                                const next = { ...p }
                                delete next[s.id]
                                return next
                              })
                            }
                          >
                            Cancel
                          </Button>
                        </>
                      ) : s.status === "draft" ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                            onClick={() => updateSend(s.id, { status: "approved" })}
                          >
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-700 text-zinc-300 h-7 text-xs"
                            onClick={() =>
                              setEditing((p) => ({ ...p, [s.id]: s.body || "" }))
                            }
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-zinc-500 h-7 text-xs"
                            onClick={() => updateSend(s.id, { status: "rejected" })}
                          >
                            <X className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </>
                      ) : s.status === "approved" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-zinc-400 h-7 text-xs"
                          onClick={() => updateSend(s.id, { status: "draft" })}
                        >
                          Unapprove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
