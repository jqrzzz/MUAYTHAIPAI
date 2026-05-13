"use client"

import DashboardError from "@/components/saas/dashboard-error"

export default function TrainerError({
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
      context="trainer"
      homeHref="/trainer"
      homeLabel="Back to today"
    />
  )
}
