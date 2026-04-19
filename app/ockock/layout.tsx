import type React from "react"
import type { Metadata } from "next"
import { OckockHeader } from "./ockock-header"

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
    <div className="min-h-screen bg-[#0a0a0f]">
      <OckockHeader />
      <main>{children}</main>
    </div>
  )
}
