"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"

const SPLASH_SEEN_KEY = "muaythaipai:splash-seen"
const SPLASH_DURATION_MS = 2000

function markSeen() {
  try {
    sessionStorage.setItem(SPLASH_SEEN_KEY, "1")
  } catch {
    /* private mode / storage disabled — splash just shows next time */
  }
}

/**
 * Controls the one-time branded splash for marketing pages.
 *
 * Behavior:
 * - first visit in a tab session: splash for 2s, then content fades in
 * - subsequent navigations in the same session: no splash, instant content
 * - `prefers-reduced-motion: reduce`: no splash, instant content
 * - tap/Enter/Space/Escape during splash: dismiss immediately
 *
 * Returns `showContent` (true once splash is done/skipped) and `dismiss`
 * (wire into `<SplashScreen onSkip={dismiss} />` for tap-to-skip).
 */
export function useSplash() {
  const [showContent, setShowContent] = useState(false)

  const dismiss = useCallback(() => {
    setShowContent(true)
    markSeen()
  }, [])

  useEffect(() => {
    let alreadySeen = false
    try {
      alreadySeen = sessionStorage.getItem(SPLASH_SEEN_KEY) === "1"
    } catch {
      /* noop */
    }

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

    if (alreadySeen || reducedMotion) {
      setShowContent(true)
      markSeen()
      return
    }

    const t = setTimeout(() => {
      setShowContent(true)
      markSeen()
    }, SPLASH_DURATION_MS)
    return () => clearTimeout(t)
  }, [])

  return { showContent, dismiss }
}

interface SplashScreenProps {
  /** Called on click/Enter/Space/Escape. Pair with `dismiss` from useSplash. */
  onSkip?: () => void
}

/**
 * Canonical branded intro: "MUAY THAI PAI" / "PAI • THAILAND".
 * Driven by `useSplash()`; wrap in `<AnimatePresence mode="wait">`. The
 * caller is responsible for supplying the `key` prop.
 */
export function SplashScreen({ onSkip }: SplashScreenProps) {
  useEffect(() => {
    if (!onSkip) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter" || e.key === "Escape") {
        e.preventDefault()
        onSkip()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onSkip])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onClick={onSkip}
      role={onSkip ? "button" : undefined}
      aria-label={onSkip ? "Skip intro" : undefined}
      className={`relative z-20 flex items-center justify-center min-h-screen ${onSkip ? "cursor-pointer" : ""}`}
    >
      <div className="text-center">
        <motion.h1
          className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          MUAY THAI PAI
        </motion.h1>
        <motion.p
          className="text-lg font-bold tracking-widest text-amber-800/90 dark:text-amber-200/90"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          PAI • THAILAND
        </motion.p>
        {onSkip && (
          <motion.p
            className="mt-12 text-xs font-medium tracking-widest text-amber-700/50 dark:text-amber-300/40 uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            Tap to skip
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}
