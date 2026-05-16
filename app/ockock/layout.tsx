/**
 * Layout for the OckOck consumer/product surfaces: /ockock,
 * /ockock/fights, /ockock/fighters, /ockock/promoter, etc.
 *
 * Reuses OckOckLayoutShell so the chrome matches the marketing surface
 * at app/(ockock)/. Anything brand-level (nav, footer, guide bubble)
 * belongs in the shell, not here.
 */
import type React from "react"
import type { Metadata } from "next"
import { OckOckLayoutShell } from "@/components/ockock/ockock-layout-shell"

export const metadata: Metadata = {
  title: {
    default: "OckOck | Muay Thai Fights, Fighters & Events in Thailand",
    template: "%s | OckOck",
  },
  description:
    "Discover Muay Thai fighters, browse upcoming fight events, and buy ringside tickets across Thailand. Powered by OckOck.",
}

export default function OckLayout({ children }: { children: React.ReactNode }) {
  return <OckOckLayoutShell>{children}</OckOckLayoutShell>
}
