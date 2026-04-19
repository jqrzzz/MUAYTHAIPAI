import type { Metadata } from "next"
import CareersClient from "./client"
import { BreadcrumbSchema } from "@/components/marketing"

export const metadata: Metadata = {
  title: "Careers | Muay Thai Pai",
  description:
    "Build a professional career in Muay Thai. Become a licensed fighter or certified coach through official Thai accreditation at Muay Thai Pai.",
  keywords: [
    "Muay Thai career",
    "Professional fighter Thailand",
    "Muay Thai coach certification",
    "Thai boxing career",
  ],
  openGraph: {
    title: "Careers | Muay Thai Pai",
    description:
      "Build a professional career in Muay Thai. Become a licensed fighter or certified coach through official Thai accreditation.",
    url: "https://muaythaipai.com/careers",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function CareersPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://muaythaipai.com" },
          { name: "Careers", url: "https://muaythaipai.com/careers" },
        ]}
      />
      <CareersClient />
    </>
  )
}
