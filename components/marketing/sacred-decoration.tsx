"use client"

import { motion } from "framer-motion"

const STAR_SVG_LIGHT =
  "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L60 30 L90 30 L65 50 L75 80 L50 65 L25 80 L35 50 L10 30 L40 30 Z' fill='none' stroke='%23000000' strokeWidth='0.5'/%3E%3C/svg%3E\")"

const STAR_SVG_DARK =
  "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L60 30 L90 30 L65 50 L75 80 L50 65 L25 80 L35 50 L10 30 L40 30 Z' fill='none' stroke='%23ffffff' strokeWidth='0.5'/%3E%3C/svg%3E\")"

const STAR_BASE_STYLE = {
  backgroundSize: "200px 200px",
  backgroundPosition: "center",
  opacity: 0.05,
} as const

/**
 * Subtle sacred-star tiled background plus five slow-pulsing amber light rays.
 * Used as ambient decoration behind page content. Renders two stacked layers and
 * toggles between them via Tailwind's `dark:` variant, so no JS theme lookup is
 * required.
 */
export function SacredDecoration() {
  return (
    <>
      {/* Subtle Sacred Background */}
      <div className="absolute inset-0 z-5 opacity-10">
        <div
          className="absolute inset-0 dark:hidden"
          style={{ ...STAR_BASE_STYLE, backgroundImage: STAR_SVG_LIGHT }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{ ...STAR_BASE_STYLE, backgroundImage: STAR_SVG_DARK }}
        />
      </div>

      {/* Light Rays */}
      <div className="absolute inset-0 z-5 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 w-20 h-screen bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-500/5 dark:via-orange-500/3"
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
            style={{
              left: `${10 + i * 20}%`,
              transformOrigin: "top",
            }}
          />
        ))}
      </div>
    </>
  )
}
