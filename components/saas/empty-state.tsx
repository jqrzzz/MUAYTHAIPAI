/**
 * EmptyState — friendly "nothing here" rendering.
 * Used inside a `<Surface>` wrapper to keep visual hierarchy consistent.
 */
import type { LucideIcon } from "lucide-react"
import { Surface } from "./surface"
import { toneStyles, type SaasTone } from "@/lib/saas-design"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  tone?: SaasTone
  action?: React.ReactNode
  /** When false, renders without a `<Surface>` wrapper. Default true. */
  withSurface?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = "zinc",
  action,
  withSurface = true,
}: EmptyStateProps) {
  const styles = toneStyles[tone]
  const inner = (
    <div className="px-4 py-6 flex items-center gap-3">
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${styles.iconBg}`}
      >
        <Icon className={`h-4 w-4 ${styles.iconColor}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-white">{title}</p>
        {description && (
          <p className="text-[12px] text-zinc-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
  return withSurface ? <Surface>{inner}</Surface> : inner
}
