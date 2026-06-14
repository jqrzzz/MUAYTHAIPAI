import type { Metadata } from "next"
import { redirect } from "next/navigation"
import FightersClient from "./client"
import { NETWORK_FEATURES_ENABLED } from "@/lib/features"

export const metadata: Metadata = {
  title: "Fighters",
  description:
    "Browse Muay Thai fighters across Thailand. View records, weight classes, and find fighters open to bouts.",
}

export default function OckFightersPage() {
  // Single-gym mode: the cross-gym fighter registry is hidden; send visitors
  // to the gym's own "Our Fighters" showcase. Reversible via
  // NEXT_PUBLIC_ENABLE_NETWORK_FEATURES (see lib/features.ts).
  if (!NETWORK_FEATURES_ENABLED) {
    redirect("/fighters")
  }
  return <FightersClient />
}
