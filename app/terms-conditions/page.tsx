import type { Metadata } from "next"
import { TermsConditionsClient } from "./client"

export const metadata: Metadata = {
  title: "Terms and Conditions | Muay Thai Pai",
  description: "Terms and conditions for Muay Thai Pai training camp in Thailand.",
  robots: "noindex, follow",
  openGraph: {
    title: "Terms and Conditions | Muay Thai Pai",
    description: "Terms and conditions for Muay Thai Pai training camp in Thailand.",
    url: "https://muaythaipai.com/terms-conditions",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function TermsConditionsPage() {
  return <TermsConditionsClient />
}
