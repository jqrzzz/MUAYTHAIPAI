"use client"

/**
 * Inline widget the student uses to submit a short video demonstrating
 * a single skill. Lives under each not-yet-signed-off skill in the
 * student dashboard's certification view.
 *
 * Flow:
 *   1. Student picks a file (≤100MB MP4/WebM/MOV).
 *   2. We upload directly to the skill-submissions bucket via the
 *      Supabase JS client — no proxy through Next.js (avoids 100MB
 *      crossing our serverless function).
 *   3. We call /api/student/skill-submissions to record the row.
 *
 * Status display branches on the submissionStatus prop:
 *   pending    → "Awaiting review"
 *   approved   → "Approved — counts as a tick" (signoff already lives in skill_signoffs)
 *   rejected / sent_back → show reviewer note + allow resubmit
 */
import { useCallback, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload, Video, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react"

interface Props {
  level: string
  skillIndex: number
  skillName: string
  studentId: string
  orgId: string | null
  submissionStatus: string | null
  submissionVideoUrl?: string | null
  submissionReviewerNotes?: string | null
  onSubmitted: () => void
}

const SIZE_CAP = 100 * 1024 * 1024 // 100 MB
const ALLOWED_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"])

export function SkillDemoUploader(props: Props) {
  const {
    level,
    skillIndex,
    skillName,
    studentId,
    orgId,
    submissionStatus,
    submissionVideoUrl,
    submissionReviewerNotes,
    onSubmitted,
  } = props

  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [showForm, setShowForm] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const canResubmit =
    submissionStatus === null ||
    submissionStatus === "rejected" ||
    submissionStatus === "sent_back"

  const upload = useCallback(
    async (file: File) => {
      if (!orgId) {
        setError("Enroll in this level before submitting a demo")
        return
      }
      if (file.size > SIZE_CAP) {
        setError(
          `Clip is ${(file.size / 1024 / 1024).toFixed(1)} MB — cap is 100 MB. Trim it or lower the resolution.`,
        )
        return
      }
      if (!ALLOWED_MIME.has(file.type)) {
        setError("Use MP4, WebM, or MOV. Other formats aren't accepted.")
        return
      }

      setBusy(true)
      setError(null)
      setProgress(0)

      try {
        const supabase = createClient()
        const ext = file.name.split(".").pop()?.toLowerCase() || "mp4"
        const safeName = `${level}-${skillIndex}-${Date.now()}.${ext}`
        const path = `org/${orgId}/${studentId}/${safeName}`

        const { error: upErr } = await supabase.storage
          .from("skill-submissions")
          .upload(path, file, { cacheControl: "31536000", upsert: false })
        if (upErr) throw upErr

        const { data: pub } = supabase.storage
          .from("skill-submissions")
          .getPublicUrl(path)
        if (!pub.publicUrl) throw new Error("Upload succeeded but no URL")

        setProgress(100)

        const res = await fetch("/api/student/skill-submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            level,
            skillIndex,
            videoUrl: pub.publicUrl,
            studentNotes: notes.trim() || null,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? "Failed to record submission")
        }

        setShowForm(false)
        setNotes("")
        onSubmitted()
      } catch (err) {
        const msg = (err as Error).message ?? String(err)
        if (/policy/i.test(msg)) {
          setError(
            "Upload denied. Make sure you're enrolled at this gym and the latest migration is applied.",
          )
        } else {
          setError(msg)
        }
      } finally {
        setBusy(false)
        setProgress(0)
      }
    },
    [level, skillIndex, notes, onSubmitted, orgId, studentId],
  )

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ""
  }

  // ─── Status pills ────────────────────────────────────────────────
  if (submissionStatus === "pending") {
    return (
      <div className="ml-5 mt-1 inline-flex items-center gap-1.5 text-[10px] text-amber-400/80">
        <Loader2 className="w-3 h-3 animate-spin" />
        Video submitted — awaiting review
      </div>
    )
  }

  if (submissionStatus === "approved") {
    return (
      <div className="ml-5 mt-1 inline-flex items-center gap-1.5 text-[10px] text-emerald-400/80">
        <CheckCircle2 className="w-3 h-3" />
        Video-verified
      </div>
    )
  }

  // ─── Compact CTA (collapsed) ─────────────────────────────────────
  if (!showForm) {
    return (
      <div className="ml-5 mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1 text-[10px] text-orange-500/70 hover:text-orange-400 transition-colors"
        >
          {canResubmit && submissionStatus ? (
            <>
              <RotateCcw className="w-3 h-3" /> Resubmit demo
            </>
          ) : (
            <>
              <Video className="w-3 h-3" /> Submit video demo
            </>
          )}
        </button>
        {submissionStatus === "rejected" || submissionStatus === "sent_back" ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-rose-400/80">
            <AlertCircle className="w-3 h-3" />
            {submissionStatus === "rejected" ? "Rejected" : "Sent back"}
            {submissionReviewerNotes ? ` — "${submissionReviewerNotes}"` : ""}
          </span>
        ) : null}
      </div>
    )
  }

  // ─── Expanded form ───────────────────────────────────────────────
  return (
    <div className="ml-5 mt-1.5 rounded-md border border-neutral-800 bg-neutral-950/40 p-2.5 space-y-2">
      <div className="text-[10px] text-neutral-500">
        Record a short clip (10–60s) clearly showing <span className="text-neutral-300">{skillName}</span>.
        A trainer will review it within a few days.
      </div>
      {submissionVideoUrl && (submissionStatus === "rejected" || submissionStatus === "sent_back") && (
        <div className="text-[10px] text-neutral-600">
          Previous attempt:{" "}
          <a
            href={submissionVideoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-300 underline"
          >
            view
          </a>
        </div>
      )}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional note for the reviewer..."
        rows={2}
        disabled={busy}
        className="w-full text-[11px] bg-black/40 border border-neutral-800 rounded px-2 py-1 text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600"
      />
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={onPick}
          disabled={busy}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || !orgId}
          className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" /> Uploading {progress}%
            </>
          ) : (
            <>
              <Upload className="w-3 h-3" /> Choose video
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false)
            setError(null)
          }}
          disabled={busy}
          className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          Cancel
        </button>
      </div>
      {!orgId && (
        <div className="text-[10px] text-amber-400/70">
          Enroll in this level at a gym before submitting a demo.
        </div>
      )}
      {error && (
        <div className="text-[10px] text-rose-400 flex items-start gap-1">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
