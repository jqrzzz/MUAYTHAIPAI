/**
 * SaasShell — the outermost wrapper for any SaaS page (admin, trainer,
 * student, platform-admin). Sets the font, base bg, and renders the
 * impersonation banner. Wrap your page's content in this.
 *
 * `<SaasHeader>` is the optional sticky frosted header pattern that goes
 * inside the shell. Use it for the greeting + right-side action row.
 */
import { cn } from "@/lib/utils"
import ImpersonationBanner from "@/components/impersonation-banner"

export function SaasShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-zinc-950 text-zinc-100 font-inter antialiased overflow-x-hidden",
        className,
      )}
    >
      <ImpersonationBanner />
      {children}
    </div>
  )
}

interface SaasHeaderProps {
  /** Left-side content. Usually a status dot + greeting line. */
  left?: React.ReactNode
  /** Right-side action(s). Usually a link or button. */
  right?: React.ReactNode
  /** Constrain the inner row to this max width. */
  maxWidth?: string
}

export function SaasHeader({
  left,
  right,
  maxWidth = "max-w-3xl",
}: SaasHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-900/80 bg-zinc-950/70 backdrop-blur-xl">
      <div className={cn("mx-auto px-5 h-14 flex items-center gap-4", maxWidth)}>
        <div className="flex items-center gap-2 min-w-0 flex-1">{left}</div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  )
}

/**
 * StatusDot — small glowing dot for "all systems go" / "attention" states.
 * Use it inside `<SaasHeader left>` to give the operator a one-glance
 * health indicator.
 */
export function StatusDot({
  tone = "emerald",
}: {
  tone?: "emerald" | "amber" | "red"
}) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
      : tone === "amber"
        ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
        : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"
  return <span className={`inline-flex h-1.5 w-1.5 rounded-full ${cls}`} />
}
