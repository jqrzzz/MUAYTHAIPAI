import type { Metadata } from "next"
import FightDetailClient from "./client"

export const metadata: Metadata = {
  title: "Fight Event",
  description: "View fight card details, bouts, and buy tickets for this Muay Thai event.",
}

export default function FightDetailPage() {
  return <FightDetailClient />
}
