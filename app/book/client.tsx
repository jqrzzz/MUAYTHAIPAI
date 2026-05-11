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
        <div className="mx-auto max-w-3xl px-5 py-4">
          <Link
            href={gymSlug !== "wisarut-family-gym" ? `/gyms/${gymSlug}` : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <p className="font-display text-[11px] uppercase tracking-[0.24em] text-neutral-500 mb-2">
            Reserve Your Spot
          </p>
          <h1 className="font-display text-[34px] sm:text-[44px] leading-tight text-white">
            Book Your Training
          </h1>
          <p className="font-serif italic text-[15px] sm:text-[17px] text-neutral-400 mt-2 max-w-xl mx-auto">
            Pick a session, pay securely, train hard. We&apos;ll see you on the mats.
          </p>
        </div>
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
