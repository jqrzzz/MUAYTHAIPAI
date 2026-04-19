import type { Metadata } from "next"
import ApprenticeshipClient from "./client"
import { BreadcrumbSchema } from "@/components/marketing"

export const metadata: Metadata = {
  title: "Apprenticeship | Muay Thai Pai",
  description:
    "Join the Muay Thai Pai apprenticeship program. Live and train with the Wisarut Family for 6-12 months in authentic traditional Muay Thai immersion.",
  keywords: [
    "Muay Thai apprenticeship",
    "Live-in Muay Thai training",
    "Thailand martial arts apprenticeship",
    "Pai Muay Thai program",
  ],
  openGraph: {
    title: "Apprenticeship | Muay Thai Pai",
    description:
      "Join the Muay Thai Pai apprenticeship program. Live and train with the Wisarut Family for 6-12 months in authentic traditional Muay Thai immersion.",
    url: "https://muaythaipai.com/apprenticeship",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function ApprenticeshipPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://muaythaipai.com" },
          { name: "Apprenticeship", url: "https://muaythaipai.com/apprenticeship" },
        ]}
      />
      <ApprenticeshipClient />
    </>
  )
}
