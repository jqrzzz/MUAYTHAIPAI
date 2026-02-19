"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"

interface InternalLink {
  href: string
  text: string
}

interface InternalLinksProps {
  links?: InternalLink[]
}

const DEFAULT_LINKS: InternalLink[] = [
  { href: "/classes", text: "Explore our Muay Thai classes" },
  { href: "/train-and-stay", text: "Learn about our Train & Stay packages" },
  { href: "/gym", text: "Visit our gym facilities" },
  { href: "/faq", text: "Read our FAQ" },
  { href: "/certificate-programs", text: "Discover our certificate programs" },
]

export function InternalLinks({ links }: InternalLinksProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"
  const displayLinks = links || DEFAULT_LINKS.slice(0, 2)

  return (
    <div className={`mt-4 p-4 rounded-lg ${resolvedTheme === "dark" ? "bg-white/5" : "bg-black/5"}`}>
      <p className={`text-sm font-medium mb-2 ${resolvedTheme === "dark" ? "text-amber-300" : "text-amber-700"}`}>
        Related:
      </p>
      <div className="flex flex-wrap gap-2">
        {displayLinks.map((link) => (
          <Link key={link.href} href={link.href} className="text-primary underline-offset-4 hover:underline text-sm">
            {link.text}
          </Link>
        ))}
      </div>
    </div>
  )
}
