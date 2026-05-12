"use client"

/**
 * Reusable media uploader for course content.
 *
 * Modes:
 *   - "image"  → 5 MB cap, image MIME types, square preview, hero usage
 *   - "video"  → 500 MB cap, video MIME types, 16:9 preview
 *   - "gallery"→ image mode but multiple files; returns array
 *
 * Storage path is computed from kind + courseOrgId + courseId + lessonId:
 *   platform/{course_id}/{lesson_id}/{random}-{filename}      (platform course)
 *   org/{org_id}/{course_id}/{lesson_id}/{random}-{filename}  (gym course)
 *
 * Uses the browser Supabase client — direct upload, no API hop. RLS on
 * storage.objects (migration 037) enforces who can write where.
 *
 * On any platform with a body-size limit (Vercel functions: 4.5 MB
 * Hobby / 50 MB Pro), routing through an API would force tiny videos.
 * Direct-to-storage avoids that entirely.
 */

import { useCallback, useRef, useState } from "react"
import {
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  Video as VideoIcon,
  X,
  Plus,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export type UploadKind = "image" | "video"

export interface GalleryItem {
  url: string
  caption?: string
  alt?: string
}

interface BaseProps {
  /** null when uploading to a platform-wide course */
  orgId: string | null
  courseId: string
  lessonId: string
  /** Disable the uploader (saving / parent locked) */
  disabled?: boolean
}

interface SingleProps extends BaseProps {
  mode: "image" | "video"
  value: string | null
  onChange: (url: string | null) => void
}

interface GalleryProps extends BaseProps {
  mode: "gallery"
  value: GalleryItem[]
  onChange: (items: GalleryItem[]) => void
}

type Props = SingleProps | GalleryProps

const SIZE_CAPS: Record<UploadKind, number> = {
  image: 5 * 1024 * 1024,
  video: 500 * 1024 * 1024,
}

const MIME_ACCEPT: Record<UploadKind, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
}

function bucketFor(kind: UploadKind) {
  return kind === "image" ? "course-media" : "course-videos"
}

function buildPath(args: {
  orgId: string | null
  courseId: string
  lessonId: string
  fileName: string
}) {
  const safeName = args.fileName
    .replace(/[^\w.-]+/g, "-")
    .toLowerCase()
    .slice(-80)
  const random = Math.random().toString(36).slice(2, 10)
  const prefix = args.orgId ? `org/${args.orgId}` : "platform"
  return `${prefix}/${args.courseId}/${args.lessonId}/${random}-${safeName}`
}

