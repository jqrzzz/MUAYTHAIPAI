"use client"

/**
 * Door scanning client. Uses the browser's native BarcodeDetector API
 * where available (Chrome, Edge, Android Chrome — most field devices)
 * and falls back to a manual order-reference entry otherwise (Safari,
 * older devices).
 *
 * Each scan POSTs to /api/promoter/events/[id]/tickets/scan and renders
 * a big colored banner so door staff can scan-and-glance:
 *   - GREEN  → valid first scan
 *   - AMBER  → already scanned (with prior timestamp)
 *   - RED    → not found / wrong event / not paid / cancelled
 *
 * 2-second cooldown between scans prevents the same QR from firing
 * back-to-back in the camera loop.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Keyboard,
  Loader2,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

type ScanStatus =
  | "valid"
  | "already_scanned"
  | "not_found"
  | "wrong_event"
  | "not_paid"
  | "cancelled"
  | "error"
  | "feature_disabled"

interface ScanResult {
  status: ScanStatus
  message?: string
  scanned_at?: string
  scan_count?: number
  order?: {
    order_reference: string
    guest_name: string | null
    guest_email_masked: string | null
    quantity: number
    tier_name: string | null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const BarcodeDetector: any

export default function DoorScanClient({
  eventId,
  eventName,
  eventDate,
  venueName,
}: {
  eventId: string
  eventName: string
  eventDate: string | null
  venueName: string | null
}) {
  const [mode, setMode] = useState<"camera" | "manual">("camera")
  const [supported, setSupported] = useState<boolean | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [manual, setManual] = useState("")
  const [scannedCount, setScannedCount] = useState(0)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detectorRef = useRef<any>(null)
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null)
  const loopRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Check native support once on mount. If absent, switch to manual mode.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = typeof window !== "undefined" ? (window as any) : null
    const has = !!win?.BarcodeDetector
    setSupported(has)
    if (!has) setMode("manual")
  }, [])

  // Submit a scanned/typed code to the backend.
  const submitScan = useCallback(
    async (reference: string) => {
      if (busy) return
      setBusy(true)
      try {
        const res = await fetch(`/api/promoter/events/${eventId}/tickets/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_reference: reference }),
        })
        const data: ScanResult = await res.json()
        setResult(data)
        if (data.status === "valid") setScannedCount((c) => c + 1)
      } catch {
        setResult({
          status: "error",
          message: "Couldn't reach the server. Try again.",
        })
      } finally {
        setBusy(false)
      }
    },
    [busy, eventId],
  )

  // Camera scan loop — runs continuously while in camera mode.
  useEffect(() => {
    if (mode !== "camera" || !supported) return

    let cancelled = false
    async function start() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        detectorRef.current = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        })
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        const tick = async () => {
          if (cancelled) return
          if (videoRef.current && detectorRef.current) {
            try {
              const codes = await detectorRef.current.detect(videoRef.current)
              if (codes && codes.length > 0) {
                const code = String(codes[0].rawValue || "").trim().toUpperCase()
                const last = lastCodeRef.current
                // 2-second cooldown for the same code so we don't loop-spam
                // the backend while the QR is held in the frame.
                if (code && (!last || last.code !== code || Date.now() - last.at > 2000)) {
                  lastCodeRef.current = { code, at: Date.now() }
                  submitScan(code)
                }
              }
            } catch {
              // ignore individual detect failures — keep scanning
            }
          }
          loopRef.current = requestAnimationFrame(tick) as unknown as number
        }
        tick()
      } catch {
        // Permission denied / camera missing — fall back to manual.
        setMode("manual")
      }
    }
    start()
    return () => {
      cancelled = true
      if (loopRef.current) cancelAnimationFrame(loopRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      streamRef.current = null
    }
  }, [mode, supported, submitScan])

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = manual.trim().toUpperCase()
    if (!code) return
    submitScan(code)
    setManual("")
  }

  const eventDateLabel = eventDate
    ? new Date(eventDate).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header — stays fixed so it's always visible while scanning. */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <Link
            href={`/ockock/promoter/events/${eventId}`}
            className="text-neutral-400 hover:text-white"
            aria-label="Back to event editor"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 text-center flex-1 px-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-amber-300">Door · Scanning</p>
            <p className="truncate text-sm font-semibold text-white">{eventName}</p>
            {(eventDateLabel || venueName) && (
              <p className="truncate text-[10px] text-neutral-500">
                {eventDateLabel}
                {eventDateLabel && venueName ? " · " : ""}
                {venueName}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Scanned</p>
            <p className="font-mono text-sm font-semibold text-emerald-300 tabular-nums">{scannedCount}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* Mode toggle */}
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-neutral-900 p-1">
          <button
            type="button"
            onClick={() => setMode("camera")}
            disabled={supported === false}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "camera"
                ? "bg-amber-500/20 text-amber-200"
                : "text-neutral-500 hover:text-neutral-300 disabled:opacity-40"
            }`}
          >
            <Camera className="h-4 w-4" />
            Camera
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "manual"
                ? "bg-amber-500/20 text-amber-200"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Keyboard className="h-4 w-4" />
            Type code
          </button>
        </div>

        {supported === false && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            This browser doesn&apos;t support camera QR scanning. Use Type code, or open this page in Chrome.
          </div>
        )}

        {mode === "camera" && supported && (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full aspect-square object-cover bg-black"
            />
            <div className="p-3 text-center">
              <p className="text-[11px] text-neutral-500">Aim at the buyer&apos;s ticket QR code.</p>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <form onSubmit={handleManualSubmit} className="rounded-xl border border-white/10 bg-neutral-900 p-4">
            <label htmlFor="manual-ref" className="block text-xs font-medium text-neutral-400 mb-1">
              Order reference
            </label>
            <div className="flex gap-2">
              <input
                id="manual-ref"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                autoFocus
                placeholder="TKT-VIP-A1B2C3"
                className="flex-1 rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm uppercase text-white placeholder-neutral-600 font-mono outline-none focus:border-white/30"
              />
              <button
                type="submit"
                disabled={busy || !manual.trim()}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Check
              </button>
            </div>
          </form>
        )}

        {/* Result banner */}
        <ScanResultBanner result={result} busy={busy} />
      </main>
    </div>
  )
}

function ScanResultBanner({ result, busy }: { result: ScanResult | null; busy: boolean }) {
  if (busy && !result) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-500" />
      </div>
    )
  }
  if (!result) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
        <p className="text-xs text-neutral-600">Awaiting scan…</p>
      </div>
    )
  }

  const tone = toneFor(result.status)
  const Icon = tone.icon
  return (
    <div className={`rounded-xl border-2 p-5 ${tone.bg} ${tone.border}`} role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <Icon className={`h-10 w-10 shrink-0 ${tone.text}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-base font-bold uppercase tracking-wider ${tone.text}`}>
            {tone.headline}
          </p>
          {result.message && (
            <p className="mt-0.5 text-sm text-neutral-300">{result.message}</p>
          )}
          {result.order && (
            <div className="mt-2 space-y-0.5 text-sm">
              <p className="text-white">
                <strong>{result.order.guest_name || "Guest"}</strong>
                {result.order.guest_email_masked && (
                  <span className="ml-1 text-neutral-500">· {result.order.guest_email_masked}</span>
                )}
              </p>
              <p className="text-xs text-neutral-400">
                {result.order.tier_name || "Ticket"} × {result.order.quantity}
                {" · "}
                <span className="font-mono">{result.order.order_reference}</span>
              </p>
            </div>
          )}
          {result.status === "already_scanned" && result.scanned_at && (
            <p className="mt-2 text-xs text-amber-200/80">
              Originally scanned {new Date(result.scanned_at).toLocaleString()}
              {result.scan_count != null && ` · attempt #${result.scan_count}`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function toneFor(status: ScanStatus) {
  switch (status) {
    case "valid":
      return {
        bg: "bg-emerald-500/15",
        border: "border-emerald-500/50",
        text: "text-emerald-300",
        icon: CheckCircle2,
        headline: "Valid · Admit",
      }
    case "already_scanned":
      return {
        bg: "bg-amber-500/15",
        border: "border-amber-500/50",
        text: "text-amber-300",
        icon: AlertTriangle,
        headline: "Already scanned",
      }
    case "not_paid":
      return {
        bg: "bg-red-500/15",
        border: "border-red-500/50",
        text: "text-red-300",
        icon: XCircle,
        headline: "Not paid · Deny",
      }
    case "cancelled":
      return {
        bg: "bg-red-500/15",
        border: "border-red-500/50",
        text: "text-red-300",
        icon: XCircle,
        headline: "Cancelled · Deny",
      }
    case "wrong_event":
      return {
        bg: "bg-red-500/15",
        border: "border-red-500/50",
        text: "text-red-300",
        icon: XCircle,
        headline: "Wrong event · Deny",
      }
    case "not_found":
      return {
        bg: "bg-red-500/15",
        border: "border-red-500/50",
        text: "text-red-300",
        icon: XCircle,
        headline: "Not found · Deny",
      }
    case "feature_disabled":
      return {
        bg: "bg-zinc-500/15",
        border: "border-zinc-500/50",
        text: "text-zinc-300",
        icon: AlertTriangle,
        headline: "Scanning not enabled",
      }
    default:
      return {
        bg: "bg-red-500/15",
        border: "border-red-500/50",
        text: "text-red-300",
        icon: XCircle,
        headline: "Error · Retry",
      }
  }
}
