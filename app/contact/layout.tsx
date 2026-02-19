import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Muay Thai Pai | Book Training in Pai, Thailand",
  description:
    "Get in touch with Muay Thai Pai for training inquiries, accommodation questions, or to book your authentic Muay Thai experience in Pai, Thailand.",
  keywords: "contact muay thai pai, book training thailand, pai gym contact, muay thai inquiry, training booking pai",
  openGraph: {
    title: "Contact Muay Thai Pai | Book Your Training",
    description: "Contact us to start your authentic Muay Thai journey in Pai, Thailand. Quick response guaranteed.",
    url: "https://www.muaythaipai.com/contact",
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
