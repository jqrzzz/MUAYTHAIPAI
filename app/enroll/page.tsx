import type { Metadata } from "next"
import EnrollClient from "./client"

export const metadata: Metadata = {
  title: "Enroll in Certification | Muay Thai Pai — Naga to Garuda",
  description:
    "Sign up for a Muay Thai certification program. Choose your level from Naga to Garuda and begin your journey at a certified gym in Thailand.",
  keywords:
    "Muay Thai certification, enroll, Naga, Phayra Nak, Singha, Hanuman, Garuda, Thailand training, martial arts certification",
  openGraph: {
    title: "Enroll in Muay Thai Certification | Naga to Garuda",
    description: "Choose your level and begin your Muay Thai certification journey in Thailand.",
    images: [{ url: "/images/muay-thai-logo-og.png", width: 1200, height: 630 }],
  },
}

export default function EnrollPage() {
  return <EnrollClient />
}
