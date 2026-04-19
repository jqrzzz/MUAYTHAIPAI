import Link from "next/link"
import type { Metadata } from "next"
import { PageBackground } from "@/components/marketing"

export const metadata: Metadata = {
  title: "Page Not Found | Muay Thai Pai",
  description:
    "The page you're looking for doesn't exist. Return to Muay Thai Pai to explore our gym, classes, and training programs in Pai, Thailand.",
  robots: "noindex, follow",
}

export default function NotFound() {
  return (
    <PageBackground>
      <main className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-semibold tracking-[0.3em] text-amber-700 dark:text-amber-300 mb-4">
          404 — OFF THE PATH
        </p>
        <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500">
          Page Not Found
        </h1>
        <p className="max-w-xl text-base md:text-lg text-gray-700 dark:text-gray-300 mb-10">
          This page drifted off the path. Let&apos;s get you back to the gym.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-orange-600 dark:to-amber-600 dark:hover:from-orange-500 dark:hover:to-amber-500 transition-all"
          >
            Return Home
          </Link>
          <Link
            href="/classes"
            className="px-6 py-3 rounded-xl font-semibold border border-orange-600/30 dark:border-orange-500/30 text-orange-700 dark:text-amber-300 hover:bg-orange-500/10 transition-colors"
          >
            View Classes
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-xl font-semibold border border-orange-600/30 dark:border-orange-500/30 text-orange-700 dark:text-amber-300 hover:bg-orange-500/10 transition-colors"
          >
            Contact Us
          </Link>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/gym" className="hover:underline underline-offset-4">
            Our Gym
          </Link>
          <span>•</span>
          <Link href="/train-and-stay" className="hover:underline underline-offset-4">
            Train &amp; Stay
          </Link>
          <span>•</span>
          <Link href="/blog" className="hover:underline underline-offset-4">
            Blog
          </Link>
          <span>•</span>
          <Link href="/faq" className="hover:underline underline-offset-4">
            FAQ
          </Link>
        </div>
      </main>
    </PageBackground>
  )
}
