import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Muay Thai Career Path | Become a Licensed Fighter & Coach in Thailand",
  description:
    "Start your professional Muay Thai career in Thailand. Earn official Thai accreditation as a fighter or coach. Train with the Wisarut family and forge your legacy.",
  keywords:
    "muay thai career, become muay thai coach, fighter training thailand, thai boxing certification, professional muay thai, gym owner training",
  openGraph: {
    title: "Muay Thai Career Path | Professional Fighter & Coach Training",
    description:
      "Earn official Thai accreditation and start your professional Muay Thai career. Fighter and coaching paths available.",
    url: "https://www.muaythaipai.com/careers",
  },
}

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
