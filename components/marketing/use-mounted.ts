"use client"

import { useEffect, useState } from "react"

/**
 * Returns true after the component has mounted on the client. Guards against
 * hydration mismatches when rendering theme-dependent or window-dependent content.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}
