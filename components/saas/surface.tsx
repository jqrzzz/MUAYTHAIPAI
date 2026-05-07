/**
 * Surface — the base card pattern used throughout the SaaS shell.
 * Subtle elevation via ring (no heavy borders) + backdrop blur for that
 * frosted, premium feel.
 */
import { cn } from "@/lib/utils"

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: "indigo"
}

export function Surface({
  accent,
  className,
  children,
  ...rest
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-xl backdrop-blur-sm overflow-hidden",
        accent === "indigo"
          ? "bg-gradient-to-b from-indigo-500/[0.04] to-zinc-900/40 ring-1 ring-indigo-500/20"
          : "bg-zinc-900/40 ring-1 ring-zinc-900",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
