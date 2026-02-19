import type { Metadata } from "next"
import GymPageClient from "./client"

export const metadata: Metadata = {
  title: "About Muay Thai Pai | Third-Generation Family Gym in Thailand",
  description:
    "Meet Kru Wisarut and the Muay Thai Pai family. Featured in National Geographic, our third-generation gym preserves traditional Thai boxing culture in Pai, Thailand since 1975.",
  keywords:
    "kru wisarut, muay thai pai gym, traditional muay thai gym, national geographic muay thai, family muay thai gym thailand, pai gym history",
  openGraph: {
    title: "About Muay Thai Pai | Third-Generation Family Gym",
    description:
      "Meet Kru Wisarut and the family behind Muay Thai Pai. Featured in National Geographic, preserving traditional Muay Thai since 1975.",
    url: "https://www.muaythaipai.com/gym",
  },
}

export default function GymPage() {
  return <GymPageClient />
}
