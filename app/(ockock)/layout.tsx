/**
 * Layout for the OckOck marketing surface: /for-gyms, /pricing, /about,
 * /vision, /terms, /privacy. NOT the dashboards (those live under /admin
 * etc. with the SaaS shell) and NOT the Pai gym site (that keeps its
 * own marketing chrome at the app root).
 *
 * The actual chrome lives in OckOckLayoutShell so the consumer surface
 * (app/ockock/) can wear the same wrapper without copy-paste.
 */
import type { Metadata } from "next"
import { OckOckLayoutShell } from "@/components/ockock/ockock-layout-shell"

export const metadata: Metadata = {
  openGraph: { siteName: "OckOck" },
}

export default function OckOckLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <OckOckLayoutShell>{children}</OckOckLayoutShell>
}
