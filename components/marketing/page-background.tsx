import type { ReactNode } from "react"

interface PageBackgroundProps {
  children: ReactNode
}

/**
 * Shared dark/light gradient + orange overlay used across all marketing pages.
 * Replaces ~12 lines of duplicated gradient stack.
 */
export function PageBackground({ children }: PageBackgroundProps) {
  return (
    <div className="min-h-screen overflow-hidden relative transition-all duration-500 bg-gradient-to-b from-neutral-100 via-white to-neutral-50 dark:from-black dark:via-neutral-900 dark:to-black">
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-orange-500/20 via-transparent to-orange-400/15 dark:from-orange-600/25 dark:to-amber-600/20" />
      {children}
    </div>
  )
}
