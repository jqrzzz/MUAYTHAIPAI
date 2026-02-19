import type { Metadata } from "next"
import CertificateProgramsClient from "./client"

export const metadata: Metadata = {
  title: "Muay Thai Certification Programs — Naga to Garuda | Pai Thailand",
  description:
    "Train authentic Muay Thai in Thailand. Earn 5 levels of certification from Naga to Garuda through immersive, myth-inspired coursework at Wisarut Family Gym.",
  keywords: [
    "Muay Thai certification",
    "Muay Thai courses Thailand",
    "Muay Thai training programs",
    "Thai boxing certificate",
    "Pai Thailand training",
  ],
  openGraph: {
    title: "Muay Thai Certification Programs — Naga to Garuda | Pai Thailand",
    description:
      "Train authentic Muay Thai in Thailand. Earn 5 levels of certification from Naga to Garuda through immersive, myth-inspired coursework at Wisarut Family Gym.",
    url: "https://muaythaipai.com/certificate-programs",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function CertificateProgramsPage() {
  return <CertificateProgramsClient />
}
