/**
 * OckOckLayoutShell — the shared chrome used by both OckOck route trees:
 *   - app/(ockock)/  : marketing surface (/for-gyms, /pricing, /about, /vision, /terms, /privacy)
 *   - app/ockock/    : consumer/product surface (/ockock, /ockock/fights, /ockock/fighters, /ockock/promoter)
 *
 * Both trees render the same nav, footer, and floating guide so clicking
 * between marketing pages and product pages doesn't feel like switching
 * brands. Owns: dark zinc base, Inter font (overrides the root's Cinzel),
 * amber accents, dark-only (no theme toggle).
 *
 * If you find yourself adding something here, it should apply to BOTH
 * route trees. Page-specific concerns belong in the page or in a smaller
 * sub-layout.
 */
import type React from "react"
import { OckOckNav } from "@/components/ockock/ockock-nav"
import { OckOckFooter } from "@/components/ockock/ockock-footer"
import { OckOckGuideBubble } from "@/components/ockock/ockock-guide-bubble"

export function OckOckLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-inter text-zinc-100 antialiased">
      <OckOckNav />
      <main className="flex-1">{children}</main>
      <OckOckFooter />
      <OckOckGuideBubble />
    </div>
  )
}
