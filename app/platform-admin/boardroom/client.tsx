"use client"

/**
 * Boardroom — a tiny shared workspace for the platform admin + partner(s).
 *   - Files     (upload / list / download / delete)
 *   - Notes     (one running plain-text doc; explicit Save)
 *   - Discussion (one comment thread)
 *
 * Kept deliberately small: no per-file comments, no markdown editor, no
 * notifications. If it needs more later, add it then.
 */
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Download, FileText, Loader2, Save, Trash2, Upload } from "lucide-react"
import { Surface } from "@/components/saas"

export interface BUser {
  id: string
  full_name: string | null
  email: string
}

export interface BFile {
  id: string
  name: string
  mime_type: string | null
  size_bytes: number | null
  created_at: string
  uploaded_by: string | null
  uploader: BUser | null
  signedUrl: string | null
}

export interface BNotes {
  body: string
  updated_at: string | null
  editor: BUser | null
}

export interface BComment {
  id: string
  body: string
  created_at: string
  author_id: string | null
  author: BUser | null
}

const displayName = (u: BUser | null) => u?.full_name?.trim() || u?.email?.split("@")[0] || "Someone"
const formatSize = (b: number | null) => {
  if (!b) return ""
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`
  if (b >= 1024) return `${Math.round(b / 1024)} KB`
  return `${b} B`
}
const formatDate = (s: string | null) => {
  if (!s) return ""
  return new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export default function BoardroomClient({
  initialFiles,
  initialNotes,
  initialComments,
}: {
  initialFiles: BFile[]
  initialNotes: BNotes
  initialComments: BComment[]
}) {
  const router = useRouter()

  // ───── Files ─────
  const [files, setFiles] = useState(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append("file", f)
      const res = await fetch("/api/platform-admin/boardroom/files", { method: "POST", body: fd })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setUploadError(data.error || "Upload failed")
        return
      }
      router.refresh() // re-fetch with a fresh signed URL for the new file
    } catch {
      setUploadError("Network error — try again")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const deleteFile = async (id: string) => {
    if (!confirm("Remove this file?")) return
    const prev = files
    setFiles((fs) => fs.filter((f) => f.id !== id))
    const res = await fetch(`/api/platform-admin/boardroom/files/${id}`, { method: "DELETE" })
    if (!res.ok) {
      setFiles(prev) // rollback
    }
  }

  // ───── Notes ─────
  const [notesBody, setNotesBody] = useState(initialNotes.body)
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesJustSaved, setNotesJustSaved] = useState(false)
  const [notesError, setNotesError] = useState<string | null>(null)
  const notesDirty = notesBody !== initialNotes.body

  const saveNotes = async () => {
    setSavingNotes(true)
    setNotesError(null)
    setNotesJustSaved(false)
    try {
      const res = await fetch("/api/platform-admin/boardroom/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: notesBody }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setNotesError(data.error || "Save failed")
        return
      }
      setNotesJustSaved(true)
      setTimeout(() => setNotesJustSaved(false), 2000)
      router.refresh()
    } catch {
      setNotesError("Network error — try again")
    } finally {
      setSavingNotes(false)
    }
  }

  // ───── Discussion ─────
  const [commentBody, setCommentBody] = useState("")
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  const post = async () => {
    const text = commentBody.trim()
    if (!text || posting) return
    setPosting(true)
    setPostError(null)
    try {
      const res = await fetch("/api/platform-admin/boardroom/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setPostError(data.error || "Couldn't post")
        return
      }
      setCommentBody("")
      router.refresh()
    } catch {
      setPostError("Network error — try again")
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1.5">Partner workspace</p>
        <h1 className="text-[28px] font-semibold tracking-tight text-white leading-tight">Boardroom</h1>
        <p className="text-[13px] text-zinc-500 mt-1">Business plan, pitch deck, running notes, discussion.</p>
      </section>

      {/* Files */}
      <section>
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-3">Files</p>
        <Surface className="p-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-zinc-800 p-4 transition-colors hover:border-indigo-500/50">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
              ) : (
                <Upload className="h-4 w-4 text-indigo-300" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white">{uploading ? "Uploading…" : "Upload a file"}</p>
              <p className="text-[12px] text-zinc-500">Pitch deck, business plan, financials, etc. Max 25 MB.</p>
            </div>
            <input ref={inputRef} type="file" onChange={onPick} disabled={uploading} className="sr-only" />
          </label>
          {uploadError && <p className="mt-2 text-[12px] text-red-300">{uploadError}</p>}

          <ul className="mt-4 space-y-2">
            {files.length === 0 && (
              <li className="py-2 text-[12px] italic text-zinc-600">No files yet.</li>
            )}
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 rounded-lg bg-zinc-900/40 px-3 py-2 ring-1 ring-zinc-900">
                <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-zinc-200">{f.name}</p>
                  <p className="text-[11px] text-zinc-600">
                    {displayName(f.uploader)} · {formatDate(f.created_at)}
                    {f.size_bytes ? ` · ${formatSize(f.size_bytes)}` : ""}
                  </p>
                </div>
                {f.signedUrl && (
                  <a
                    href={f.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    aria-label="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => deleteFile(f.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-300"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Surface>
      </section>

      {/* Notes */}
      <section>
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-3">Notes</p>
        <Surface className="p-4">
          <textarea
            value={notesBody}
            onChange={(e) => setNotesBody(e.target.value)}
            rows={10}
            placeholder="Meeting agenda, decisions, anything to capture…"
            className="w-full resize-y rounded-lg bg-zinc-950 px-3 py-2.5 text-[14px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-zinc-600">
              {initialNotes.updated_at
                ? `Last edited by ${displayName(initialNotes.editor)} · ${formatDate(initialNotes.updated_at)}`
                : "Not edited yet."}
            </p>
            <div className="flex items-center gap-3">
              {notesError && <span className="text-[11px] text-red-300">{notesError}</span>}
              <button
                type="button"
                onClick={saveNotes}
                disabled={!notesDirty || savingNotes}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 px-3 text-[12px] font-medium text-white transition-colors hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {savingNotes ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : notesJustSaved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {savingNotes ? "Saving…" : notesJustSaved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </Surface>
      </section>

      {/* Discussion */}
      <section>
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-3">Discussion</p>
        <Surface className="p-4">
          {initialComments.length === 0 && (
            <p className="text-[12px] italic text-zinc-600">No comments yet — leave a thought.</p>
          )}
          {initialComments.length > 0 && (
            <ul className="space-y-3">
              {initialComments.map((c) => (
                <li key={c.id} className="rounded-lg bg-zinc-900/40 px-3 py-2.5 ring-1 ring-zinc-900">
                  <p className="mb-1 text-[11px] text-zinc-500">
                    <span className="font-medium text-zinc-300">{displayName(c.author)}</span>{" "}
                    · {formatDate(c.created_at)}
                  </p>
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-200">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={3}
              placeholder="Post a comment…"
              className="w-full resize-y rounded-lg bg-zinc-950 px-3 py-2.5 text-[14px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40"
            />
            <div className="mt-2 flex items-center justify-end gap-3">
              {postError && <span className="text-[11px] text-red-300">{postError}</span>}
              <button
                type="button"
                onClick={post}
                disabled={!commentBody.trim() || posting}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 px-3 text-[12px] font-medium text-white transition-colors hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {posting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </Surface>
      </section>
    </div>
  )
}
