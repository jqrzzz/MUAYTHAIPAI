"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Check, Volume2 } from "lucide-react"

interface Persona {
  voice: string | null
  greeting: string | null
  language_mode: string
  guidelines: string | null
}

const LANGUAGE_OPTIONS = [
  { value: "thai_first", label: "Thai first, then mirror the customer" },
  { value: "english_first", label: "English first, then mirror the customer" },
  { value: "mirror", label: "Mirror the customer's language (no default)" },
]

export default function OckockVoiceCard() {
  const [voice, setVoice] = useState("")
  const [greeting, setGreeting] = useState("")
  const [languageMode, setLanguageMode] = useState("thai_first")
  const [guidelines, setGuidelines] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/admin/ai-persona", { cache: "no-store" })
        if (!res.ok) throw new Error("failed")
        const d = await res.json()
        const p: Persona = d.persona ?? {}
        setVoice(p.voice ?? "")
        setGreeting(p.greeting ?? "")
        setLanguageMode(p.language_mode ?? "thai_first")
        setGuidelines(p.guidelines ?? "")
      } catch {
        setError("Couldn't load OckOck's voice settings.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch("/api/admin/ai-persona", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice, greeting, language_mode: languageMode, guidelines }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Couldn't save")
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-neutral-900/50 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-indigo-300" /> OckOck&apos;s Voice
        </CardTitle>
        <CardDescription>
          How OckOck sounds when it answers your customers. Leave blank for the friendly default.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex h-24 items-center justify-center text-sm text-neutral-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-neutral-200">Personality &amp; tone</Label>
              <Textarea
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                maxLength={1200}
                placeholder="e.g., Relaxed and friendly, like a training buddy. We're a small family gym in the mountains — warm, never salesy. A little playful is good."
                className="bg-neutral-800 border-neutral-700 text-white min-h-[90px]"
              />
              <p className="text-[11px] text-neutral-500">
                Describe the vibe in your own words. The safety rules (no made-up facts, escalate when
                unsure, no false promises) always apply on top of this.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-neutral-200">Opening line (optional)</Label>
                <Input
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  maxLength={200}
                  placeholder="Sawadee! Welcome to our gym 🙏"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-200">Language</Label>
                <Select value={languageMode} onValueChange={setLanguageMode}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-200">House rules (optional)</Label>
              <Textarea
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
                maxLength={1500}
                placeholder="Always-do / never-do. e.g., Always offer the free trial class. Never quote discounts. Mention the Wai Kru tradition when someone asks about our culture."
                className="bg-neutral-800 border-neutral-700 text-white min-h-[80px]"
              />
            </div>

            {error && <p className="text-[12px] text-red-400">{error}</p>}

            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving} className="bg-indigo-500 hover:bg-indigo-400">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Save voice
              </Button>
              {saved && (
                <span className="text-[12px] text-emerald-400">
                  Saved — OckOck uses this from the next message.
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
