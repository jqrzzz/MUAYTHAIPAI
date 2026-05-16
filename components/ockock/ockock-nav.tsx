"use client"

/**
 * OckOckNav — the public top nav for the OckOck product site (ockock.app).
 * Dark / indigo / Inter, matching the SaaS dashboards.
 *
 * The OckOck product has two halves and the nav surfaces both:
 *   Browse (consumer): Fights, Fighters — links to /ockock/fights, /ockock/fighters
 *   Business: For Gyms, Pricing — the marketing pages under (ockock)
 *
 * On phones the desktop link row collapses behind a hamburger so the
 * brand mark + primary CTA stay visible. Mobile drawer is a vertical
 * stack of the same links with bigger tap targets.
 */
import Link from "next/link"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"
import { OckOckCta } from "./ockock-cta"

const NAV_LINKS = [
  { href: "/ockock/fights", label: "Fights" },
  { href: "/ockock/fighters", label: "Fighters" },
  { href: "/for-gyms", label: "For Gyms" },
  { href: "/pricing", label: "Pricing" },
] as const

export function OckOckNav() {
  const [open, setOpen] = useState(false)

  // Close the drawer on Escape so keyboard users have a way out
  // without aiming at the close icon. Also locks body scroll while
  // open so the drawer doesn't fight a scrolling background.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-zinc-950/70 backdrop-blur-xl print:hidden">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/ockock"
          onClick={() => setOpen(false)}
          className="group flex shrink-0 items-center gap-2"
        >
          <span className="text-lg leading-none transition-transform group-hover:scale-110">🐃</span>
          <span className="text-[15px] font-semibold tracking-[0.04em] text-zinc-100">OckOck</span>
        </Link>

        {/* Desktop links — hidden on phones, replaced by drawer below */}
        <div className="ml-3 hidden flex-1 items-center gap-5 sm:flex">
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
          {/* Hamburger — only visible on small screens. Mirrors the
              desktop links via the drawer below. */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="ockock-mobile-menu"
            className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-100 transition-colors"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div
          id="ockock-mobile-menu"
          className="sm:hidden border-t border-zinc-900/80 bg-zinc-950"
        >
          <ul className="px-4 py-2">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-[15px] font-medium text-zinc-200 hover:text-amber-300 transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-zinc-900/80 mt-2 pt-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block py-3 text-[14px] text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Log in
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
