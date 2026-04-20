"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Calendar,
  Instagram,
  Facebook,
  Video,
  FileText,
  Mail,
  Plus,
  CheckCircle,
} from "lucide-react"

interface SocialPost {
  id: string
  platform: string[]
  content_type: string
  caption: string
  hashtags: string[]
  media_url: string | null
  status: string
  scheduled_for: string | null
  posted_at: string | null
  campaign: string | null
  ai_generated: boolean
  created_at: string
}

interface ContentStudioProps {
  mode: "platform" | "gym"
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "tiktok", label: "TikTok", icon: Video },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "email", label: "Email", icon: Mail },
]

const CONTENT_TYPES = [
  { id: "post", label: "Post" },
  { id: "story", label: "Story" },
  { id: "reel", label: "Reel" },
  { id: "blog", label: "Blog Article" },
  { id: "email", label: "Email" },
]

export default function ContentStudio({ mode }: ContentStudioProps) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<"all" | "draft" | "scheduled" | "posted">("all")
  const [showComposer, setShowComposer] = useState(false)

  const [topic, setTopic] = useState("")
  const [platform, setPlatform] = useState("instagram")
  const [contentType, setContentType] = useState("post")
  const [campaign, setCampaign] = useState("")

  const [generatedCaption, setGeneratedCaption] = useState("")
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([])
  const [editedCaption, setEditedCaption] = useState("")

  useEffect(() => {
    fetchPosts()
  }, [activeFilter])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeFilter !== "all") params.set("status", activeFilter)
      const res = await fetch(`/api/content-studio?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/content-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          topic: topic || undefined,
          platform,
          contentType,
          campaign: campaign || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedCaption(data.caption)
        setGeneratedHashtags(data.hashtags || [])
        setEditedCaption(data.caption)
      }
    } catch {
      // silent
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async (status: "draft" | "scheduled") => {
    if (!editedCaption.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/content-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          caption: editedCaption,
          hashtags: generatedHashtags,
          platform: [platform],
          contentType,
          campaign: campaign || undefined,
          status,
          aiGenerated: true,
          aiPrompt: topic || "auto-generated",
        }),
      })

      if (res.ok) {
        setShowComposer(false)
        setGeneratedCaption("")
        setEditedCaption("")
        setGeneratedHashtags([])
        setTopic("")
        setCampaign("")
        fetchPosts()
      }
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const handleMarkPosted = async (postId: string) => {
    await fetch("/api/content-studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-status", postId, status: "posted" }),
    })
    fetchPosts()
  }

  const handleDelete = async (postId: string) => {
    await fetch("/api/content-studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", postId }),
    })
    fetchPosts()
  }

  const handleCopy = (text: string, id: string) => {
    const hashtagText = generatedHashtags.length > 0 && id === "composer"
      ? `\n\n${generatedHashtags.map((h) => `#${h}`).join(" ")}`
      : ""
    navigator.clipboard.writeText(text + hashtagText)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopyPost = (post: SocialPost) => {
    const hashtagText = post.hashtags.length > 0
      ? `\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}`
      : ""
    navigator.clipboard.writeText(post.caption + hashtagText)
    setCopiedId(post.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredPosts = posts.filter((p) => activeFilter === "all" || p.status === activeFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Content Studio</h2>
          <p className="text-sm text-neutral-400">
            {mode === "platform" ? "Create content for MUAYTHAIPAI" : "AI-powered content for your gym"}
          </p>
        </div>
        <Button
          onClick={() => setShowComposer(!showComposer)}
          className="bg-orange-600 hover:bg-orange-500"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Create
        </Button>
      </div>

      {/* Composer */}
      {showComposer && (
        <Card className="bg-neutral-900/50 border-orange-500/30">
          <CardContent className="p-5 space-y-4">
            {/* Platform + Type row */}
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2 flex-1 min-w-[200px]">
                <Label className="text-neutral-300 text-xs">Platform</Label>
                <div className="flex gap-1.5">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          platform === p.id
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                            : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-white"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300 text-xs">Type</Label>
                <div className="flex gap-1.5">
                  {CONTENT_TYPES.filter((t) =>
                    platform === "blog" ? t.id === "blog"
                    : platform === "email" ? t.id === "email"
                    : !["blog", "email"].includes(t.id)
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setContentType(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        contentType === t.id
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                          : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Topic + Campaign */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <Label className="text-neutral-300 text-xs">Topic (optional — AI will pick one if blank)</Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. behind the scenes training, student spotlight, certification journey..."
                  className="bg-neutral-800 border-neutral-700 text-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-neutral-300 text-xs">Campaign</Label>
                <Input
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="e.g. Summer Training"
                  className="bg-neutral-800 border-neutral-700 text-white text-sm"
                />
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Content
            </Button>

            {/* Generated content */}
            {generatedCaption && (
              <div className="space-y-3 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-400">Edit before saving:</p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(editedCaption, "composer")}
                      className="text-neutral-400 hover:text-white h-7 px-2"
                    >
                      {copiedId === "composer" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="text-neutral-400 hover:text-white h-7 px-2"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>

                <Textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  className="bg-neutral-800 border-neutral-700 text-white min-h-[120px] text-sm"
                />

                {generatedHashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {generatedHashtags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 cursor-pointer hover:bg-blue-500/20"
                        onClick={() => {
                          setGeneratedHashtags((prev) => prev.filter((t) => t !== tag))
                        }}
                      >
                        #{tag} ×
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSave("draft")}
                    disabled={saving}
                    variant="outline"
                    className="border-neutral-700 text-neutral-300"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Save Draft
                  </Button>
                  <Button
                    onClick={() => handleSave("scheduled")}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-500"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Queue
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {(["all", "draft", "scheduled", "posted"] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === filter
                ? "bg-orange-500/20 text-orange-400"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
            {filter !== "all" && (
              <span className="ml-1 text-neutral-600">
                {posts.filter((p) => p.status === filter).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="p-8 text-center">
            <Sparkles className="mx-auto mb-2 h-8 w-8 text-neutral-600" />
            <p className="text-neutral-400">
              {activeFilter === "all" ? "No content yet" : `No ${activeFilter} content`}
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              Hit Create to generate your first post with AI
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Media thumbnail */}
                  {post.media_url && (
                    <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700">
                      <img
                        src={post.media_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Status + platform + type badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        post.status === "posted"
                          ? "bg-green-500/10 text-green-400"
                          : post.status === "scheduled"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-neutral-800 text-neutral-400"
                      }`}>
                        {post.status}
                      </span>
                      {post.platform.map((p) => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500">
                          {p}
                        </span>
                      ))}
                      <span className="text-[10px] text-neutral-600">
                        {post.content_type}
                      </span>
                      {post.campaign && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                          {post.campaign}
                        </span>
                      )}
                      {post.ai_generated && (
                        <Sparkles className="h-3 w-3 text-amber-500/50" />
                      )}
                    </div>

                    {/* Caption preview */}
                    <p className="text-sm text-neutral-200 whitespace-pre-wrap line-clamp-4">
                      {post.caption}
                    </p>

                    {/* Hashtags */}
                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.hashtags.slice(0, 6).map((tag) => (
                          <span key={tag} className="text-[10px] text-blue-400/60">#{tag}</span>
                        ))}
                        {post.hashtags.length > 6 && (
                          <span className="text-[10px] text-neutral-600">+{post.hashtags.length - 6}</span>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-neutral-600">
                      {new Date(post.created_at).toLocaleDateString()}
                      {post.posted_at && ` · Posted ${new Date(post.posted_at).toLocaleDateString()}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyPost(post)}
                      className="text-neutral-400 hover:text-white h-8 w-8 p-0"
                    >
                      {copiedId === post.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    {post.status !== "posted" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkPosted(post.id)}
                        className="text-green-400 hover:text-green-300 h-8 w-8 p-0"
                        title="Mark as posted"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {post.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
