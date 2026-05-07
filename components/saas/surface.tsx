/**
 * Surface — the base card pattern used throughout the SaaS shell.
 * Subtle elevation via ring (no heavy borders) + backdrop blur for that
 * frosted, premium feel.
 *
 * Pass `interactive` when the surface is clickable — adds hover lift +
 * brighter ring so the affordance is visible without being noisy.
 */
import { cn } from "@/lib/utils"

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: "indigo"
  interactive?: boolean
}

export function Surface({
  accent,
  interactive,
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
        interactive &&
          "transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-zinc-900/60 hover:ring-zinc-800 hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)] cursor-pointer",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
