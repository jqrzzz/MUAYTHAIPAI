"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { ArrowLeft, Moon, Sun } from "lucide-react"

interface MarketingTopNavProps {
  backHref?: string
  backLabel?: string
}

const ROUND_BUTTON =
  "backdrop-blur-md rounded-full p-3 border transition-colors bg-black/10 border-black/20 hover:bg-black/20 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20"
const ICON_COLOR = "w-5 h-5 text-orange-600 dark:text-amber-400"

/**
 * Standard top nav for marketing sub-pages: back button on the left,
 * theme toggle on the right.
 */
export function MarketingTopNav({ backHref = "/", backLabel = "Back to home" }: MarketingTopNavProps) {
  const { theme, setTheme } = useTheme()
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Link href={backHref} className={ROUND_BUTTON} aria-label={backLabel}>
          <ArrowLeft className={ICON_COLOR} />
        </Link>
      </motion.div>

      <motion.button
        onClick={toggleTheme}
        className={ROUND_BUTTON}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-orange-600" />
        )}
      </motion.button>
    </div>
  )
}
