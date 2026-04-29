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
  Megaphone,
  Plus,
  Loader2,
  Mail,
  RefreshCw,
  ArrowLeft,
} from "lucide-react"
import CampaignDetail from "./campaign-detail"

interface CampaignRow {
  id: string
  name: string
  description: string | null
  channel: string
  status: string
  total_targets: number
  total_drafted: number
  total_sent: number
  total_claimed: number
  created_at: string
  sent_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-700 text-zinc-200",
  drafting: "bg-blue-900/60 text-blue-200",
  review: "bg-amber-900/60 text-amber-200",
  sending: "bg-orange-600 text-white",
  sent: "bg-emerald-900/60 text-emerald-200",
  archived: "bg-zinc-800 text-zinc-500",
}

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [newForm, setNewForm] = useState({
    name: "",
    channel: "email",
    body_template: "",
  })
  const [newError, setNewError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/platform-admin/campaigns")
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const createCampaign = async () => {
    if (!newForm.name.trim() || !newForm.body_template.trim()) return
    setCreating(true)
    setNewError(null)
    try {
      const res = await fetch("/api/platform-admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setNewError(data.error || "Failed")
      } else {
        setNewOpen(false)
        setNewForm({ name: "", channel: "email", body_template: "" })
        await fetchAll()
        setSelectedId(data.campaign.id)
      }
    } finally {
      setCreating(false)
    }
  }

  if (selectedId) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => {
            setSelectedId(null)
            fetchAll()
          }}
          className="text-sm text-zinc-400 hover:text-white inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> All campaigns
        </button>
        <CampaignDetail
          campaignId={selectedId}
          onUpdated={fetchAll}
          onDeleted={() => {
            setSelectedId(null)
            fetchAll()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-orange-500" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">Campaigns</h2>
          <p className="text-sm text-zinc-400">
            Structured outreach to discovered gyms — AI-personalized,
            operator-approved.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 text-zinc-200"
          onClick={fetchAll}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button
          size="sm"
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => setNewOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      {newOpen && (
        <Card className="border-orange-700/40 bg-orange-500/5">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs text-zinc-400">Name</label>
              <Input
                value={newForm.name}
                onChange={(e) =>
                  setNewForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder='e.g. "Naga ladder Q2 push"'
                className="bg-zinc-900 border-zinc-700 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Channel</label>
              <Select
                value={newForm.channel}
                onValueChange={(v) => setNewForm((p) => ({ ...p, channel: v }))}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="line">LINE (later)</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp (later)</SelectItem>
                  <SelectItem value="test">Test (no real send)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-zinc-400">
                Body template — supports {"{{gym_name}}"}, {"{{city}}"},{" "}
                {"{{ai_summary}}"}
              </label>
              <Textarea
                value={newForm.body_template}
                onChange={(e) =>
                  setNewForm((p) => ({ ...p, body_template: e.target.value }))
                }
                rows={6}
                placeholder={`Sawadee from MUAYTHAIPAI Network,\n\nWe noticed {{gym_name}} in {{city}} and wanted to invite you to join our country-wide certification platform...\n\nCould we set up a quick chat?`}
                className="bg-zinc-900 border-zinc-700 text-white mt-1 font-mono text-xs"
              />
            </div>
            {newError && (
              <p className="text-xs text-red-400">{newError}</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={createCampaign}
                disabled={
                  creating || !newForm.name.trim() || !newForm.body_template.trim()
                }
                className="bg-orange-500 hover:bg-orange-600"
              >
                {creating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setNewOpen(false)}
                disabled={creating}
                className="text-zinc-400"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No campaigns yet</p>
              <p className="text-sm mt-1">
                Create one to start AI-drafted outreach.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {campaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="w-full text-left p-3 hover:bg-zinc-800/50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white truncate">
                          {c.name}
                        </p>
                        <Badge
                          className={`text-xs ${
                            STATUS_COLORS[c.status] || "bg-zinc-700 text-zinc-200"
                          }`}
                        >
                          {c.status}
                        </Badge>
                        <span className="text-xs text-zinc-500">{c.channel}</span>
                      </div>
                      {c.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">
                          {c.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-zinc-400 mt-1">
                        <span>{c.total_targets} target{c.total_targets === 1 ? "" : "s"}</span>
                        <span>·</span>
                        <span>{c.total_drafted} drafted</span>
                        <span>·</span>
                        <span>{c.total_sent} sent</span>
                        {c.total_claimed > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-orange-400">
                              {c.total_claimed} claimed
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