export default function MediaUploader(props: Props) {
  const kind: UploadKind = props.mode === "video" ? "video" : "image"
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || props.disabled) return
      setError(null)
      setBusy(true)
      setProgress(0)

      const cap = SIZE_CAPS[kind]
      const supabase = createClient()
      const newItems: GalleryItem[] = []
      let singleUrl: string | null = null

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file.size > cap) {
            throw new Error(
              `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB — cap is ${
                cap / 1024 / 1024
              } MB.`,
            )
          }
          const path = buildPath({
            orgId: props.orgId,
            courseId: props.courseId,
            lessonId: props.lessonId,
            fileName: file.name,
          })
          const bucket = bucketFor(kind)

          const { error: uploadErr } = await supabase.storage
            .from(bucket)
            .upload(path, file, { upsert: false, cacheControl: "31536000" })
          if (uploadErr) throw uploadErr

          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
          if (!pub.publicUrl) throw new Error("Upload succeeded but no URL")

          if (props.mode === "gallery") {
            newItems.push({ url: pub.publicUrl })
          } else {
            singleUrl = pub.publicUrl
          }
          setProgress(Math.round(((i + 1) / files.length) * 100))
        }

        if (props.mode === "gallery") {
          props.onChange([...props.value, ...newItems])
        } else if (singleUrl) {
          props.onChange(singleUrl)
        }
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = (err as any)?.message ?? String(err)
        // Translate common Supabase storage errors into something humans understand
        if (/policy/i.test(msg)) {
          setError(
            "Upload denied by storage policy. Make sure migration 037 is applied and you're logged in as the right gym.",
          )
        } else if (/size/i.test(msg)) {
          setError(`File too large. Cap is ${SIZE_CAPS[kind] / 1024 / 1024} MB.`)
        } else {
          setError(msg)
        }
      } finally {
        setBusy(false)
        setProgress(0)
      }
    },
    [props, kind],
  )

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    upload(files)
    e.target.value = ""
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files ?? []).filter((f) => {
      const accepts = MIME_ACCEPT[kind].split(",")
      return accepts.some((a) => f.type === a.trim())
    })
    if (files.length > 0) upload(files)
  }

  const removeSingle = async () => {
    if (props.mode === "gallery") return
    if (!props.value) return
    if (!confirm("Remove this file?")) return
    try {
      await deleteFromUrl(props.value, kind)
    } catch {
      // best effort — even if the storage delete fails, clear the field
    }
    props.onChange(null)
  }

  const removeFromGallery = async (idx: number) => {
    if (props.mode !== "gallery") return
    const item = props.value[idx]
    try {
      await deleteFromUrl(item.url, "image")
    } catch {
      // ignore
    }
    props.onChange(props.value.filter((_, i) => i !== idx))
  }

  const updateGalleryItem = (idx: number, patch: Partial<GalleryItem>) => {
    if (props.mode !== "gallery") return
    props.onChange(
      props.value.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    )
  }

  /* ─── single image / video render ───────────────────────────── */
  if (props.mode !== "gallery") {
    const value = props.value
    const Icon = kind === "image" ? ImageIcon : VideoIcon

    if (value && !busy) {
      return (
        <div className="rounded-xl ring-1 ring-zinc-800 bg-zinc-950/50 overflow-hidden">
          {kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="w-full max-h-72 object-cover bg-zinc-900"
            />
          ) : (
            <video
              src={value}
              controls
              className="w-full max-h-72 bg-black"
            />
          )}
          <div className="px-3 py-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-900">
            <span className="truncate">{value.split("/").pop()}</span>
            <button
              onClick={removeSingle}
              disabled={props.disabled}
              className="text-zinc-500 hover:text-red-400 transition-colors p-1 -mr-1"
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )
    }

    return (
      <DropZone
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        dragOver={dragOver}
        setDragOver={setDragOver}
        disabled={props.disabled || busy}
      >
        <input
          ref={inputRef}
          type="file"
          accept={MIME_ACCEPT[kind]}
          className="hidden"
          onChange={onPick}
          disabled={props.disabled || busy}
        />
        {busy ? (
          <UploadingState progress={progress} />
        ) : (
          <>
            <Icon className="h-5 w-5 text-zinc-500 mb-2" />
            <p className="text-[13px] font-medium text-zinc-200">
              Drop a {kind} here or click to upload
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {kind === "image"
                ? "JPEG, PNG, WebP, GIF — up to 5 MB"
                : "MP4, WebM, MOV — up to 500 MB"}
            </p>
          </>
        )}
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      </DropZone>
    )
  }

  /* ─── gallery render ─────────────────────────────────────────── */
  return (
    <div className="space-y-3">
      {props.value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {props.value.map((item, i) => (
            <div
              key={i}
              className="rounded-lg ring-1 ring-zinc-800 bg-zinc-950 overflow-hidden group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.alt ?? ""}
                className="w-full aspect-square object-cover bg-zinc-900"
              />
              <div className="p-1.5 space-y-1">
                <input
                  type="text"
                  value={item.caption ?? ""}
                  onChange={(e) => updateGalleryItem(i, { caption: e.target.value })}
                  placeholder="Caption (optional)"
                  disabled={props.disabled}
                  className="w-full bg-transparent text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                />
                <button
                  onClick={() => removeFromGallery(i)}
                  disabled={props.disabled}
                  className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 bg-zinc-900/80 hover:bg-red-500/30 text-zinc-300 hover:text-red-300 rounded p-1 transition-all"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DropZone
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        dragOver={dragOver}
        setDragOver={setDragOver}
        disabled={props.disabled || busy}
        compact={props.value.length > 0}
      >
        <input
          ref={inputRef}
          type="file"
          accept={MIME_ACCEPT.image}
          className="hidden"
          multiple
          onChange={onPick}
          disabled={props.disabled || busy}
        />
        {busy ? (
          <UploadingState progress={progress} />
        ) : (
          <>
            <Plus className="h-4 w-4 text-zinc-500 mb-1.5" />
            <p className="text-[12px] text-zinc-300">
              {props.value.length > 0 ? "Add more photos" : "Drop photos here or click to upload"}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">JPEG, PNG, WebP — 5 MB each</p>
          </>
        )}
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      </DropZone>
    </div>
  )
}

/* ─── helpers ───────────────────────────────────────────────────── */

function DropZone({
  children,
  onClick,
  onDrop,
  dragOver,
  setDragOver,
  disabled,
  compact,
}: {
  children: React.ReactNode
  onClick: () => void
  onDrop: (e: React.DragEvent) => void
  dragOver: boolean
  setDragOver: (next: boolean) => void
  disabled?: boolean
  compact?: boolean
}) {
  return (
    <div
      onClick={() => !disabled && onClick()}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => !disabled && onDrop(e)}
      className={`relative rounded-xl border border-dashed transition-colors flex flex-col items-center justify-center text-center px-4 ${
        compact ? "py-4" : "py-8"
      } ${
        dragOver
          ? "border-indigo-400 bg-indigo-500/[0.06]"
          : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </div>
  )
}

function UploadingState({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center">
      <Loader2 className="h-5 w-5 animate-spin text-indigo-300 mb-2" />
      <p className="text-[12px] text-zinc-300">Uploading… {progress}%</p>
      <div className="mt-2 w-32 h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-indigo-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string
  onDismiss: () => void
}) {
  return (
    <div
      className="absolute inset-x-2 bottom-2 rounded-lg ring-1 ring-red-500/30 bg-red-500/15 px-3 py-2 text-[11px] text-red-200 flex items-start gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="text-red-200/70 hover:text-red-100 -mr-0.5"
        title="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

/**
 * Best-effort delete by parsing the public URL back into bucket + path.
 * If parsing fails (URL came from elsewhere, like YouTube), no-op.
 */
async function deleteFromUrl(url: string, kind: UploadKind) {
  const supabase = createClient()
  const bucket = bucketFor(kind)
  // Public URL pattern: .../storage/v1/object/public/{bucket}/{path}
  const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
  if (!match) return
  const [, bucketName, path] = match
  if (bucketName !== bucket) return
  await supabase.storage.from(bucket).remove([path])
}

export { MediaUploader }
