"use client"

import DashboardError from "@/components/saas/dashboard-error"

export default function AdminError({
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
      context="admin"
      homeHref="/admin"
      homeLabel="Back to your dashboard"
    />
  )
}
