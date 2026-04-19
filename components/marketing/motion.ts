/**
 * Shared framer-motion transition tokens for marketing pages.
 *
 * Only values that repeat verbatim across ≥3 pages are tokenized here. Page-
 * specific entry-choreography delays (0.7s/0.9s/1.1s cascading titles) stay
 * inline since they drift per page and are intentional per-page timing.
 */

import type { Transition } from "framer-motion"

/**
 * Post-splash content fade-in. Wraps the main `<motion.div>` that replaces
 * the splash screen in the AnimatePresence swap. 1s is slow on purpose — it
 * pairs with the 2s splash to feel like a deliberate reveal, not a flash.
 */
export const CONTENT_FADE_IN: Transition = { duration: 1, ease: "easeOut" }

/**
 * Accordion expand/collapse for cards with a hidden details panel
 * (certificate programs, train-and-stay, blog, FAQ, etc.).
 */
export const EXPAND_COLLAPSE: Transition = { duration: 0.3 }
