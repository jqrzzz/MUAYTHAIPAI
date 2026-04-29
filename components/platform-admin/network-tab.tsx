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
  Search,
  MapPin,
  Globe,
  Phone,
  Star,
  Sparkles,
  Loader2,
  RefreshCw,
  Wrench,
  Send,
  Check,
  X,
  Trash2,
  Link as LinkIcon,
  Copy,
  Map,
} from "lucide-react"

type DiscoveryStatus =
  | "pending"
  | "reviewed"
  | "verified"
  | "invited"
  | "onboarded"
  | "ignored"
  | "duplicate"

interface GooglePhoto {
  name?: string
  width?: number
  height?: number
}

interface DiscoveredGymRow {
  id: string
  source: string
  source_query: string | null
  name: string
  name_th: string | null
  city: string | null
  province: string | null
  country: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  line_id: string | null
  google_place_id: string | null
  google_rating: number | null
  google_review_count: number | null
  google_photos: GooglePhoto[] | null
  ai_summary: string | null
  ai_tags: string[] | null
  status: DiscoveryStatus
  linked_org_id: string | null
  invited_at: string | null
  claimed_at: string | null
  last_crawled_at: string | null
  last_extracted_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

const STALE_DAYS = 30

function isStale(gym: { last_crawled_at: string | null; source: string }) {
  if (gym.source === "manual" || gym.source === "claude_research") return false
  if (!gym.last_crawled_at) return true
  const ageMs = Date.now() - new Date(gym.last_crawled_at).getTime()
  return ageMs > STALE_DAYS * 86400_000
}

const STATUS_COLORS: Record<DiscoveryStatus, string> = {
  pending: "bg-zinc-700 text-zinc-200",
  reviewed: "bg-blue-900/60 text-blue-200",
  verified: "bg-emerald-900/60 text-emerald-200",
  invited: "bg-amber-900/60 text-amber-200",
  onboarded: "bg-orange-600 text-white",
  ignored: "bg-zinc-800 text-zinc-500",
  duplicate: "bg-zinc-800 text-zinc-500 line-through",
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "verified", label: "Verified" },
  { value: "invited", label: "Invited" },
  { value: "onboarded", label: "Onboarded" },
  { value: "ignored", label: "Ignored" },
  { value: "duplicate", label: "Duplicate" },
]

const SOURCE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All sources" },
  { value: "google", label: "Google" },
  { value: "firecrawl", label: "Firecrawl" },
  { value: "claude_research", label: "Claude research" },
  { value: "manual", label: "Manual" },
]

