"use client"

/**
 * Website tab — the gym's live editing surface for their public site.
 *
 * Layout:
 *   ┌──────────────────────────────┬──────────────┐
 *   │ Sections list + section edit │              │
 *   │                              │ Live preview │
 *   ├──────────────────────────────┤              │
 *   │ OckOck chat ("change my X")  │              │
 *   └──────────────────────────────┴──────────────┘
 *
 * On mobile this stacks: live preview on top (collapsible), then editor.
 */
import { useCallback, useEffect, useState } from "react"
import {
  Eye,
  EyeOff,
  Globe,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  ExternalLink,
} from "lucide-react"
import {
  Surface,
  SectionHeader,
  SaasButton,
  SaasInput,
  SaasTextarea,
} from "@/components/saas"
import type {
  GymWebsite,
  WebsiteSection,
  WebsiteTheme,
} from "@/lib/website-sections"

interface AiTurn {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions?: any[] | null
  created_at: string
}

interface Props {
  gymSlug: string | null
}

export default function WebsiteTab({ gymSlug }: Props) {
  const [website, setWebsite] = useState<GymWebsite | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState(0)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/website", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load website")
      setWebsite(data.website as GymWebsite)
      if (
        data.website?.sections?.length &&
        !selectedSectionId
      ) {
        setSelectedSectionId(data.website.sections[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [selectedSectionId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function persist(patch: Partial<GymWebsite>) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/website", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Save failed")
      setWebsite(data.website as GymWebsite)
      setPreviewKey((k) => k + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async () => {
    if (!website) return
    const next = website.status === "published" ? "draft" : "published"
    await persist({ status: next })
  }

  const updateSection = async (id: string, props: Record<string, unknown>) => {
    if (!website) return
    const sections = website.sections.map((s) =>
      s.id === id ? ({ ...s, props: { ...s.props, ...props } } as WebsiteSection) : s,
    )
    await persist({ sections })
  }

  const updateTheme = async (theme: Partial<WebsiteTheme>) => {
    if (!website) return
    await persist({ theme: { ...website.theme, ...theme } })
  }

  if (loading && !website) {
    return (
      <Surface>
        <div className="text-center py-16">
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
        </div>
      </Surface>
    )
  }

  if (error || !website) {
    return (
      <Surface>
        <div className="text-center py-12 text-[13px] text-zinc-500 px-4">
          {error || "No website loaded."}
          <p className="text-[11px] text-zinc-600 mt-2">
            Make sure migration <code>scripts/034-add-gym-websites.sql</code> has
            been applied in Supabase.
          </p>
        </div>
      </Surface>
    )
  }

  const selectedSection = website.sections.find((s) => s.id === selectedSectionId)
  const publicUrl = gymSlug
    ? typeof window !== "undefined"
      ? `${window.location.origin}/gyms/${gymSlug}`
      : `/gyms/${gymSlug}`
    : null
  const previewUrl = gymSlug
    ? `/gyms/${gymSlug}?preview=1`
    : null

  return (
    <div className="space-y-5">
      {/* Header — title + publish state */}
      <SectionHeader
        eyebrow="Website"
        eyebrowIcon={Globe}
        size="lg"
        title="Your gym's online home"
        subtitle="Talk to OckOck below, or edit any section directly. Changes save automatically and stay in draft until you publish."
        action={
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] px-2 py-1 rounded-md ring-1 ${
                website.status === "published"
                  ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                  : "bg-amber-500/10 text-amber-300 ring-amber-500/20"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  website.status === "published"
                    ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                    : "bg-amber-400"
                }`}
              />
              {website.status}
            </span>
            <SaasButton
              variant={website.status === "published" ? "subtle" : "primary"}
              size="sm"
              onClick={togglePublish}
              loading={saving}
            >
              {website.status === "published" ? (
                <>
                  <EyeOff className="h-3 w-3" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  Publish
                </>
              )}
            </SaasButton>
          </div>
        }
      />

      {/* Editor + Preview side-by-side */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Editor column — sections + form + AI chat */}
        <div className="lg:col-span-3 space-y-4">
          <Surface>
            <div className="px-4 py-3 border-b border-zinc-900/80 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Sections
              </p>
              <p className="text-[10px] text-zinc-600">
                {website.sections.length} total
              </p>
            </div>
            <ul className="divide-y divide-zinc-900/80 max-h-64 overflow-y-auto">
              {website.sections.map((section, idx) => (
                <li key={section.id}>
                  <button
                    onClick={() => setSelectedSectionId(section.id)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                      selectedSectionId === section.id
                        ? "bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/20"
                        : "hover:bg-zinc-900/40"
                    }`}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-zinc-800 ring-1 ring-zinc-700/60 text-zinc-500 text-[10px] font-semibold tabular-nums shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-zinc-200 capitalize">
                        {section.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-[11px] text-zinc-600 truncate">
                        {sectionPreview(section)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Surface>

          {/* Section editor */}
          {selectedSection && (
            <Surface>
              <div className="px-4 py-3 border-b border-zinc-900/80">
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                  Editing
                </p>
                <p className="text-[14px] font-medium text-white capitalize mt-0.5">
                  {selectedSection.type.replace(/_/g, " ")} section
                </p>
              </div>
              <div className="p-4 space-y-3">
                <SectionEditor
                  section={selectedSection}
                  onChange={(props) => updateSection(selectedSection.id, props)}
                  saving={saving}
                />
              </div>
            </Surface>
          )}

          {/* AI chat */}
          <AiChat onWebsiteUpdated={(w) => {
            setWebsite(w)
            setPreviewKey((k) => k + 1)
          }} />
        </div>

        {/* Live preview column */}
        <div className="lg:col-span-2">
          <Surface className="lg:sticky lg:top-20">
            <div className="px-4 py-3 border-b border-zinc-900/80 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Live preview
              </p>
              {publicUrl && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1"
                >
                  Open
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {previewUrl ? (
              <iframe
                key={previewKey}
                src={previewUrl}
                className="w-full bg-white"
                style={{ height: "560px", border: 0 }}
                title="Website preview"
              />
            ) : (
              <div className="px-4 py-12 text-center text-[12px] text-zinc-500">
                Your gym needs a slug before we can preview the site.
              </div>
            )}
            {website.status === "draft" && (
              <p className="px-4 py-2 text-[11px] text-zinc-600 border-t border-zinc-900/80">
                Preview shows the draft. Visitors won&apos;t see the site until you publish.
              </p>
            )}
          </Surface>
        </div>
      </div>

      {/* Theme — moved to bottom, less primary */}
      <ThemeEditor theme={website.theme} onChange={updateTheme} saving={saving} />
    </div>
  )
}

/* ─── section editor ─────────────────────────────────────────────── */

function SectionEditor({
  section,
  onChange,
  saving,
}: {
  section: WebsiteSection
  onChange: (props: Record<string, unknown>) => void
  saving: boolean
}) {
  // Local state for typing without spamming the server
  const [local, setLocal] = useState<Record<string, unknown>>(
    section.props as Record<string, unknown>,
  )
  useEffect(() => {
    setLocal(section.props as Record<string, unknown>)
  }, [section.id, section.props])

  const updateLocal = (key: string, value: unknown) => {
    setLocal((p) => ({ ...p, [key]: value }))
  }

  const commit = () => {
    onChange(local)
  }

  if (section.type === "hero") {
    const props = local as { title?: string; subtitle?: string; image_url?: string | null; cta_label?: string | null; cta_href?: string | null }
    return (
      <>
        <Field label="Title">
          <SaasInput
            value={props.title ?? ""}
            onChange={(e) => updateLocal("title", e.target.value)}
            onBlur={commit}
            disabled={saving}
            placeholder="e.g. Authentic Muay Thai in your city"
          />
        </Field>
        <Field label="Subtitle">
          <SaasInput
            value={props.subtitle ?? ""}
            onChange={(e) => updateLocal("subtitle", e.target.value)}
            onBlur={commit}
            disabled={saving}
            placeholder="e.g. Train with our experienced team"
          />
        </Field>
        <Field label="Hero image URL">
          <SaasInput
            value={props.image_url ?? ""}
            onChange={(e) => updateLocal("image_url", e.target.value)}
            onBlur={commit}
            disabled={saving}
            placeholder="https://… (or leave blank)"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CTA label">
            <SaasInput
              value={props.cta_label ?? ""}
              onChange={(e) => updateLocal("cta_label", e.target.value)}
              onBlur={commit}
              disabled={saving}
            />
          </Field>
          <Field label="CTA href">
            <SaasInput
              value={props.cta_href ?? ""}
              onChange={(e) => updateLocal("cta_href", e.target.value)}
              onBlur={commit}
              disabled={saving}
            />
          </Field>
        </div>
      </>
    )
  }

  if (section.type === "about" || section.type === "rich_text") {
    const props = local as { heading?: string; body?: string }
    return (
      <>
        <Field label="Heading">
          <SaasInput
            value={props.heading ?? ""}
            onChange={(e) => updateLocal("heading", e.target.value)}
            onBlur={commit}
            disabled={saving}
          />
        </Field>
        <Field label="Body">
          <SaasTextarea
            rows={8}
            value={props.body ?? ""}
            onChange={(e) => updateLocal("body", e.target.value)}
            onBlur={commit}
            disabled={saving}
          />
        </Field>
      </>
    )
  }

  if (section.type === "cta") {
    const props = local as { heading?: string; body?: string; primary_label?: string; primary_href?: string }
    return (
      <>
        <Field label="Heading">
          <SaasInput
            value={props.heading ?? ""}
            onChange={(e) => updateLocal("heading", e.target.value)}
            onBlur={commit}
            disabled={saving}
          />
        </Field>
        <Field label="Body">
          <SaasInput
            value={props.body ?? ""}
            onChange={(e) => updateLocal("body", e.target.value)}
            onBlur={commit}
            disabled={saving}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button label">
            <SaasInput
              value={props.primary_label ?? ""}
              onChange={(e) => updateLocal("primary_label", e.target.value)}
              onBlur={commit}
              disabled={saving}
            />
          </Field>
          <Field label="Button link">
            <SaasInput
              value={props.primary_href ?? ""}
              onChange={(e) => updateLocal("primary_href", e.target.value)}
              onBlur={commit}
              disabled={saving}
            />
          </Field>
        </div>
      </>
    )
  }

  if (section.type === "hours" || section.type === "contact" || section.type === "classes" || section.type === "trainers") {
    const props = local as { heading?: string }
    return (
      <>
        <Field label="Heading">
          <SaasInput
            value={props.heading ?? ""}
            onChange={(e) => updateLocal("heading", e.target.value)}
            onBlur={commit}
            disabled={saving}
          />
        </Field>
        <p className="text-[11px] text-zinc-500">
          Content for this section is pulled from your gym&apos;s data
          (services, trainers, settings, etc.). Edit those tabs to change
          what shows here.
        </p>
      </>
    )
  }

  if (section.type === "lead_form") {
    const props = local as {
      heading?: string
      subtitle?: string
      success_message?: string
      submit_label?: string
      require_phone?: boolean
    }
    return (
      <>
        <Field label="Heading">
          <SaasInput
            value={props.heading ?? ""}
            onChange={(e) => updateLocal("heading", e.target.value)}
            onBlur={commit}
            disabled={saving}
            placeholder="Get in touch"
          />
        </Field>
        <Field label="Subtitle">
          <SaasInput
            value={props.subtitle ?? ""}
            onChange={(e) => updateLocal("subtitle", e.target.value)}
            onBlur={commit}
            disabled={saving}
            placeholder="Send us a message — we'll reply within a day."
          />
        </Field>
        <Field label="Success message">
          <SaasInput
            value={props.success_message ?? ""}
            onChange={(e) => updateLocal("success_message", e.target.value)}
            onBlur={commit}
            disabled={saving}
            placeholder="Thanks! We'll be in touch soon."
          />
        </Field>
        <Field label="Submit button label">
          <SaasInput
            value={props.submit_label ?? ""}
            onChange={(e) => updateLocal("submit_label", e.target.value)}
            onBlur={commit}
            disabled={saving}
            placeholder="Send message"
          />
        </Field>
        <label className="flex items-center gap-2 text-[12px] text-zinc-300 select-none">
          <input
            type="checkbox"
            checked={!!props.require_phone}
            onChange={(e) => {
              updateLocal("require_phone", e.target.checked)
              onChange({ ...local, require_phone: e.target.checked })
            }}
            disabled={saving}
            className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900"
          />
          Require phone number
        </label>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Submissions go straight to <strong className="text-zinc-300">/admin → Inbox</strong> with an AI-drafted reply ready for you to review and approve.
        </p>
      </>
    )
  }

  return (
    <p className="text-[12px] text-zinc-500">
      The {section.type} section editor isn&apos;t built yet — but you can
      still ask OckOck to change it below.
    </p>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      {children}
    </div>
  )
}

function sectionPreview(section: WebsiteSection): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = section.props as any
  if (props.title) return props.title
  if (props.heading) return props.heading
  if (props.body) return String(props.body).slice(0, 60) + "…"
  return ""
}

/* ─── theme editor ───────────────────────────────────────────────── */

function ThemeEditor({
  theme,
  onChange,
  saving,
}: {
  theme: WebsiteTheme
  onChange: (next: Partial<WebsiteTheme>) => void
  saving: boolean
}) {
  return (
    <Surface>
      <div className="px-4 py-3 border-b border-zinc-900/80">
        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          Theme
        </p>
        <p className="text-[12px] text-zinc-500 mt-0.5">
          Set the primary color and logo. Affects the whole public site.
        </p>
      </div>
      <div className="p-4 grid sm:grid-cols-2 gap-3">
        <Field label="Primary color">
          <div className="flex gap-2">
            <input
              type="color"
              value={theme.primary_color ?? "#6366f1"}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              disabled={saving}
              className="h-10 w-10 rounded-lg bg-zinc-950/50 ring-1 ring-zinc-800 cursor-pointer disabled:opacity-50"
            />
            <SaasInput
              value={theme.primary_color ?? ""}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              placeholder="#6366f1"
              disabled={saving}
            />
          </div>
        </Field>
        <Field label="Logo URL">
          <SaasInput
            value={theme.logo_url ?? ""}
            onChange={(e) => onChange({ logo_url: e.target.value })}
            placeholder="https://…"
            disabled={saving}
          />
        </Field>
      </div>
    </Surface>
  )
}

/* ─── AI chat ────────────────────────────────────────────────────── */

function AiChat({
  onWebsiteUpdated,
}: {
  onWebsiteUpdated: (w: GymWebsite) => void
}) {
  const [history, setHistory] = useState<AiTurn[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/website/ai", { cache: "no-store" })
      const data = await res.json()
      if (res.ok) setHistory(data.turns ?? [])
    } catch {
      // silent — chat hydration is non-critical
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const send = async () => {
    const message = input.trim()
    if (!message || sending) return
    setInput("")
    setError(null)
    const tempUserTurn: AiTurn = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    }
    setHistory((p) => [...p, tempUserTurn])
    setSending(true)
    try {
      const res = await fetch("/api/admin/website/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Request failed")
      setHistory((p) => [
        ...p,
        {
          id: `temp-asst-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          actions: data.actions,
          created_at: new Date().toISOString(),
        },
      ])
      if (data.website) onWebsiteUpdated(data.website as GymWebsite)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <Surface>
      <div className="px-4 py-3 border-b border-zinc-900/80 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
        <p className="text-[13px] font-medium text-white">Ask OckOck</p>
        <p className="text-[11px] text-zinc-500 ml-auto hidden sm:inline">
          Type anything. OckOck edits live.
        </p>
      </div>
      <div className="max-h-[280px] overflow-y-auto px-4 py-3 space-y-2">
        {history.length === 0 && !sending && (
          <div className="text-center py-6">
            <MessageCircle className="h-5 w-5 text-zinc-700 mx-auto mb-2" />
            <p className="text-[12px] text-zinc-500 mb-3">
              Try saying:
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setInput(p)}
                  className="text-[11px] rounded-full border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {history.map((turn) => (
          <div
            key={turn.id}
            className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap ${
                turn.role === "user"
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-800/80 text-zinc-100 ring-1 ring-zinc-800"
              }`}
            >
              {turn.content}
              {turn.actions && Array.isArray(turn.actions) && turn.actions.length > 0 && (
                <p className="mt-1.5 pt-1.5 border-t border-zinc-700/60 text-[10px] text-zinc-400">
                  {turn.actions.length} edit{turn.actions.length === 1 ? "" : "s"} applied
                </p>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-zinc-800/80 ring-1 ring-zinc-800 text-zinc-400 rounded-2xl px-3 py-2 text-[12px] flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="mx-4 mb-3 rounded-lg ring-1 ring-red-500/20 bg-red-500/10 text-red-300 text-[11px] px-3 py-1.5">
          {error}
        </div>
      )}
      <div className="border-t border-zinc-900/80 p-2.5 bg-zinc-950/40">
        <div className="flex gap-2 items-end">
          <SaasTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Change my hours, rewrite my about, add a testimonial…"
            rows={1}
            disabled={sending}
            className="flex-1 ring-0 bg-transparent"
            style={{ minHeight: 36 }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-colors shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Surface>
  )
}

const STARTER_PROMPTS = [
  "Make my about section more friendly",
  "Add a testimonials section",
  "Change my hero subtitle to focus on beginners",
  "Make my CTA stronger",
]
