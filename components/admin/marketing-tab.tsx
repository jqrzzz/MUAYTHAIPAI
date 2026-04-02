"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Send,
  Copy,
  Check,
  RefreshCw,
  UserX,
  Sparkles,
  MessageSquare,
  Instagram,
  Video,
  Camera,
  Zap,
} from "lucide-react"

const OCKOCK_AVATAR = "/images/ockock-avatar.png"

interface InactiveStudent {
  userId: string
  name: string
  email: string
  lastBooking: string
  daysSince: number
}

interface ContentIdea {
  type: string
  caption: string
}

interface WeeklyStats {
  totalBookings: number
  completed: number
  totalStudents: number
  inactiveCount: number
}

export default function MarketingTab({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(true)
  const [inactiveStudents, setInactiveStudents] = useState<InactiveStudent[]>([])
  const [gymName, setGymName] = useState("")
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)

  // Re-engagement state
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [generatedMessages, setGeneratedMessages] = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [dismissedStudents, setDismissedStudents] = useState<Set<string>>(new Set())

  // Content ideas state
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([])
  const [generatingContent, setGeneratingContent] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState<number | null>(null)

  // Lead reply state
  const [leadMessage, setLeadMessage] = useState("")
  const [leadReply, setLeadReply] = useState("")
  const [generatingReply, setGeneratingReply] = useState(false)
  const [copiedReply, setCopiedReply] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/marketing")
      if (res.ok) {
        const data = await res.json()
        setInactiveStudents(data.inactiveStudents || [])
        setGymName(data.gymName || "")
        setWeeklyStats(data.weeklyStats || null)
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false)
    }
  }

  async function generateReEngageMessage(student: InactiveStudent) {
    setGeneratingFor(student.userId)
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "re-engage",
          context: { studentName: student.name, daysSince: student.daysSince },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedMessages((prev) => ({ ...prev, [student.userId]: data.message }))
      }
    } catch {
      // Fallback
    } finally {
      setGeneratingFor(null)
    }
  }

  async function generateContentIdeas() {
    setGeneratingContent(true)
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "content-ideas",
          context: { weeklyStats },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setContentIdeas(data.ideas || [])
      }
    } catch {
      // Fallback
    } finally {
      setGeneratingContent(false)
    }
  }

  async function generateLeadReply() {
    if (!leadMessage.trim()) return
    setGeneratingReply(true)
    setLeadReply("")
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lead-reply",
          context: { customerMessage: leadMessage },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setLeadReply(data.reply || "")
      }
    } catch {
      setLeadReply("Sorry, couldn't generate a reply. Please try again.")
    } finally {
      setGeneratingReply(false)
    }
  }

  function copyToClipboard(text: string, id: string | number) {
    navigator.clipboard.writeText(text)
    if (typeof id === "number") {
      setCopiedCaption(id)
      setTimeout(() => setCopiedCaption(null), 2000)
    } else {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  function dismissStudent(userId: string) {
    setDismissedStudents((prev) => new Set(prev).add(userId))
  }

  const contentTypeIcon = (type: string) => {
    switch (type) {
      case "reel": case "video": return <Video className="w-3.5 h-3.5" />
      case "story": return <Zap className="w-3.5 h-3.5" />
      default: return <Camera className="w-3.5 h-3.5" />
    }
  }

  const visibleInactive = inactiveStudents.filter((s) => !dismissedStudents.has(s.userId))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Image
          src={OCKOCK_AVATAR}
          alt="OckOck"
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <h2 className="text-lg font-bold text-white">Marketing Agents</h2>
          <p className="text-xs text-neutral-500">AI-powered tools to grow {gymName}</p>
        </div>
      </div>

      {/* Quick Stats */}
      {weeklyStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 px-4 py-3 text-center">
            <p className="text-xl font-bold text-white">{weeklyStats.totalBookings}</p>
            <p className="text-[10px] text-neutral-500">This Week</p>
          </div>
          <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 px-4 py-3 text-center">
            <p className="text-xl font-bold text-white">{weeklyStats.completed}</p>
            <p className="text-[10px] text-neutral-500">Completed</p>
          </div>
          <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 px-4 py-3 text-center">
            <p className="text-xl font-bold text-white">{weeklyStats.totalStudents}</p>
            <p className="text-[10px] text-neutral-500">All Students</p>
          </div>
          <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 px-4 py-3 text-center">
            <p className="text-xl font-bold text-orange-400">{weeklyStats.inactiveCount}</p>
            <p className="text-[10px] text-neutral-500">Inactive 14d+</p>
          </div>
        </div>
      )}

      {/* === SECTION 1: Lead Inbox === */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-orange-400" />
            <h3 className="font-semibold text-white text-sm">Lead Inbox</h3>
            <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px]">AI Reply</Badge>
          </div>
          <p className="text-xs text-neutral-500 mb-3">
            Paste a customer message from WhatsApp, Facebook, or Instagram. OckOck drafts a reply.
          </p>

          <div className="space-y-3">
            <textarea
              value={leadMessage}
              onChange={(e) => setLeadMessage(e.target.value)}
              placeholder="e.g. Hi, how much for private lessons? I'm in Pai next week"
              rows={3}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50 resize-none"
            />

            <Button
              onClick={generateLeadReply}
              disabled={generatingReply || !leadMessage.trim()}
              className="bg-orange-600 hover:bg-orange-500"
              size="sm"
            >
              {generatingReply ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />Drafting...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-1.5" />Generate Reply</>
              )}
            </Button>

            {leadReply && (
              <div className="rounded-lg bg-neutral-800/50 border border-neutral-700 p-3">
                <div className="flex items-start gap-2">
                  <Image src={OCKOCK_AVATAR} alt="OckOck" width={24} height={24} className="rounded-full flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-neutral-200 whitespace-pre-wrap flex-1">{leadReply}</p>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-700 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(leadReply)
                      setCopiedReply(true)
                      setTimeout(() => setCopiedReply(false), 2000)
                    }}
                  >
                    {copiedReply ? <><Check className="w-3 h-3 mr-1" />Copied</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-700 text-xs"
                    onClick={generateLeadReply}
                    disabled={generatingReply}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />Regenerate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* === SECTION 2: Re-engagement === */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserX className="w-4 h-4 text-orange-400" />
              <h3 className="font-semibold text-white text-sm">Re-engage Students</h3>
              {visibleInactive.length > 0 && (
                <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px]">
                  {visibleInactive.length}
                </Badge>
              )}
            </div>
          </div>

          {visibleInactive.length === 0 ? (
            <div className="text-center py-6">
              <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">All students are active!</p>
              <p className="text-xs text-neutral-600 mt-1">No one has been away more than 14 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleInactive.slice(0, 8).map((student) => (
                <div
                  key={student.userId}
                  className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{student.name}</p>
                      <p className="text-[10px] text-neutral-500">
                        Last visit: {new Date(student.lastBooking).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" · "}{student.daysSince} days ago
                      </p>
                    </div>
                    <Badge
                      className={`text-[10px] ${
                        student.daysSince > 30
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {student.daysSince}d inactive
                    </Badge>
                  </div>

                  {generatedMessages[student.userId] ? (
                    <div className="rounded-lg bg-neutral-900/50 p-2.5 mt-2">
                      <div className="flex items-start gap-2">
                        <Image src={OCKOCK_AVATAR} alt="" width={20} height={20} className="rounded-full flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-neutral-300 whitespace-pre-wrap flex-1">
                          {generatedMessages[student.userId]}
                        </p>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-neutral-700 text-[10px] h-7 px-2"
                          onClick={() => copyToClipboard(generatedMessages[student.userId], student.userId)}
                        >
                          {copiedId === student.userId ? <><Check className="w-3 h-3 mr-1" />Copied</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-neutral-700 text-[10px] h-7 px-2"
                          onClick={() => dismissStudent(student.userId)}
                        >
                          Skip
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => generateReEngageMessage(student)}
                        disabled={generatingFor === student.userId}
                        className="bg-orange-600/80 hover:bg-orange-500 text-xs h-7"
                      >
                        {generatingFor === student.userId ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Sparkles className="w-3 h-3 mr-1" />
                        )}
                        Draft Message
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-neutral-700 text-xs h-7"
                        onClick={() => dismissStudent(student.userId)}
                      >
                        Skip
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {visibleInactive.length > 8 && (
                <p className="text-xs text-neutral-600 text-center">
                  +{visibleInactive.length - 8} more inactive students
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* === SECTION 3: Content Ideas === */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-orange-400" />
              <h3 className="font-semibold text-white text-sm">Content Ideas</h3>
            </div>
            <Button
              size="sm"
              onClick={generateContentIdeas}
              disabled={generatingContent}
              className="bg-orange-600/80 hover:bg-orange-500 text-xs h-7"
            >
              {generatingContent ? (
                <><Loader2 className="w-3 h-3 animate-spin mr-1" />Generating...</>
              ) : (
                <><Sparkles className="w-3 h-3 mr-1" />{contentIdeas.length > 0 ? "New Ideas" : "Generate"}</>
              )}
            </Button>
          </div>

          {contentIdeas.length === 0 && !generatingContent ? (
            <div className="text-center py-6">
              <Sparkles className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Generate social media post ideas</p>
              <p className="text-xs text-neutral-600 mt-1">OckOck creates captions based on your gym's activity</p>
            </div>
          ) : generatingContent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {contentIdeas.map((idea, idx) => (
                <div key={idx} className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-neutral-500">{contentTypeIcon(idea.type)}</span>
                    <Badge className="bg-neutral-700/50 text-neutral-300 border-neutral-600 text-[10px] capitalize">
                      {idea.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-200 whitespace-pre-wrap">{idea.caption}</p>
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-neutral-700 text-[10px] h-7 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(idea.caption)
                        setCopiedCaption(idx)
                        setTimeout(() => setCopiedCaption(null), 2000)
                      }}
                    >
                      {copiedCaption === idx ? <><Check className="w-3 h-3 mr-1" />Copied</> : <><Copy className="w-3 h-3 mr-1" />Copy Caption</>}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
