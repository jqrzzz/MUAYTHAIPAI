"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Swords, Users, Home, LayoutDashboard, Megaphone, Tag } from "lucide-react"

// Browse-first primary nav. Promoter dashboard sits alongside since
// gym owners often use both sides — they look at the same product
// from both the consumer and seller end.
const navItems = [
  { href: "/ockock", label: "Home", icon: Home },
  { href: "/ockock/fights", label: "Fights", icon: Swords },
  { href: "/ockock/fighters", label: "Fighters", icon: Users },
  { href: "/ockock/promoter", label: "Promoter", icon: LayoutDashboard },
]

// Cross-links into the marketing layout so a visitor on the consumer
// side can still find the SaaS pitch + pricing. Rendered with a slim
// separator so they read as secondary to the browse links.
const secondaryNavItems = [
  { href: "/for-gyms", label: "For Gyms", icon: Megaphone },
  { href: "/pricing", label: "Pricing", icon: Tag },
]

export function OckockHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/ockock" className="flex items-center gap-2">
          <span className="text-2xl">🐃</span>
          <span className="text-xl font-bold text-white">
            Ock<span className="text-amber-400">Ock</span>
          </span>
        </Link>

        {/* Nav — primary browse links + slim separator + secondary
            cross-links into the marketing layout. */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/ockock"
                ? pathname === "/ockock"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
          <span
            aria-hidden
            className="hidden sm:block mx-1 h-5 w-px bg-white/10"
          />
          {secondaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
