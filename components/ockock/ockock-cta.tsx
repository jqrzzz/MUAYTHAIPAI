/**
 * OckOckCta — a Link styled like the SaaS primary/subtle button. Used for
 * the call-to-action links on the OckOck marketing surface (nav, /for-gyms,
 * /pricing). Mirrors `SaasButton`'s indigo treatment so the product site and
 * the dashboards feel like one system.
 */
import Link from "next/link"
import { cn } from "@/lib/utils"

interface OckOckCtaProps {
  href: string
  children: React.ReactNode
  variant?: "primary" | "subtle"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function OckOckCta({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: OckOckCtaProps) {
  const sizeCls =
    size === "lg"
      ? "h-12 px-7 text-[15px]"
      : size === "sm"
        ? "h-8 px-3 text-[12px]"
        : "h-10 px-5 text-[13px]"

  const variantCls =
    variant === "primary"
      ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset]"
      : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-100 ring-1 ring-white/5"

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
        sizeCls,
        variantCls,
        className,
      )}
    >
      {children}
    </Link>
  )
}
