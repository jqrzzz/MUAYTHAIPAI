"use client"

/**
 * Pending skill-demo review queue, rendered at the top of the
 * Certificates tab in /admin. Operators see all student-submitted clips
 * waiting on a verdict.
 *
 * Approve → creates a skill_signoffs row (handled server-side) so the
 * student's progress dashboard and the verify page update immediately.
 * Reject / send back → student is notified and may resubmit.
 */
import { useCallback, useEffect, useState } from "react"
import {
  Video,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react"

interface Submission {
  id: string
  student_id: string
  level: string
  level_name: string
  skill_index: number
  skill_name: string
  video_url: string
  student_notes: string | null
  status: string
  created_at: string
  student: { id: string; full_name: string | null; email: string | null } | null
}

type Decision = "approved" | "rejected" | "sent_back"

export default function SkillReviewsPanel() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reviewerNotes, setReviewerNotes] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/skill-reviews?status=pending")
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
      }
    } catch {
      // silent — empty queue is the most common state
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const decide = async (id: string, status: Decision) => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/skill-reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewer_notes: reviewerNotes[id]?.trim() || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to record decision")
      }
      // Optimistically remove from the queue
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
      setReviewerNotes((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setActiveId(null)
    } catch (err) {
      setError((err as Error).message)
    }
    setBusyId(null)
  }

  if (loading && submissions.length === 0) {
    return null
  }

  if (!loading && submissions.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04]">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-amber-400" />
          <h3 className="font-display text-[15px] text-white">
            Skill demonstrations awaiting review
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 tabular-nums">
            {submissions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              fetchPending()
            }}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 inline-flex items-center gap-1"
          >
            <RefreshCcw className="w-3 h-3" />
            Refresh
          </button>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-neutral-500" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          {error && (
            <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded px-2 py-1">
              {error}
            </div>
          )}
          {submissions.map((s) => {
            const studentName =
              s.student?.full_name || s.student?.email || "Unknown student"
            const isOpen = activeId === s.id
            const isBusy = busyId === s.id
            const note = reviewerNotes[s.id] ?? ""

            return (
              <div
                key={s.id}
                className="rounded-lg border border-neutral-800 bg-neutral-950/50"
              >
                <button
                  type="button"
                  onClick={() => setActiveId(isOpen ? null : s.id)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-white truncate">
                      <span className="font-medium">{studentName}</span>
                      <span className="text-neutral-500"> demonstrates </span>
                      <span className="text-amber-300">{s.skill_name}</span>
                    </p>
                    <p className="text-[10px] text-neutral-600 mt-0.5">
                      {s.level_name} · submitted{" "}
                      {new Date(s.created_at).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-800 p-3 space-y-3">
                    <video
                      src={s.video_url}
                      controls
                      preload="metadata"
                      className="w-full max-h-[420px] rounded-md bg-black"
                    />
                    <div className="flex items-center justify-between">
                      <a
                        href={s.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-neutral-500 hover:text-neutral-300 inline-flex items-center gap-1"
                      >
                        Open in new tab
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {s.student_notes && (
                      <div className="text-[11px] text-neutral-400 bg-neutral-900/50 rounded px-2 py-1.5 border border-neutral-800">
                        <span className="text-neutral-600">Student note: </span>
                        {s.student_notes}
                      </div>
                    )}
                    <textarea
                      value={note}
                      onChange={(e) =>
                        setReviewerNotes((prev) => ({
                          ...prev,
                          [s.id]: e.target.value,
                        }))
                      }
                      placeholder="Reviewer note (shown to the student on approval, required-ish on rejection)…"
                      rows={2}
                      disabled={isBusy}
                      className="w-full text-[11px] bg-black/40 border border-neutral-800 rounded px-2 py-1.5 text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => decide(s.id, "approved")}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        Approve & sign off
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(s.id, "sent_back")}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Send back for retry
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(s.id, "rejected")}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
