"use client"

/**
 * Error boundary for the /ockock consumer surfaces (fights,
 * fighters, promoter). Without this, any thrown error during
 * render falls through to a blank screen — the user reported
 * exactly that. Now a thrown error shows a friendly card with a
 * Try Again + Back Home action.
 */
import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function OckOckError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to the server side so we can spot recurring crashes in
    // Vercel logs even when the user retries.
    console.error("[ockock error boundary]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-neutral-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
        </div>
        <h1 className="text-lg font-semibold text-white">Something hiccuped</h1>
        <p className="mt-2 text-sm text-neutral-400">
          This page hit an error. Most often it&apos;s a temporary glitch.
          Try again, and if it keeps happening let us know.
        </p>
        {error.digest && (
          <p className="mt-2 text-[10px] text-neutral-600 font-mono">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
          <Link
            href="/ockock"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Back to OckOck
          </Link>
        </div>
      </div>
    </div>
  )
}
