/**
 * Layout for the OckOck consumer/product surfaces (/ockock, /ockock/fights,
 * /ockock/fighters, /ockock/promoter, etc.). Uses the SAME chrome as the
 * marketing layout (app/(ockock)/layout.tsx) so visitors see a consistent
 * brand whether they're on /for-gyms or /ockock/fights — no jumping
 * between two visually distinct headers when clicking around.
 *
 * Owns: dark zinc base + Inter font (overrides root Cinzel) + the
 * unified OckOckNav, OckOckFooter, and OckOckGuideBubble. Dark-only.
 */
import type React from "react"
import type { Metadata } from "next"
import { OckOckNav } from "@/components/ockock/ockock-nav"
import { OckOckFooter } from "@/components/ockock/ockock-footer"
import { OckOckGuideBubble } from "@/components/ockock/ockock-guide-bubble"

export const metadata: Metadata = {
  title: {
    default: "OckOck | Muay Thai Fights, Fighters & Events in Thailand",
    template: "%s | OckOck",
  },
  description:
    "Discover Muay Thai fighters, browse upcoming fight events, and buy ringside tickets across Thailand. Powered by OckOck.",
}

export default function OckLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-inter text-zinc-100 antialiased">
      <OckOckNav />
      <main className="flex-1">{children}</main>
      <OckOckFooter />
      <OckOckGuideBubble />
    </div>
  )
}
