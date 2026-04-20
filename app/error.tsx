"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <p className="text-neutral-400">We encountered an unexpected error. You can try again or head back.</p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset} className="bg-orange-600 hover:bg-orange-500">
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline" className="border-neutral-700 text-neutral-300">
              Go Home
            </Button>
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-neutral-600">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
