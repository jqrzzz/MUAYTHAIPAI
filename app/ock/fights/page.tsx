import type { Metadata } from "next"
import FightsClient from "./client"

export const metadata: Metadata = {
  title: "Fight Events",
  description:
    "Browse upcoming Muay Thai fight events across Thailand. See fight cards, venues, and buy tickets.",
}

export default function OckFightsPage() {
  return <FightsClient />
}
