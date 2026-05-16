"use client"

/**
 * OckOckNav — the unified top nav for every OckOck surface, used by
 * both layouts:
 *   - app/(ockock)/layout.tsx  (marketing: /for-gyms, /pricing, /about, /vision)
 *   - app/ockock/layout.tsx     (product: /ockock, /ockock/fights, /ockock/fighters, /ockock/promoter)
 *
 * One component, one visual language. Active route gets an amber tint
 * matching the OckOck brand. Mobile collapses to a hamburger drawer.
 *
 * Auth CTAs (Log in / Start free trial) live here because they're
 * the primary conversion paths regardless of which side you're on.
 */
import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, X, Swords, Users, Megaphone, Tag, LayoutDashboard } from "lucide-react"
import { OckOckCta } from "./ockock-cta"

interface NavLink {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  // matchPrefix lets one nav item highlight for both the index and
  // detail routes (e.g. /ockock/fights active for /ockock/fights AND
  // /ockock/fights/[id]).
  matchPrefix?: string
}

const PRIMARY: NavLink[] = [
  { href: "/ockock/fights", label: "Fights", icon: Swords, matchPrefix: "/ockock/fights" },
  { href: "/ockock/fighters", label: "Fighters", icon: Users, matchPrefix: "/ockock/fighters" },
  { href: "/for-gyms", label: "For Gyms", icon: Megaphone },
  { href: "/pricing", label: "Pricing", icon: Tag },
]

// Promoter dashboard — secondary because it's gated. Linked here so
// gym owners who know they need it don't have to guess the URL.
const SECONDARY: NavLink[] = [
  { href: "/ockock/promoter", label: "Promoter", icon: LayoutDashboard, matchPrefix: "/ockock/promoter" },
]

function isActive(pathname: string, link: NavLink): boolean {
  const target = link.matchPrefix ?? link.href
  if (target === "/ockock") return pathname === "/ockock"
  return pathname === target || pathname.startsWith(`${target}/`)
}

export function OckOckNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close drawer on Escape + lock body scroll while open.
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
    <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-zinc-950/85 backdrop-blur-xl print:hidden">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/ockock"
          onClick={() => setOpen(false)}
          className="group flex shrink-0 items-center gap-1.5"
          aria-label="OckOck home"
        >
          <span className="text-lg leading-none transition-transform group-hover:scale-110">🐃</span>
          <span className="text-[15px] font-semibold tracking-[0.04em] text-zinc-100">
            Ock<span className="text-amber-400">Ock</span>
          </span>
        </Link>

        {/* Desktop primary links */}
        <div className="ml-3 hidden flex-1 items-center gap-1 sm:flex">
          {PRIMARY.map((link) => {
            const active = isActive(pathname, link)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-amber-500/15 text-amber-300"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                }`}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right side: secondary + CTAs */}
        <div className="ml-auto flex items-center gap-2">
          {SECONDARY.map((link) => {
            const active = isActive(pathname, link)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`hidden lg:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] transition-colors ${
                  active
                    ? "text-amber-300"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            )
          })}
          <Link
            href="/login"
            className="hidden px-2 text-[13px] text-zinc-400 transition-colors hover:text-zinc-100 sm:inline-flex"
          >
            Log in
          </Link>
          <OckOckCta href="/signup" size="sm">
            Start free trial
          </OckOckCta>
          {/* Hamburger — mobile only */}
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
            {[...PRIMARY, ...SECONDARY].map((link) => {
              const active = isActive(pathname, link)
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 py-3 text-[15px] font-medium transition-colors ${
                      active ? "text-amber-300" : "text-zinc-200 hover:text-amber-300"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </li>
              )
            })}
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
