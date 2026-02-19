"use client"

import { Button } from "@/components/ui/button"

export default function ApprenticeshipError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Failed to load apprenticeship page</h2>
        <p className="text-muted-foreground">Please try again.</p>
        <Button onClick={reset} variant="default">
          Try again
        </Button>
      </div>
    </div>
  )
}