export default function NetworkTab() {
  const [gyms, setGyms] = useState<DiscoveredGymRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<DiscoveredGymRow | null>(null)

  // Discovery dialog state
  const [discoverOpen, setDiscoverOpen] = useState(false)
  const [discoverMode, setDiscoverMode] = useState<"google" | "research" | "bulk">("google")
  const [discoverQuery, setDiscoverQuery] = useState("")
  const [discoverHint, setDiscoverHint] = useState("")
  const [bulkText, setBulkText] = useState("")
  const [discovering, setDiscovering] = useState(false)
  const [discoverResult, setDiscoverResult] = useState<string | null>(null)

  const fetchGyms = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (sourceFilter !== "all") params.set("source", sourceFilter)
      if (search.trim()) params.set("q", search.trim())
      const res = await fetch(`/api/platform-admin/discovery?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setGyms(data.gyms || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }, [statusFilter, sourceFilter, search])

  useEffect(() => {
    fetchGyms()
  }, [fetchGyms])

  const runDiscovery = async () => {
    if (discoverMode === "bulk") {
      const items = bulkText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
      if (items.length === 0) return
      setDiscovering(true)
      setDiscoverResult(null)
      try {
        const res = await fetch("/api/platform-admin/discovery/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        })
        const data = await res.json()
        if (!res.ok) {
          setDiscoverResult(data.error || "Bulk import failed")
        } else {
          const errors = (data.results || []).filter((r: { ok: boolean }) => !r.ok)
          setDiscoverResult(
            `${data.processed} processed • ${data.added} new • ${data.updated} updated${
              errors.length ? ` • ${errors.length} errors` : ""
            }`
          )
        }
        fetchGyms()
      } catch (err) {
        setDiscoverResult(err instanceof Error ? err.message : "Bulk import failed")
      } finally {
        setDiscovering(false)
      }
      return
    }

    if (!discoverQuery.trim()) return
    setDiscovering(true)
    setDiscoverResult(null)
    try {
      const endpoint =
        discoverMode === "google"
          ? "/api/platform-admin/discovery/google-places"
          : "/api/platform-admin/discovery/find-more"
      const body =
        discoverMode === "google"
          ? { query: discoverQuery.trim() }
          : { region: discoverQuery.trim(), hint: discoverHint.trim() || undefined }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setDiscoverResult(data.error || "Discovery failed")
      } else if (discoverMode === "google") {
        setDiscoverResult(
          `${data.total_places} places found • ${data.inserted} new • ${data.updated} updated`
        )
      } else {
        setDiscoverResult(
          `${data.candidates} suggested • ${data.verified} verified via Google • ${data.unverified} unverified${
            data.notes ? `\n${data.notes}` : ""
          }`
        )
      }
      fetchGyms()
    } catch (err) {
      setDiscoverResult(err instanceof Error ? err.message : "Discovery failed")
    } finally {
      setDiscovering(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-orange-500" />
          <div>
            <h2 className="text-lg font-semibold text-white">Network</h2>
            <p className="text-sm text-zinc-400">
              Discovered gyms — review, verify, invite. {total} total.
            </p>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-200"
            onClick={fetchGyms}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => {
              setDiscoverOpen(true)
              setDiscoverResult(null)
            }}
          >
            <Sparkles className="h-4 w-4 mr-1" /> Discover
          </Button>
        </div>
      </div>

      {discoverOpen && (
        <Card className="border-orange-900 bg-zinc-950">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2 text-xs">
              {(["google", "research", "bulk"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setDiscoverMode(m)}
                  className={`px-3 py-1.5 rounded-full ${
                    discoverMode === m
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {m === "google"
                    ? "Google Places"
                    : m === "research"
                      ? "Claude research"
                      : "Bulk paste"}
                </button>
              ))}
              <button
                onClick={() => setDiscoverOpen(false)}
                className="ml-auto text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {discoverMode === "bulk" ? (
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={6}
                placeholder={`One per line — queries OR website URLs:\nmuay thai gym chiang mai\nmuay thai phuket\nhttps://tigermuaythai.com\nhttps://example-gym.com`}
                className="bg-zinc-900 border-zinc-700 text-white text-sm font-mono"
              />
            ) : (
              <>
                <Input
                  value={discoverQuery}
                  onChange={(e) => setDiscoverQuery(e.target.value)}
                  placeholder={
                    discoverMode === "google"
                      ? 'e.g. "muay thai gym chiang mai"'
                      : 'e.g. "Phuket" or "Pai, Mae Hong Son"'
                  }
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
                {discoverMode === "research" && (
                  <Input
                    value={discoverHint}
                    onChange={(e) => setDiscoverHint(e.target.value)}
                    placeholder="Optional hint (e.g. 'fight team only', 'tourist area')"
                    className="bg-zinc-900 border-zinc-700 text-white"
                  />
                )}
              </>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={runDiscovery}
                disabled={
                  discovering ||
                  (discoverMode === "bulk" ? !bulkText.trim() : !discoverQuery.trim())
                }
                className="bg-orange-500 hover:bg-orange-600"
              >
                {discovering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" /> Run
                  </>
                )}
              </Button>
              {discoverResult && (
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{discoverResult}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-2.5 top-3 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, address…"
            className="bg-zinc-900 border-zinc-700 text-white pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
            {SOURCE_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500" />
              </div>
            ) : gyms.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Map className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No discovered gyms yet</p>
                <p className="text-sm mt-1">Hit Discover to start crawling.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800 max-h-[70vh] overflow-y-auto">
                {gyms.map((gym) => (
                  <button
                    key={gym.id}
                    onClick={() => setSelected(gym)}
                    className={`w-full text-left p-3 hover:bg-zinc-800/50 transition ${
                      selected?.id === gym.id ? "bg-zinc-800/70" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-white truncate">{gym.name}</p>
                          <Badge className={`text-xs ${STATUS_COLORS[gym.status]}`}>
                            {gym.status}
                          </Badge>
                        </div>
                        {gym.name_th && (
                          <p className="text-xs text-zinc-500">{gym.name_th}</p>
                        )}
                        <p className="text-xs text-zinc-400 mt-1 flex items-center gap-3 flex-wrap">
                          {gym.city && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {gym.city}
                              {gym.province ? `, ${gym.province}` : ""}
                            </span>
                          )}
                          {gym.google_rating != null && (
                            <span className="inline-flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {gym.google_rating.toFixed(1)} ({gym.google_review_count})
                            </span>
                          )}
                          {gym.website && (
                            <span className="inline-flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              site
                            </span>
                          )}
                          <span className="text-zinc-600">{gym.source}</span>
                          {isStale(gym) && (
                            <span
                              title={`Last crawled ${gym.last_crawled_at ? new Date(gym.last_crawled_at).toLocaleDateString() : "never"}`}
                              className="inline-flex items-center gap-1 text-amber-500/80"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              stale
                            </span>
                          )}
                        </p>
                        {gym.ai_summary && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                            {gym.ai_summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <DetailPanel
          gym={selected}
          onUpdated={(updated) => {
            setSelected(updated)
            fetchGyms()
          }}
          onDeleted={() => {
            setSelected(null)
            fetchGyms()
          }}
        />
      </div>
    </div>
  )
}

function DetailPanel({
  gym,
  onUpdated,
  onDeleted,
}: {
  gym: DiscoveredGymRow | null
  onUpdated: (g: DiscoveredGymRow) => void
  onDeleted: () => void
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  useEffect(() => {
    setNotesDraft(gym?.notes || "")
    setInviteEmail("")
    setInviteUrl(null)
    setActionMsg(null)
  }, [gym?.id])

  if (!gym) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="text-center py-12 text-zinc-500">
          Select a gym to view detail.
        </CardContent>
      </Card>
    )
  }

  const patchStatus = async (status: DiscoveryStatus) => {
    setBusy(status)
    try {
      const res = await fetch(`/api/platform-admin/discovery/${gym.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const data = await res.json()
        onUpdated(data.gym)
      }
    } finally {
      setBusy(null)
    }
  }

  const saveNotes = async () => {
    setBusy("notes")
    try {
      const res = await fetch(`/api/platform-admin/discovery/${gym.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      })
      if (res.ok) {
        const data = await res.json()
        onUpdated(data.gym)
        setActionMsg("Notes saved.")
      }
    } finally {
      setBusy(null)
    }
  }

  const enrich = async () => {
    setBusy("firecrawl")
    setActionMsg(null)
    try {
      const res = await fetch("/api/platform-admin/discovery/firecrawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gym.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setActionMsg(`Firecrawl: ${data.error}${data.detail ? " — " + data.detail : ""}`)
      } else {
        setActionMsg(`Scraped ${data.bytes} bytes${data.title ? ` — ${data.title}` : ""}`)
        // Auto-extract after scrape
        await extract()
      }
    } finally {
      setBusy(null)
    }
  }

  const extract = async () => {
    setBusy("extract")
    try {
      const res = await fetch("/api/platform-admin/discovery/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gym.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setActionMsg(`Extract: ${data.error}${data.detail ? " — " + data.detail : ""}`)
      } else {
        // Refetch full row
        const refreshed = await fetch(`/api/platform-admin/discovery/${gym.id}`)
        if (refreshed.ok) {
          const r = await refreshed.json()
          onUpdated(r.gym)
        }
        setActionMsg(`Extracted via ${data.model}`)
      }
    } finally {
      setBusy(null)
    }
  }

  const sendInvite = async () => {
    setBusy("invite")
    setInviteUrl(null)
    try {
      const res = await fetch("/api/platform-admin/discovery/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gym.id, email: inviteEmail || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setActionMsg(`Invite: ${data.error}`)
      } else {
        setInviteUrl(data.invite_url)
        setActionMsg(data.message)
        const refreshed = await fetch(`/api/platform-admin/discovery/${gym.id}`)
        if (refreshed.ok) {
          const r = await refreshed.json()
          onUpdated(r.gym)
        }
      }
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    if (!confirm(`Delete "${gym.name}" from discovered gyms?`)) return
    setBusy("delete")
    try {
      const res = await fetch(`/api/platform-admin/discovery/${gym.id}`, {
        method: "DELETE",
      })
      if (res.ok) onDeleted()
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardContent className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-white">{gym.name}</h3>
              {gym.name_th && <p className="text-sm text-zinc-500">{gym.name_th}</p>}
            </div>
            <Badge className={STATUS_COLORS[gym.status]}>{gym.status}</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">{gym.source}</p>
        </div>

        <div className="space-y-1.5 text-sm text-zinc-300">
          {gym.city && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-zinc-500 shrink-0" />
              {gym.city}
              {gym.province ? `, ${gym.province}` : ""}
              {gym.country ? `, ${gym.country}` : ""}
            </p>
          )}
          {gym.phone && (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-zinc-500 shrink-0" />
              {gym.phone}
            </p>
          )}
          {gym.website && (
            <p className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-zinc-500 shrink-0" />
              <a
                href={gym.website}
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 hover:underline truncate"
              >
                {gym.website}
              </a>
            </p>
          )}
          {gym.google_rating != null && (
            <p className="flex items-center gap-2">
              <Star className="h-4 w-4 text-zinc-500 shrink-0" />
              {gym.google_rating.toFixed(1)} • {gym.google_review_count} reviews
            </p>
          )}
          {gym.lat != null && gym.lng != null && (
            <a
              href={`https://www.google.com/maps?q=${gym.lat},${gym.lng}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-orange-400 hover:underline"
            >
              Open in Maps
            </a>
          )}
        </div>

        {gym.google_photos && gym.google_photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {gym.google_photos.slice(0, 6).map((photo, i) =>
              photo.name ? (
                <img
                  key={i}
                  src={`/api/platform-admin/discovery/photo?name=${encodeURIComponent(
                    photo.name
                  )}&w=240`}
                  alt=""
                  className="h-20 w-28 object-cover rounded border border-zinc-800 shrink-0 bg-zinc-950"
                  loading="lazy"
                />
              ) : null
            )}
          </div>
        )}

        {gym.ai_summary && (
          <div className="rounded bg-zinc-950 border border-zinc-800 p-3">
            <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> AI summary
            </p>
            <p className="text-sm text-zinc-200">{gym.ai_summary}</p>
            {gym.ai_tags && gym.ai_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {gym.ai_tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 text-zinc-200"
            onClick={enrich}
            disabled={busy !== null || !gym.website}
          >
            {busy === "firecrawl" ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Wrench className="h-3 w-3 mr-1" />
            )}
            Enrich
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 text-zinc-200"
            onClick={extract}
            disabled={busy !== null}
          >
            {busy === "extract" ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            Re-extract
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-800 text-emerald-200"
            onClick={() => patchStatus("verified")}
            disabled={busy !== null}
          >
            <Check className="h-3 w-3 mr-1" /> Verify
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 text-zinc-400"
            onClick={() => patchStatus("ignored")}
            disabled={busy !== null}
          >
            <X className="h-3 w-3 mr-1" /> Ignore
          </Button>
        </div>

        <div className="space-y-2 border-t border-zinc-800 pt-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Invite</p>
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={gym.email || "owner@gym.com"}
            className="bg-zinc-950 border-zinc-700 text-white text-sm"
          />
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 w-full"
            onClick={sendInvite}
            disabled={busy !== null}
          >
            {busy === "invite" ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Send className="h-3 w-3 mr-1" />
            )}
            {gym.invited_at ? "Re-issue invite link" : "Generate invite"}
          </Button>
          {inviteUrl && (
            <div className="rounded bg-zinc-950 border border-zinc-800 p-2 flex items-center gap-2">
              <LinkIcon className="h-3 w-3 text-zinc-500 shrink-0" />
              <code className="text-xs text-zinc-300 truncate flex-1">{inviteUrl}</code>
              <button
                onClick={() => navigator.clipboard?.writeText(inviteUrl)}
                className="text-zinc-400 hover:text-white"
                title="Copy"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          )}
          {gym.invited_at && (
            <p className="text-xs text-zinc-500">
              Invited {new Date(gym.invited_at).toLocaleDateString()}
              {gym.claimed_at && " • Claimed"}
            </p>
          )}
        </div>

        <div className="space-y-2 border-t border-zinc-800 pt-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Notes</p>
          <Textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={3}
            className="bg-zinc-950 border-zinc-700 text-white text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 text-zinc-200"
            onClick={saveNotes}
            disabled={busy !== null}
          >
            Save notes
          </Button>
        </div>

        {actionMsg && (
          <p className="text-xs text-zinc-400 whitespace-pre-wrap">{actionMsg}</p>
        )}

        <div className="border-t border-zinc-800 pt-3">
          <Button
            size="sm"
            variant="outline"
            className="border-red-900 text-red-300 w-full"
            onClick={remove}
            disabled={busy !== null}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
