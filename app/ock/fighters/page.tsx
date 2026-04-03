import type { Metadata } from "next"
import FightersClient from "./client"

export const metadata: Metadata = {
  title: "Fighters",
  description:
    "Browse Muay Thai fighters across Thailand. View records, weight classes, and find fighters open to bouts.",
}

export default function OckFightersPage() {
  return <FightersClient />
}
