import Link from "next/link"
import type { Metadata } from "next"
import { PageBackground } from "@/components/marketing"

export const metadata: Metadata = {
  title: "Page Not Found | MUAYTHAIPAI",
  description:
    "The page you're looking for doesn't exist. Explore fights, fighters, gyms, or our training programs across the MUAYTHAIPAI network.",
  robots: "noindex, follow",
}

// Universal 404 — same page serves muaythaipai.com (Pai gym), ockock.app
// (OckOck product), and any deep link. CTAs cover all major routes so
// a lost visitor lands somewhere useful regardless of where they were
// trying to go.
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
          This page drifted off the path. Pick where you want to go.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-orange-600 dark:to-amber-600 dark:hover:from-orange-500 dark:hover:to-amber-500 transition-all"
          >
            Home
          </Link>
          <Link
            href="/ockock/fights"
            className="px-6 py-3 rounded-xl font-semibold border border-orange-600/30 dark:border-orange-500/30 text-orange-700 dark:text-amber-300 hover:bg-orange-500/10 transition-colors"
          >
            Fight Events
          </Link>
          <Link
            href="/ockock/fighters"
            className="px-6 py-3 rounded-xl font-semibold border border-orange-600/30 dark:border-orange-500/30 text-orange-700 dark:text-amber-300 hover:bg-orange-500/10 transition-colors"
          >
            Fighters
          </Link>
          <Link
            href="/classes"
            className="px-6 py-3 rounded-xl font-semibold border border-orange-600/30 dark:border-orange-500/30 text-orange-700 dark:text-amber-300 hover:bg-orange-500/10 transition-colors"
          >
            Classes (Pai)
          </Link>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/for-gyms" className="hover:underline underline-offset-4">
            For Gyms
          </Link>
          <span>•</span>
          <Link href="/practitioners" className="hover:underline underline-offset-4">
            Practitioners
          </Link>
          <span>•</span>
          <Link href="/gym" className="hover:underline underline-offset-4">
            Our Gym
          </Link>
          <span>•</span>
          <Link href="/blog" className="hover:underline underline-offset-4">
            Blog
          </Link>
          <span>•</span>
          <Link href="/contact" className="hover:underline underline-offset-4">
            Contact
          </Link>
        </div>
      </main>
    </PageBackground>
  )
}
