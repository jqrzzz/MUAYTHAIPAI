import type { Metadata } from "next"
import FighterDetailClient from "./client"

export const metadata: Metadata = {
  title: "Fighter Profile",
  description: "View fighter stats, fight record, and contact their gym.",
}

export default function FighterDetailPage() {
  return <FighterDetailClient />
}
