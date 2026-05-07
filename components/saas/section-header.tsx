/**
 * SectionHeader — eyebrow (uppercase tracked) + title + optional sub +
 * optional right-side action. The repeating top-of-section pattern.
 */
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  eyebrow?: string
  eyebrowIcon?: LucideIcon
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg"
}

export function SectionHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  subtitle,
  action,
  className,
  size = "md",
}: SectionHeaderProps) {
  const titleClass =
    size === "lg"
      ? "text-[28px] font-semibold tracking-tight text-white leading-tight"
      : size === "sm"
        ? "text-[15px] font-semibold tracking-tight text-white"
        : "text-[18px] font-semibold tracking-tight text-white"

  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 inline-flex items-center gap-1.5 mb-0.5">
            {EyebrowIcon && <EyebrowIcon className="h-3 w-3 text-indigo-400" />}
            {eyebrow}
          </p>
        )}
        <h2 className={titleClass}>{title}</h2>
        {subtitle && (
          <p className="text-[12px] text-zinc-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
