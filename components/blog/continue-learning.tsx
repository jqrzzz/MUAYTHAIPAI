"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"

interface ContinueLearningProps {
  excludeLinks?: string[]
}

const ALL_LINKS = [
  { href: "/blog", label: "Read training articles" },
  { href: "/train-and-stay", label: "Train & Stay in Pai" },
  { href: "/classes", label: "Muay Thai Classes" },
  { href: "/certificate-programs", label: "Certificate Programs" },
  { href: "/gym", label: "Visit Our Gym" },
  { href: "/faq", label: "Frequently Asked Questions" },
]

export function ContinueLearning({ excludeLinks = [] }: ContinueLearningProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  // Filter out excluded links and take up to 3
  const linksToShow = ALL_LINKS.filter((link) => !excludeLinks.includes(link.href)).slice(0, 3)

  return (
    <div
      className={`mt-12 border-t pt-8 space-y-3 text-sm ${
        resolvedTheme === "dark" ? "border-white/10" : "border-gray-200"
      }`}
    >
      <p className={`font-semibold ${resolvedTheme === "dark" ? "text-amber-300" : "text-amber-700"}`}>
        Continue Learning
      </p>
      {linksToShow.map((link) => (
        <p key={link.href}>
          <Link href={link.href} className="text-primary hover:underline underline-offset-4">
            {link.label}
          </Link>
        </p>
      ))}
    </div>
  )
}
