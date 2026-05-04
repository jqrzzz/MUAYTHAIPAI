"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function StudentLoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Surface the digest in the console so the cause is recoverable on Vercel
  // even though we don't show it to the user.
  console.error("[student/login] error boundary:", error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 p-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-3">🐃</div>
        <h2 className="text-xl font-bold text-white mb-2">
          Sign-in had a hiccup
        </h2>
        <p className="text-sm text-neutral-400 mb-6">
          OckOck couldn&apos;t load the sign-in page. Try again, or pick a
          different option.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={reset}
            className="bg-orange-500 hover:bg-orange-400 text-white"
          >
            Try again
          </Button>
          <Link
            href="/login"
            className="text-sm text-neutral-400 hover:text-white"
          >
            Choose a different sign-in
          </Link>
        </div>
      </div>
    </div>
  )
}
