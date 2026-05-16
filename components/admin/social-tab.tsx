"use client"

/**
 * Social tab — AI-driven social media composer + queue.
 *
 * Two main surfaces:
 *  1. Composer ("Ask OckOck") — operator types intent, picks platforms,
 *     AI generates per-platform variants, saves as draft for review.
 *  2. Queue — list of all posts (draft / scheduled / published) with
 *     filter tabs. Click any post to open its multi-platform editor.
 *
 * "Generate this week" button bulk-creates 7 varied drafts.
 *
 * Phase 1 doesn't auto-publish — operator copy/pastes or schedules
 * manually. Phase 2 will integrate with Buffer/Postiz or the platform
 * Graph APIs directly.
 */
import { useCallback, useEffect, useState } from "react"
import {
  Calendar,
  Check,
  Copy,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import {
  Surface,
  SectionHeader,
  SaasButton,
  SaasInput,
  SaasTextarea,
  SegmentedControl,
} from "@/components/saas"
import { InlineConfirm } from "@/components/ui/inline-confirm"
import {
  PLATFORM_LIST,
  PLATFORMS,
  platformPreview,
  type Platform,
  type SocialPost,
  type SocialPostContent,
} from "@/lib/social-platforms"

type FilterTab = "draft" | "scheduled" | "published"

export default function SocialTab() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>("draft")
  const [editingId, setEditingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/social/posts?status=${filter}&limit=100`,
        { cache: "no-store" },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load")
      setPosts((data.posts ?? []) as SocialPost[])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    refresh()
  }, [refresh])

  const counts = posts.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  if (editingId) {
    const post = posts.find((p) => p.id === editingId)
    if (!post) {
      setEditingId(null)
      return null
    }
    return (
      <PostEditor
        post={post}
        onClose={() => {
          setEditingId(null)
          refresh()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Social media"
        eyebrowIcon={Sparkles}
        size="lg"
        title="Talk to OckOck, post your week"
        subtitle="Type once, get drafts for every platform tuned to that platform's voice. Review, edit, schedule. Or hit 'generate the week' and let OckOck draft 7 varied posts in seconds."
      />

      <Composer onCreated={() => refresh()} />

      <div className="space-y-3">
        <SectionHeader
          eyebrow="Queue"
          title="Your posts"
          action={
            <FilterTabs filter={filter} onChange={setFilter} counts={counts} />
          }
        />

        {error && (
          <div className="rounded-xl ring-1 ring-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-300">
            {error}
            <p className="text-[11px] text-red-300/70 mt-1">
              If this is the first time, apply migration{" "}
              <code>scripts/035-add-social-posts.sql</code> in Supabase.
            </p>
          </div>
        )}

        {loading ? (
          <Surface>
            <div className="text-center py-12">
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
            </div>
          </Surface>
        ) : posts.length === 0 ? (
          <Surface>
            <div className="px-4 py-10 text-center">
              <MessageSquare className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
              <p className="text-[13px] text-zinc-300 font-medium">
                No {filter} posts yet
              </p>
              <p className="text-[12px] text-zinc-500 mt-1">
                {filter === "draft"
                  ? "Compose your first one above, or hit 'Generate the week'."
                  : filter === "scheduled"
                    ? "Posts you schedule will appear here."
                    : "Posts you've marked as published will appear here."}
              </p>
            </div>
          </Surface>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                onClick={() => setEditingId(post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── filter tabs ────────────────────────────────────────────────── */

function FilterTabs({
  filter,
  onChange,
  counts,
}: {
  filter: FilterTab
  onChange: (next: FilterTab) => void
  counts: Record<string, number>
}) {
  return (
    <div className="w-[280px]">
      <SegmentedControl<FilterTab>
        value={filter}
        onValueChange={onChange}
        options={[
          { value: "draft", label: `Drafts${counts.draft ? ` ${counts.draft}` : ""}` },
          { value: "scheduled", label: `Scheduled${counts.scheduled ? ` ${counts.scheduled}` : ""}` },
          { value: "published", label: `Published${counts.published ? ` ${counts.published}` : ""}` },
        ]}
      />
    </div>
  )
}

/* ─── composer ───────────────────────────────────────────────────── */

function Composer({ onCreated }: { onCreated: () => void }) {
  const [intent, setIntent] = useState("")
  const [tone, setTone] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    "instagram",
    "facebook",
  ])
  const [composing, setComposing] = useState(false)
  const [batching, setBatching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batchTheme, setBatchTheme] = useState("")
  const [batchCount, setBatchCount] = useState(7)
  const [showBatchOptions, setShowBatchOptions] = useState(false)

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    )
  }

  const compose = async () => {
    if (!intent.trim() || selectedPlatforms.length === 0) return
    setComposing(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/social/ai/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: intent.trim(),
          platforms: selectedPlatforms,
          tone: tone.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Compose failed")
      setIntent("")
      setTone("")
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setComposing(false)
    }
  }

  const generateBatch = async () => {
    if (selectedPlatforms.length === 0) return
    setBatching(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/social/ai/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: batchCount,
          platforms: selectedPlatforms,
          theme: batchTheme.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Batch generation failed")
      setBatchTheme("")
      setShowBatchOptions(false)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBatching(false)
    }
  }

  return (
    <Surface accent="indigo">
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
        <p className="text-[13px] font-medium text-white">Compose with OckOck</p>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <SaasTextarea
          rows={3}
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g. We have fight night Saturday. Phong is fighting at Lumpinee. Come cheer."
          disabled={composing || batching}
        />

        <div className="flex flex-wrap gap-2">
          {PLATFORM_LIST.map((def) => {
            const Icon = def.icon
            const active = selectedPlatforms.includes(def.id)
            return (
              <button
                key={def.id}
                onClick={() => togglePlatform(def.id)}
                disabled={composing || batching}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all active:scale-[0.97] disabled:opacity-50 ${
                  active
                    ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-500/30"
                    : "bg-zinc-900/60 text-zinc-500 hover:text-zinc-200 ring-1 ring-zinc-800"
                }`}
              >
                <Icon className="h-3 w-3" />
                {def.label}
              </button>
            )
          })}
        </div>

        <div className="grid sm:grid-cols-[1fr_auto] gap-2">
          <SaasInput
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="Voice (optional) — e.g. warm + traditional, gritty + elite"
            disabled={composing || batching}
          />
          <SaasButton
            onClick={compose}
            loading={composing}
            disabled={!intent.trim() || selectedPlatforms.length === 0 || batching}
          >
            <Send className="h-3 w-3" />
            Generate
          </SaasButton>
        </div>

        {error && (
          <div className="rounded-lg ring-1 ring-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
            {error}
          </div>
        )}

        {/* Batch generator */}
        <div className="border-t border-indigo-500/15 pt-3 space-y-2">
          <button
            onClick={() => setShowBatchOptions((s) => !s)}
            className="text-[12px] text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Or generate {batchCount} varied posts at once
          </button>

          {showBatchOptions && (
            <div className="space-y-2 pt-1">
              <div className="grid sm:grid-cols-[100px_1fr] gap-2 items-center">
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value) || 7)}
                  disabled={batching}
                  className="bg-zinc-950/50 ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500/50 rounded-lg px-3 py-2 text-[13px] text-zinc-100 outline-none transition-shadow disabled:opacity-50 tabular-nums"
                />
                <SaasInput
                  value={batchTheme}
                  onChange={(e) => setBatchTheme(e.target.value)}
                  placeholder="Optional steer — e.g. focus on beginners this week"
                  disabled={batching}
                />
              </div>
              <SaasButton
                onClick={generateBatch}
                loading={batching}
                disabled={selectedPlatforms.length === 0 || composing}
                className="w-full"
              >
                <Plus className="h-3 w-3" />
                Generate {batchCount} drafts
              </SaasButton>
            </div>
          )}
        </div>
      </div>
    </Surface>
  )
}

