import type { Metadata } from "next"
import EducationVisasClient from "./client"
import { BreadcrumbSchema } from "@/components/marketing"

export const metadata: Metadata = {
  title: "Education Visas | Muay Thai Pai",
  description:
    "Learn about visa options for training Muay Thai in Thailand. Student visas, digital nomad visas, and long-term stay options for Muay Thai students.",
  keywords: [
    "Thailand visa",
    "Education visa Thailand",
    "Muay Thai visa",
    "Student visa Thailand",
    "Digital nomad visa",
  ],
  openGraph: {
    title: "Education Visas | Muay Thai Pai",
    description:
      "Learn about visa options for training Muay Thai in Thailand. Student visas, digital nomad visas, and long-term stay options.",
    url: "https://muaythaipai.com/education-visas",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function EducationVisasPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://muaythaipai.com" },
          { name: "Education Visas", url: "https://muaythaipai.com/education-visas" },
        ]}
      />
      <EducationVisasClient />
    </>
  )
}
