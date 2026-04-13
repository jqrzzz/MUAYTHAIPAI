"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface SplashScreenProps {
  title: string
  subtitle: string
}

/**
 * Branded intro splash shown for ~2s before the page content fades in.
 * Pair with `useSplash()` and wrap in `<AnimatePresence mode="wait">`. The
 * caller is responsible for the `key` prop so AnimatePresence can track
 * mount/unmount.
 */
export function SplashScreen({ title, subtitle }: SplashScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative z-20 flex items-center justify-center min-h-screen"
    >
      <div className="text-center">
        <motion.h1
          className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {title}
        </motion.h1>
        <motion.p
          className="text-lg font-bold tracking-widest text-amber-800/90 dark:text-amber-200/90"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {subtitle}
        </motion.p>
      </div>
    </motion.div>
  )
}

/**
 * Shows splash for `durationMs`, then flips `showContent` to true.
 * Returns `showContent` so callers can branch on `<AnimatePresence>`.
 */
export function useSplash(durationMs = 2000) {
  const [showContent, setShowContent] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), durationMs)
    return () => clearTimeout(t)
  }, [durationMs])
  return showContent
}
