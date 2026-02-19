import type { Metadata } from "next"
import { PrivacyPolicyClient } from "./client"

export const metadata: Metadata = {
  title: "Privacy Policy | Muay Thai Pai",
  description: "Privacy policy for Muay Thai Pai training camp in Thailand.",
  robots: "noindex, follow",
  openGraph: {
    title: "Privacy Policy | Muay Thai Pai",
    description: "Privacy policy for Muay Thai Pai training camp in Thailand.",
    url: "https://muaythaipai.com/privacy-policy",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />
}
