"use client"

import DashboardError from "@/components/saas/dashboard-error"

export default function PlatformAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <DashboardError
      error={error}
      reset={reset}
      context="platform-admin"
      homeHref="/platform-admin/today"
      homeLabel="Back to the briefing"
    />
  )
}
