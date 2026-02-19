"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function ClassesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Classes page error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">We couldn&apos;t load the classes page. Please try again.</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="outline">
            Go home
          </Button>
        </div>
        {error.digest && <p className="text-xs text-muted-foreground mt-4">Error ID: {error.digest}</p>}
      </div>
    </div>
  )
}
