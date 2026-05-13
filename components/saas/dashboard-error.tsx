"use client"

/**
 * Shared error boundary for the operator dashboards (admin, trainer, student,
 * platform-admin). Each section's app/<section>/error.tsx is a tiny wrapper
 * around this — same look, just a different "back to" link.
 */
import Link from "next/link"
import { useEffect } from "react"
import { RefreshCw } from "lucide-react"

export default function DashboardError({
  error,
  reset,
  homeHref,
  homeLabel,
  context,
  title = "Something hiccuped.",
  body = "OckOck couldn't load that just now. Most likely it'll work on a retry.",
}: {
  error: Error & { digest?: string }
  reset: () => void
  homeHref: string
  homeLabel: string
  /** Tag used in the console log so failures are findable per surface. */
  context: string
  title?: string
  body?: string
}) {
  useEffect(() => {
    console.error(`[${context}] error boundary:`, error)
  }, [error, context])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-inter text-zinc-100 antialiased">
      <div className="max-w-md text-center">
        <div className="mb-5 text-5xl">🐃</div>
        <h2 className="font-display text-[22px] font-semibold text-white">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-zinc-400">{body}</p>
        <div className="mt-7 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-indigo-500 px-5 text-[14px] font-medium text-white transition-colors hover:bg-indigo-400"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link href={homeHref} className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-200">
            {homeLabel}
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 font-mono text-[11px] text-zinc-700">ref: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
