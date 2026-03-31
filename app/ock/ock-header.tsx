"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Swords, Users, Home } from "lucide-react"

const navItems = [
  { href: "/ock", label: "Home", icon: Home },
  { href: "/ock/fights", label: "Fights", icon: Swords },
  { href: "/ock/fighters", label: "Fighters", icon: Users },
]

export function OckHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/ock" className="flex items-center gap-2">
          <span className="text-2xl">🐃</span>
          <span className="text-xl font-bold text-white">
            Ock<span className="text-amber-400">Ock</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/ock"
                ? pathname === "/ock"
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
        </nav>
      </div>
    </header>
  )
}
