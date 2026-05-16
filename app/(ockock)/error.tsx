"use client"

/**
 * Error boundary for the OckOck marketing routes (/for-gyms,
 * /pricing, /about, /vision, /terms, /privacy). Catches any thrown
 * error during render so visitors don't see a blank page.
 */
import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function OckOckMarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[ockock marketing error boundary]", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30">
          <AlertTriangle className="h-6 w-6 text-indigo-300" />
        </div>
        <h1 className="text-lg font-semibold text-white">Something hiccuped</h1>
        <p className="mt-2 text-sm text-zinc-400">
          This page hit an error. Try again, or head back to the OckOck
          homepage.
        </p>
        {error.digest && (
          <p className="mt-2 text-[10px] text-zinc-600 font-mono">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
          <Link
            href="/for-gyms"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            OckOck home
          </Link>
        </div>
      </div>
    </div>
  )
}
