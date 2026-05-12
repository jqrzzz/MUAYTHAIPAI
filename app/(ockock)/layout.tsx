/**
 * Layout for the OckOck product site (ockock.app) — the public marketing
 * surface: /for-gyms, /pricing. NOT the dashboards (those live under /admin
 * etc. with the SaaS shell) and NOT the Pai gym site (that keeps its own
 * marketing chrome at the app root).
 *
 * This owns the OckOck look so the pages stay simple: dark zinc base, Inter
 * font (overriding the root's Cinzel), indigo accents, OckOck nav + footer.
 * Dark-only by design — matches the SaaS dashboards; no theme toggle here.
 */
import type { Metadata } from "next"
import { OckOckNav } from "@/components/ockock/ockock-nav"
import { OckOckFooter } from "@/components/ockock/ockock-footer"

export const metadata: Metadata = {
  // Pages override title/description; this just sets the OG site name.
  openGraph: { siteName: "OckOck" },
}

export default function OckOckLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-inter text-zinc-100 antialiased">
      <OckOckNav />
      <main className="flex-1">{children}</main>
      <OckOckFooter />
    </div>
  )
}
