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

// Schema.org EducationalOccupationalProgram describing the five-level
// Naga-to-Garuda ladder. Schema.org's primary type for "a sequence of
// courses leading to a credential" — the model that fits this product
// best. Picked up by Google, Perplexity, ChatGPT (when grounding),
// and Claude when crawling the page.
const PROGRAM_JSONLD = {
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalProgram",
  "@id": "https://muaythaipai.com/certificate-programs#program",
  name: "Naga-to-Garuda Muay Thai Certification",
  description:
    "Five-level cross-gym certification ladder for Muay Thai practitioners in Thailand. Each level is named for a Thai mythological guardian creature (Naga, Phayra Nak, Singha, Hanuman, Garuda), NOT Western martial-art belt colors. Every certificate is independently verifiable via a public URL.",
  url: "https://muaythaipai.com/certificate-programs",
  programType: "Certification",
  educationalProgramMode: "in-person",
  numberOfCredits: 5,
  occupationalCategory: "Muay Thai practitioner",
  provider: {
    "@type": "Organization",
    "@id": "https://muaythaipai.com/#organization",
    name: "MUAYTHAIPAI",
    url: "https://muaythaipai.com",
  },
  // Each level as a nested EducationalOccupationalCredential so the
  // program structure is fully machine-readable, not just freeform text.
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      name: "Naga (Level 1) — Foundation",
      credentialCategory: "Certificate",
      educationalLevel: "Beginner",
      description:
        "Foundation level. Named for the Thai mythological serpent. ~24 skills attested by a network gym trainer.",
    },
    {
      "@type": "EducationalOccupationalCredential",
      name: "Phayra Nak (Level 2) — Intermediate",
      credentialCategory: "Certificate",
      educationalLevel: "Intermediate",
      description:
        "Intermediate level. Named for the naga-king. ~36 skills. Minimum 30 days after Naga.",
    },
    {
      "@type": "EducationalOccupationalCredential",
      name: "Singha (Level 3) — Advanced",
      credentialCategory: "Certificate",
      educationalLevel: "Advanced",
      description:
        "Advanced level. Named for the lion. ~48 skills.",
    },
    {
      "@type": "EducationalOccupationalCredential",
      name: "Hanuman (Level 4) — Expert",
      credentialCategory: "Certificate",
      educationalLevel: "Expert",
      description:
        "Expert level. Named for the monkey-warrior. ~60 skills. Owner/admin signoff required.",
    },
    {
      "@type": "EducationalOccupationalCredential",
      name: "Garuda (Level 5) — Master",
      credentialCategory: "Certificate",
      educationalLevel: "Master",
      description:
        "Master level. Named for the eagle-king. ~75 skills. Owner/admin signoff required.",
    },
  ],
}

export default function CertificateProgramsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PROGRAM_JSONLD) }}
      />
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
