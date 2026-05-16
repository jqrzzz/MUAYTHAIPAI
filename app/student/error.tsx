"use client"

import DashboardError from "@/components/saas/dashboard-error"

export default function StudentError({
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
      context="student"
      homeHref="/student"
      homeLabel="Back to your home"
    />
  )
}
