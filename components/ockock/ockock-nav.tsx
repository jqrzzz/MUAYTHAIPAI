/**
 * OckOckNav — the public top nav for the OckOck product site (ockock.app).
 * Dark / indigo / Inter, matching the SaaS dashboards. Server component:
 * just links, no client state. On mobile it collapses to the wordmark plus
 * the primary CTA (the landing page scrolls through everything anyway).
 */
import Link from "next/link"
import { OckOckCta } from "./ockock-cta"

const NAV_LINKS = [
  { href: "/for-gyms#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
] as const

export function OckOckNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-zinc-950/70 backdrop-blur-xl print:hidden">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/for-gyms" className="group flex shrink-0 items-center gap-2">
          <span className="text-lg leading-none transition-transform group-hover:scale-110">🐃</span>
          <span className="text-[15px] font-semibold tracking-[0.04em] text-zinc-100">OckOck</span>
        </Link>

        <div className="ml-4 hidden flex-1 items-center gap-6 sm:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13px] text-zinc-400 transition-colors hover:text-zinc-100"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="hidden px-2 text-[13px] text-zinc-400 transition-colors hover:text-zinc-100 sm:inline-flex"
          >
            Log in
          </Link>
          <OckOckCta href="/signup" size="sm">
            Start free trial
          </OckOckCta>
        </div>
      </nav>
    </header>
  )
}