/* ─── post row in queue ──────────────────────────────────────────── */

function PostRow({
  post,
  onClick,
}: {
  post: SocialPost
  onClick: () => void
}) {
  // Pick the best preview text — first platform with content
  const firstPlatform = post.platforms[0]
  const preview = firstPlatform
    ? platformPreview(post.content, firstPlatform)
    : ""
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl ring-1 ring-zinc-900 bg-zinc-900/40 hover:bg-zinc-900/70 hover:ring-zinc-800 backdrop-blur-sm overflow-hidden transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 duration-200"
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="flex flex-col gap-1 shrink-0 mt-0.5">
          {post.platforms.slice(0, 4).map((p) => {
            const Icon = PLATFORMS[p].icon
            return (
              <span
                key={p}
                className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-zinc-800 ring-1 ring-zinc-700/40"
                title={PLATFORMS[p].label}
              >
                <Icon className="h-2.5 w-2.5 text-zinc-400" />
              </span>
            )
          })}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-zinc-200 line-clamp-2 leading-relaxed">
            {preview || (
              <span className="text-zinc-600">No content yet — tap to edit</span>
            )}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-600">
            {post.source === "ai_compose" && (
              <span className="inline-flex items-center gap-1 text-indigo-400/80">
                <Sparkles className="h-2.5 w-2.5" />
                OckOck
              </span>
            )}
            {post.source === "ai_batch" && (
              <span className="inline-flex items-center gap-1 text-indigo-400/80">
                <Sparkles className="h-2.5 w-2.5" />
                Batch
              </span>
            )}
            {post.scheduled_for && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                {new Date(post.scheduled_for).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
            {!post.scheduled_for && (
              <span>
                {new Date(post.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {post.source_intent && post.source !== "manual" && (
              <span className="text-zinc-700 truncate min-w-0">
                · {post.source_intent}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

/* ─── post editor ────────────────────────────────────────────────── */

function PostEditor({
  post,
  onClose,
}: {
  post: SocialPost
  onClose: () => void
}) {
  const [content, setContent] = useState<SocialPostContent>(post.content)
  const [scheduledFor, setScheduledFor] = useState(post.scheduled_for ?? "")
  const [activePlatform, setActivePlatform] = useState<Platform>(
    post.platforms[0] ?? "instagram",
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<Platform | null>(null)

  const platformsInPost = post.platforms

  const updateContent = (platform: Platform, key: string, value: unknown) => {
    setContent((prev) => ({
      ...prev,
      [platform]: { ...(prev[platform] ?? {}), [key]: value },
    }))
  }

  const save = async (status?: "draft" | "scheduled" | "published" | "archived") => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/social/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          status,
          scheduled_for:
            status === "scheduled" && scheduledFor
              ? new Date(scheduledFor).toISOString()
              : status === "draft"
                ? null
                : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Save failed")
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  const remove = async () => {
    // InlineConfirm handles the confirmation step inline.
    setSaving(true)
    try {
      await fetch(`/api/admin/social/posts/${post.id}`, { method: "DELETE" })
      onClose()
    } catch {
      setSaving(false)
    }
  }

  const copyContent = async (platform: Platform) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = content[platform] as any
    if (!c) return
    const text = c.caption || c.body || ""
    const hashtags = (c.hashtags || []).map((h: string) => `#${h}`).join(" ")
    const full = hashtags ? `${text}\n\n${hashtags}` : text
    try {
      await navigator.clipboard.writeText(full)
      setCopied(platform)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeContent = (content[activePlatform] as any) ?? {}

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="text-[12px] text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Close
        </button>
        <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-600">
          {post.source === "ai_compose" || post.source === "ai_batch"
            ? "AI-generated draft"
            : "Manual draft"}
        </span>
      </div>

      {post.source_intent && post.source !== "manual" && (
        <div className="rounded-xl ring-1 ring-indigo-500/20 bg-indigo-500/[0.04] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-indigo-400/80">
            Original intent
          </p>
          <p className="text-[13px] text-zinc-200 mt-1">{post.source_intent}</p>
        </div>
      )}

      {/* Platform tabs */}
      <div className="flex flex-wrap gap-2">
        {platformsInPost.map((p) => {
          const Icon = PLATFORMS[p].icon
          const active = activePlatform === p
          return (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all active:scale-[0.97] ${
                active
                  ? "bg-zinc-800 text-white ring-1 ring-zinc-700"
                  : "bg-zinc-900/40 text-zinc-500 hover:text-zinc-200 ring-1 ring-zinc-900"
              }`}
            >
              <Icon className="h-3 w-3" />
              {PLATFORMS[p].label}
            </button>
          )
        })}
      </div>

      {/* Per-platform editor */}
      <Surface>
        <div className="px-4 py-3 border-b border-zinc-900/80 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            {PLATFORMS[activePlatform].label}
          </p>
          <button
            onClick={() => copyContent(activePlatform)}
            className="text-[11px] text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1"
          >
            {copied === activePlatform ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="p-4 space-y-3">
          {(activePlatform === "instagram" || activePlatform === "tiktok") && (
            <>
              <Field label={activePlatform === "instagram" ? "Caption" : "Caption / hook"}>
                <SaasTextarea
                  rows={6}
                  value={activeContent.caption ?? ""}
                  onChange={(e) =>
                    updateContent(activePlatform, "caption", e.target.value)
                  }
                  disabled={saving}
                />
              </Field>
              <Field label="Hashtags (comma-separated)">
                <SaasInput
                  value={(activeContent.hashtags ?? []).join(", ")}
                  onChange={(e) =>
                    updateContent(
                      activePlatform,
                      "hashtags",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim().replace(/^#/, ""))
                        .filter(Boolean),
                    )
                  }
                  placeholder="muaythai, training, pai"
                  disabled={saving}
                />
              </Field>
              <p className="text-[11px] text-zinc-600">
                Length: {(activeContent.caption ?? "").length} /{" "}
                {PLATFORMS[activePlatform].maxChars}
              </p>
            </>
          )}
          {(activePlatform === "facebook" ||
            activePlatform === "line_oa" ||
            activePlatform === "threads" ||
            activePlatform === "twitter") && (
            <>
              <Field label="Body">
                <SaasTextarea
                  rows={activePlatform === "twitter" ? 3 : 6}
                  value={activeContent.body ?? ""}
                  onChange={(e) =>
                    updateContent(activePlatform, "body", e.target.value)
                  }
                  disabled={saving}
                />
              </Field>
              <p className="text-[11px] text-zinc-600">
                Length: {(activeContent.body ?? "").length} /{" "}
                {PLATFORMS[activePlatform].maxChars}
              </p>
            </>
          )}
        </div>
      </Surface>

      {/* Schedule + Actions */}
      <Surface>
        <div className="p-4 space-y-3">
          <Field label="Schedule for (optional)">
            <SaasInput
              type="datetime-local"
              value={
                scheduledFor
                  ? new Date(scheduledFor).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => setScheduledFor(e.target.value)}
              disabled={saving}
            />
          </Field>
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            Phase 1 doesn&apos;t auto-publish — schedule sets a reminder. Tap
            &ldquo;Copy&rdquo; on each platform tab to grab the text and post manually.
            Auto-posting via Meta/TikTok APIs is Phase 2.
          </p>
          {error && (
            <div className="rounded-lg ring-1 ring-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
              {error}
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <SaasButton onClick={() => save("draft")} loading={saving} variant="subtle">
              Save draft
            </SaasButton>
            {scheduledFor && (
              <SaasButton onClick={() => save("scheduled")} loading={saving}>
                <Calendar className="h-3 w-3" />
                Schedule
              </SaasButton>
            )}
            <SaasButton onClick={() => save("published")} loading={saving} variant="subtle">
              <Check className="h-3 w-3" />
              Mark published
            </SaasButton>
            <div className="ml-auto">
              <InlineConfirm
                onConfirm={remove}
                disabled={saving}
                title="Delete post"
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] text-zinc-400 hover:bg-zinc-800/60 hover:text-red-300 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </InlineConfirm>
            </div>
          </div>
        </div>
      </Surface>
    </div>
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
