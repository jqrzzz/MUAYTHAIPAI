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
  Plus,
  Banknote,
  X,
} from "lucide-react"
import Link from "next/link"

interface Tier {
  id: string
  tier_name: string
  price_thb: number
  quantity_remaining: number
}

interface CreatedOrder {
  id: string
  order_reference: string
  guest_name: string | null
  quantity: number
  total_price_thb: number
  tier_name: string | null
  payment_method: string
}

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
  tiers,
}: {
  eventId: string
  eventName: string
  eventDate: string | null
  venueName: string | null
  tiers: Tier[]
}) {
  // Three modes: scan with camera, type a reference, or record a
  // walkup sale. Camera defaults except when unsupported (Safari).
  const [mode, setMode] = useState<"camera" | "manual" | "sale">("camera")
  const [supported, setSupported] = useState<boolean | null>(null)
  // Distinguishes "camera unavailable" from "user denied permission".
  // Denied users need to fix it in browser settings — surface that
  // instead of silently dumping them into manual mode.
  const [cameraError, setCameraError] = useState<"denied" | "unavailable" | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [manual, setManual] = useState("")
  const [scannedCount, setScannedCount] = useState(0)
  // Running tally of walkup sales recorded in this session — visible
  // in the header so the promoter can quickly tell how many manual
  // sales their staff entered.
  const [saleCount, setSaleCount] = useState(0)
  const [lastSale, setLastSale] = useState<CreatedOrder | null>(null)

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
        // Defensive parse — if the server returned HTML (e.g. a 500
        // proxy page) we don't want to crash on .json() and show
        // "undefined" in the banner. Surface a clear server-error UI.
        let data: ScanResult
        try {
          data = (await res.json()) as ScanResult
        } catch {
          setResult({
            status: "error",
            message: `Server error (${res.status}). Try again.`,
          })
          return
        }
        if (!res.ok && !data?.status) {
          setResult({
            status: "error",
            message:
              data?.message ||
              `Server returned ${res.status}. Try again or use manual entry.`,
          })
          return
        }
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
        setCameraError(null)
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
                // 4-second cooldown for the same code so the "already
                // scanned" amber banner has time to be read by staff
                // before the next auto-scan clears it. The poll loop
                // still re-reads the QR every ~30ms, so this only
                // affects re-submissions of the *same* code.
                if (code && (!last || last.code !== code || Date.now() - last.at > 4000)) {
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
      } catch (err) {
        // Distinguish "user denied permission" from "no camera at all"
        // — the fix is different (browser settings vs different device).
        // Stay on camera mode and show the error, rather than silently
        // dropping into manual where the user can't tell what happened.
        const name = (err as { name?: string } | null)?.name
        if (name === "NotAllowedError" || name === "SecurityError") {
          setCameraError("denied")
        } else {
          setCameraError("unavailable")
        }
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header — stays fixed so it's always visible while scanning. */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <Link
            href={`/promoter/events/${eventId}`}
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
            <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Scanned · Sold
            </p>
            <p className="text-sm tabular-nums">
              <span className="font-mono font-semibold text-emerald-300">{scannedCount}</span>
              <span className="mx-1 text-neutral-600">·</span>
              <span className="font-mono font-semibold text-amber-300">{saleCount}</span>
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
        {/* Mode toggle — three tabs: scan (camera), type a code, or
            record a walkup cash/transfer sale. */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-neutral-900 p-1">
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
            <span className="hidden xs:inline">Camera</span>
            <span className="xs:hidden">Scan</span>
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
            <span className="hidden xs:inline">Type code</span>
            <span className="xs:hidden">Type</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("sale")}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "sale"
                ? "bg-emerald-500/20 text-emerald-200"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Banknote className="h-4 w-4" />
            <span className="hidden xs:inline">Record sale</span>
            <span className="xs:hidden">Sale</span>
          </button>
        </div>

        {supported === false && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            This browser doesn&apos;t support camera QR scanning. Use Type code, or open this page in Chrome.
          </div>
        )}

        {mode === "camera" && supported && (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
            {cameraError ? (
              <div role="alert" className="p-6 text-center">
                {cameraError === "denied" ? (
                  <>
                    <p className="text-sm font-semibold text-amber-300">
                      Camera permission denied
                    </p>
                    <p className="mt-2 text-xs text-neutral-400">
                      Open your browser settings → site permissions →
                      camera and allow access for this page, then reload.
                      Or use the Type code tab below.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-amber-300">
                      No camera available
                    </p>
                    <p className="mt-2 text-xs text-neutral-400">
                      We couldn&apos;t open a camera on this device. Use
                      Type code, or try a different device.
                    </p>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400"
                >
                  Switch to type code
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full aspect-square object-cover bg-black"
                />
                <div className="p-3 text-center">
                  <p className="text-[11px] text-neutral-500">Aim at the buyer&apos;s ticket QR code.</p>
                </div>
              </>
            )}
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

        {mode === "sale" && (
          <RecordSaleForm
            eventId={eventId}
            tiers={tiers}
            onSold={(order) => {
              setLastSale(order)
              setSaleCount((c) => c + 1)
            }}
          />
        )}

        {/* Result — scan result banner OR most recent sale receipt
            depending on what the staff just did. */}
        {mode === "sale" && lastSale ? (
          <RecentSaleCard order={lastSale} onDismiss={() => setLastSale(null)} />
        ) : (
          <ScanResultBanner result={result} busy={busy} />
        )}
      </main>
    </div>
  )
}

// Walkup ticket-sale form. Tier picker, qty, guest name, optional
// email/phone, payment method (cash | transfer). Submits to
// /api/promoter/events/[id]/orders. On success, calls onSold with
// the created order so the page can show a receipt.
function RecordSaleForm({
  eventId,
  tiers,
  onSold,
}: {
  eventId: string
  tiers: Tier[]
  onSold: (order: CreatedOrder) => void
}) {
  const availableTiers = tiers.filter((t) => t.quantity_remaining > 0)
  const [tierId, setTierId] = useState<string>(availableTiers[0]?.id ?? "")
  const [quantity, setQuantity] = useState(1)
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tier = availableTiers.find((t) => t.id === tierId) ?? null
  const maxQty = tier ? Math.min(10, tier.quantity_remaining) : 0
  const total = tier ? tier.price_thb * quantity : 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!tier) {
      setError("Pick a tier first.")
      return
    }
    if (!guestName.trim()) {
      setError("Buyer name is required.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/promoter/events/${eventId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: tier.id,
          quantity,
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim() || undefined,
          guest_phone: guestPhone.trim() || undefined,
          payment_method: paymentMethod,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.order) {
        setError(data.error || "Couldn't record the sale.")
        return
      }
      onSold(data.order as CreatedOrder)
      // Reset for the next walkup. Keep tier + method since the next
      // sale is usually the same tier.
      setQuantity(1)
      setGuestName("")
      setGuestEmail("")
      setGuestPhone("")
      setNotes("")
    } catch {
      setError("Network error. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (availableTiers.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        No active tiers with inventory left. Activate a tier in the
        event editor&apos;s Tickets tab to record walkup sales.
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 bg-neutral-900 p-4 space-y-3">
      <div>
        <label htmlFor="sale-tier" className="block text-xs font-medium text-neutral-400 mb-1">
          Tier
        </label>
        <select
          id="sale-tier"
          value={tierId}
          onChange={(e) => {
            setTierId(e.target.value)
            setQuantity(1)
          }}
          className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
        >
          {availableTiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tier_name} · ฿{t.price_thb.toLocaleString()} · {t.quantity_remaining} left
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="sale-qty" className="block text-xs font-medium text-neutral-400 mb-1">
            Quantity
          </label>
          <select
            id="sale-qty"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          >
            {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {/* Surface the cap when the user hits it — otherwise a
              party of 12 silently turns into 10 and they wonder why. */}
          {quantity === maxQty && tier && tier.quantity_remaining > 10 && (
            <p className="mt-1 text-[10px] text-neutral-500">
              Max 10 per order — split larger groups into separate sales.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="sale-method" className="block text-xs font-medium text-neutral-400 mb-1">
            Paid with
          </label>
          <select
            id="sale-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as "cash" | "transfer")}
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          >
            <option value="cash">Cash</option>
            <option value="transfer">Bank transfer</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="sale-name" className="block text-xs font-medium text-neutral-400 mb-1">
          Buyer name *
        </label>
        <input
          id="sale-name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          autoComplete="off"
          className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          placeholder="Walkup buyer"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="sale-email" className="block text-xs font-medium text-neutral-400 mb-1">
            Email <span className="text-neutral-600">(optional)</span>
          </label>
          <input
            id="sale-email"
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            autoComplete="off"
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            placeholder="If they want a receipt"
          />
        </div>
        <div>
          <label htmlFor="sale-phone" className="block text-xs font-medium text-neutral-400 mb-1">
            Phone <span className="text-neutral-600">(optional)</span>
          </label>
          <input
            id="sale-phone"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            autoComplete="off"
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
        </div>
      </div>

      {paymentMethod === "transfer" && (
        <div>
          <label htmlFor="sale-notes" className="block text-xs font-medium text-neutral-400 mb-1">
            Transfer reference <span className="text-neutral-600">(optional)</span>
          </label>
          <input
            id="sale-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            placeholder="Bank slip reference, txn id…"
          />
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-emerald-300/80">Total</span>
        <span className="text-lg font-bold text-emerald-300 tabular-nums">
          ฿{total.toLocaleString()}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !tier}
        className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Recording…
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Record sale
          </>
        )}
      </button>
    </form>
  )
}

// Receipt card shown after a walkup sale lands. Big order reference
// so staff can read it back to the buyer; "Tap to scan" shortcut to
// admit them immediately (or save the reference for later).
function RecentSaleCard({
  order,
  onDismiss,
}: {
  order: CreatedOrder
  onDismiss: () => void
}) {
  return (
    <div className="relative rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-5">
      {/* Dismiss button — staff often wants to clear the receipt
          before the next sale (e.g. line is moving and they want a
          clean slate). Positioned top-right with a generous 44px hit
          area so it's easy to tap on a phone at the door. */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss receipt"
        className="absolute right-1.5 top-1.5 inline-flex h-11 w-11 items-center justify-center rounded-lg text-emerald-200/70 hover:bg-emerald-500/10 hover:text-emerald-100"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold uppercase tracking-wider text-emerald-300">
            Sale recorded
          </p>
          <p className="mt-2 text-sm text-white">
            <strong>{order.guest_name || "Buyer"}</strong>
            <span className="ml-1 text-neutral-400">
              · {order.tier_name ?? "Ticket"} × {order.quantity}
            </span>
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            ฿{order.total_price_thb.toLocaleString()} · {" "}
            <span className="capitalize">{order.payment_method}</span>
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-3 py-1.5 font-mono text-sm font-bold text-amber-300">
            {order.order_reference}
          </p>
          <p className="mt-2 text-[11px] text-emerald-200/70">
            Read this back to the buyer — they can use it at the door
            to be admitted, or you can flip to Camera/Type code and
            scan it now.
          </p>
        </div>
      </div>
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
