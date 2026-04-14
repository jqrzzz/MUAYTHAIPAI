import type { Metadata } from "next"
import CertificateProgramsClient from "./client"
import { BreadcrumbSchema } from "@/components/marketing"

export const metadata: Metadata = {
  title: "Muay Thai Certification Programs — Naga to Garuda | MUAYTHAIPAI Network",
  description:
    "Earn 5 levels of Muay Thai certification from Naga to Garuda. A standardized, verifiable training system recognized across the MUAYTHAIPAI gym network in Thailand.",
  keywords: [
    "Muay Thai certification",
    "Muay Thai courses Thailand",
    "Muay Thai training programs",
    "Thai boxing certificate",
    "Naga to Garuda",
    "MUAYTHAIPAI network",
  ],
  openGraph: {
    title: "Muay Thai Certification Programs — Naga to Garuda | MUAYTHAIPAI Network",
    description:
      "Earn 5 levels of Muay Thai certification from Naga to Garuda. A standardized, verifiable training system recognized across the MUAYTHAIPAI gym network in Thailand.",
    url: "https://muaythaipai.com/certificate-programs",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function CertificateProgramsPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://muaythaipai.com" },
          { name: "Certificate Programs", url: "https://muaythaipai.com/certificate-programs" },
        ]}
      />
      <CertificateProgramsClient />
    </>
  )
}
