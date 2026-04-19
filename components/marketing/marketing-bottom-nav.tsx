"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Heart, MessageCircle, BoxIcon as Boxing, Dumbbell, Menu } from "lucide-react"
import { MoreMenu } from "@/components/more-menu"

export type MarketingNavKey = "family" | "classes" | "gym" | "contact"

const items = [
  { key: "family" as const, icon: Heart, label: "Family", href: "/" },
  { key: "classes" as const, icon: Boxing, label: "Classes", href: "/classes" },
  { key: "gym" as const, icon: Dumbbell, label: "Gym", href: "/gym" },
  { key: "contact" as const, icon: MessageCircle, label: "Contact", href: "/contact" },
]

interface MarketingBottomNavProps {
  active?: MarketingNavKey
}

/**
 * Fixed bottom navigation present on every marketing sub-page.
 * Owns the MoreMenu state so callers don't have to.
 */
export function MarketingBottomNav({ active }: MarketingBottomNavProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t bg-white/90 border-gray-200 dark:bg-black/80 dark:border-white/10"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1.1, duration: 0.8 }}
      >
        <div className="flex justify-around py-3 px-4">
          {items.map((item) => {
            const isActive = item.key === active
            const colorClass = isActive
              ? "text-orange-600 dark:text-amber-400"
              : "text-gray-500 dark:text-gray-400"
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center gap-1 ${colorClass}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
          <motion.button
            onClick={() => setShowMore(true)}
            className="text-gray-500 dark:text-gray-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Open more menu"
          >
            <div className="flex flex-col items-center gap-1">
              <Menu className="w-5 h-5" />
              <span className="text-xs font-medium">More</span>
            </div>
          </motion.button>
        </div>
      </motion.div>
      <MoreMenu isOpen={showMore} onClose={() => setShowMore(false)} />
    </>
  )
}
