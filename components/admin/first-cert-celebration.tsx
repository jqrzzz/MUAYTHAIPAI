"use client"

/**
 * First-cert milestone modal.
 *
 * Pops the moment a gym issues its very first verified cert. This is
 * the emotional turning point in the trial → paid arc: the wedge
 * (Naga–Garuda credentialing) just produced its first artifact. Make
 * the moment loud, shareable, and obvious how to keep going.
 *
 * Self-contained — parent passes `cert` to open, `onClose` to dismiss.
 */
import { useState, useEffect } from "react"
import { X, Copy, Check, ExternalLink, Share2 } from "lucide-react"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

interface FirstCertContext {
  certificateNumber: string
  level: string
  studentName?: string | null
  gymName?: string | null
}

const SITE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://muaythaipai.com"

export default function FirstCertCelebration({
  cert,
  onClose,
}: {
  cert: FirstCertContext | null
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!cert) return
    // Close on Escape
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [cert, onClose])

  if (!cert) return null

  const levelConfig = CERTIFICATION_LEVELS.find((l) => l.id === cert.level)
  const verifyUrl = `${SITE_URL}/verify/${cert.certificateNumber}`
  const studentBlurb = cert.studentName ? ` for ${cert.studentName}` : ""
  const shareText = encodeURIComponent(
    `${cert.gymName ?? "Our gym"} just issued its first MUAYTHAIPAI ${
      levelConfig?.name ?? "Muay Thai"
    } certification${studentBlurb}. Verify: ${verifyUrl}`,
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Permissions might block; the visible URL + manual select still works.
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-neutral-950 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top color band tied to the level */}
        <div
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${levelHex(cert.level)} 50%, transparent 100%)`,
          }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-8">
          <p className="text-[10px] font-medium tracking-[0.25em] text-amber-400 uppercase mb-3">
            Milestone · First credential issued
          </p>

          <h2 className="font-display text-[28px] sm:text-[32px] text-white leading-tight">
            Your gym is now part of the lineage.
          </h2>

          <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
            You just signed off your first{" "}
            <span className="text-neutral-200">
              {levelConfig?.name ?? "Muay Thai"} (Level{" "}
              {levelConfig?.number ?? "?"})
            </span>
            {studentBlurb}. It's public, verifiable, and shareable forever — every
            future cert adds to your gym's public record.
          </p>

          {/* Cert preview block */}
          <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">{levelConfig?.icon ?? "🥊"}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-display text-white">
                  {levelConfig?.name ?? cert.level}
                </p>
                <p className="text-[11px] text-neutral-500 font-mono truncate">
                  {cert.certificateNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-neutral-800 bg-black/40 px-2 py-1.5">
              <code className="flex-1 text-[11px] text-neutral-300 font-mono truncate">
                {verifyUrl}
              </code>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition-colors px-1.5 py-0.5 rounded"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share row */}
          <div className="mt-4">
            <p className="text-[11px] text-neutral-500 mb-2 inline-flex items-center gap-1.5">
              <Share2 className="h-3 w-3" />
              Share the moment
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[11px] px-2.5 py-1.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-neutral-600 hover:bg-neutral-800 transition-colors"
              >
                Post to X
              </a>
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[11px] px-2.5 py-1.5 rounded border border-emerald-700/40 bg-emerald-900/20 text-emerald-200 hover:border-emerald-600 transition-colors"
              >
                Send on WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(verifyUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[11px] px-2.5 py-1.5 rounded border border-blue-700/40 bg-blue-900/20 text-blue-200 hover:border-blue-600 transition-colors"
              >
                Share on Facebook
              </a>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="mt-6 flex items-center gap-3">
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-orange-500 text-black font-semibold hover:bg-orange-400 transition-colors"
            >
              View the verify page
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Back to gym
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function levelHex(level: string): string {
  switch (level) {
    case "naga":
      return "#60a5fa"
    case "phayra-nak":
      return "#34d399"
    case "singha":
      return "#fbbf24"
    case "hanuman":
      return "#cbd5e1"
    case "garuda":
      return "#fde047"
    default:
      return "#a1a1aa"
  }
}
