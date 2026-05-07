"use client"

/**
 * Waiver editor card — slots into /admin → Settings.
 *
 * Lets the gym owner publish the active liability waiver text. Each
 * publish creates a new version (versions are immutable for audit).
 * The card shows the version number, signature count, and a copy-link
 * for the public-facing /waivers/[slug] page they can share with
 * students before their first class.
 */

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Save,
} from "lucide-react"

const DEFAULT_TITLE = "Liability waiver and assumption of risk"
const DEFAULT_BODY = `By signing below I acknowledge that Muay Thai is a contact combat sport that carries inherent risks of injury, including but not limited to bruises, cuts, sprains, fractures, concussions, and other serious injuries.

I confirm that I am physically fit to participate in Muay Thai training and have disclosed any medical conditions, injuries, or limitations to the gym staff before participating.

I agree to follow all gym rules and the directions of the trainers at all times. I understand that failure to follow these rules may result in injury or removal from training.

I voluntarily assume all risks associated with Muay Thai training, sparring, and any related activities at this gym. I release the gym, its owners, trainers, staff, and other students from any and all liability for any injury, loss, or damage I may sustain while training or on the premises.

I confirm I am 18 years of age or older, or that a parent/guardian has consented to my participation if I am a minor.

By signing below, I confirm I have read this waiver in full and I agree to its terms.`

interface WaiverApiResponse {
  active: {
    id: string
    version: number
    title: string
    body: string
    created_at: string
    updated_at: string
  } | null
  signatures: number
  history: Array<{
    id: string
    version: number
    title: string
    created_at: string
    is_active: boolean
  }>
}

interface Props {
  gymSlug: string | null
}

export default function WaiverEditorCard({ gymSlug }: Props) {
  const [data, setData] = useState<WaiverApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/waivers", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to load")
      setData(json as WaiverApiResponse)
      if (json.active) {
        setTitle(json.active.title)
        setBody(json.active.body)
      } else {
        setTitle(DEFAULT_TITLE)
        setBody(DEFAULT_BODY)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function publish() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/waivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Publish failed")
      setEditing(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    if (!gymSlug) return
    const url = `${window.location.origin}/waivers/${gymSlug}`
    navigator.clipboard.writeText(url).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const publicUrl = gymSlug
    ? typeof window !== "undefined"
      ? `${window.location.origin}/waivers/${gymSlug}`
      : `/waivers/${gymSlug}`
    : null

  return (
    <Card className="bg-neutral-900/50 border-neutral-800">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-300" />
              Liability waiver
            </CardTitle>
            <CardDescription>
              Required reading before a student&apos;s first class. They sign
              once, on file forever. Edit the text any time — every change
              creates a new version with full audit trail.
            </CardDescription>
          </div>
          {data?.active && !editing && (
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shrink-0">
              v{data.active.version} · {data.signatures} signature
              {data.signatures === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-6 text-center text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
            Loading…
          </div>
        ) : editing ? (
          <>
            <div>
              <Label className="text-neutral-300">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
                disabled={saving}
              />
            </div>
            <div>
              <Label className="text-neutral-300">Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={16}
                className="bg-neutral-800 border-neutral-700 text-white mt-1 font-mono text-sm leading-relaxed"
                disabled={saving}
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Plain text. Line breaks preserved. Students see this verbatim.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={publish}
                disabled={
                  saving || !title.trim() || body.trim().length < 50
                }
                className="bg-indigo-500 hover:bg-indigo-400 text-white"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                {data?.active ? "Publish new version" : "Publish waiver"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(false)
                  if (data?.active) {
                    setTitle(data.active.title)
                    setBody(data.active.body)
                  }
                }}
                disabled={saving}
                className="text-neutral-400"
              >
                Cancel
              </Button>
            </div>
          </>
        ) : data?.active ? (
          <>
            <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-3 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-neutral-300 leading-relaxed">
              <p className="font-semibold text-white mb-2">
                {data.active.title}
              </p>
              {data.active.body}
            </div>
            {publicUrl && (
              <div className="rounded-md bg-indigo-500/[0.04] border border-indigo-500/20 p-3">
                <p className="text-xs text-neutral-400 mb-2">
                  Share this link with students before their first class:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-indigo-200 truncate bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
                    {publicUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyLink}
                    className="shrink-0 text-indigo-200 hover:text-indigo-200"
                  >
                    {linkCopied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-indigo-200 hover:text-indigo-200 text-xs inline-flex items-center"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="border-neutral-700 bg-transparent text-neutral-300 hover:text-white"
            >
              Edit waiver text
            </Button>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-neutral-700 p-5 text-center">
            <FileText className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-400 mb-3">
              No waiver published yet. Add one before your first new
              student trains — it&apos;s the standard for any combat sport.
            </p>
            <Button
              onClick={() => setEditing(true)}
              className="bg-indigo-500 hover:bg-indigo-400 text-white"
            >
              Set up waiver
            </Button>
            <p className="text-[11px] text-neutral-500 mt-3">
              We&apos;ve pre-filled a Muay Thai-specific template — you can
              edit before publishing.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
