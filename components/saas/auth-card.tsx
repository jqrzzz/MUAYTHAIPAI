"use client"

/**
 * AuthCard — the centered card layout used by every login/signup page.
 * Subtle indigo radial glow at the top, OckOck mark, then the form the
 * consumer passes as children. One look across all auth surfaces.
 */
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface AuthCardProps {
  /** Big title at the top of the card. */
  title: string
  /** Smaller helper text below the title. */
  subtitle?: string
  /** Page footer text below the card. */
  footnote?: React.ReactNode
  /** "← Back to site" link target. Default "/". */
  backHref?: string
  /** Hide the back link altogether (e.g. inside an embed). */
  hideBack?: boolean
  children: React.ReactNode
}

export function AuthCard({
  title,
  subtitle,
  footnote,
  backHref = "/",
  hideBack = false,
  children,
}: AuthCardProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-inter antialiased relative overflow-hidden">
      {/* subtle indigo glow at top — restrained, not flashy */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% -10%, rgba(99,102,241,0.10), transparent 60%)",
        }}
      />

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-2 duration-500">
          {!hideBack && (
            <Link
              href={backHref}
              className="inline-flex items-center text-[12px] text-zinc-500 hover:text-zinc-200 mb-8 transition-colors"
            >
              <ArrowLeft className="w-3 h-3 mr-1.5" />
              Back to site
            </Link>
          )}

          {/* brand mark + wordmark */}
          <div className="flex items-center gap-2 mb-7">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-base ring-1 ring-indigo-400/20">
              🐃
            </span>
            <p className="text-[13px] font-semibold tracking-[0.04em] text-zinc-200">
              OckOck
            </p>
          </div>

          <h1 className="text-[26px] font-semibold tracking-tight text-white leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-zinc-500 mt-1.5 leading-relaxed">
              {subtitle}
            </p>
          )}

          <div className="mt-7">{children}</div>

          {footnote && (
            <p className="text-center text-[11px] text-zinc-600 mt-8">
              {footnote}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
