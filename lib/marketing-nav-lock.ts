"use client"

/**
 * Lock for the marketing site's fixed bottom nav. When a full-screen
 * modal opens (currently EnhancedPaymentFlow / booking flow), the
 * persistent bottom nav covers the modal's submit area on mobile —
 * users can see the nav but their tap lands on the nav, not the
 * button behind it.
 *
 * Usage:
 *   // From any modal:
 *   useMarketingNavLock()
 *
 *   // From the bottom nav:
 *   const locked = useIsMarketingNavLocked()
 *   if (locked) return null
 *
 * Refcounted so nested modals work — closing the inner one doesn't
 * un-hide the nav if an outer modal is still open.
 */
import { useEffect, useSyncExternalStore } from "react"

let lockCount = 0
const listeners = new Set<() => void>()

function emit() {
  for (const cb of listeners) cb()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot(): boolean {
  return lockCount > 0
}

/** Acquire a lock for the lifetime of the calling component. */
export function useMarketingNavLock(): void {
  useEffect(() => {
    lockCount++
    emit()
    return () => {
      lockCount = Math.max(0, lockCount - 1)
      emit()
    }
  }, [])
}

/** Returns true if any modal is currently asking the nav to hide. */
export function useIsMarketingNavLocked(): boolean {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    // SSR + first client paint should default to "not locked" so the
    // nav renders during hydration; the lock kicks in on the next
    // commit after the modal mounts.
    () => false,
  )
}
