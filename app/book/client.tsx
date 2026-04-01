"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { BookingSection } from "@/components/booking-section"

function BookContent() {
  const searchParams = useSearchParams()
  const gymSlug = searchParams.get("gym") || "wisarut-family-gym"

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href={gymSlug !== "wisarut-family-gym" ? `/gyms/${gymSlug}` : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <BookingSection gymSlug={gymSlug} />
      </main>
    </div>
  )
}

export default function BookClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      }
    >
      <BookContent />
    </Suspense>
  )
}
