import type { Metadata } from "next"
import ContactClient from "./client"
import { BreadcrumbSchema } from "@/components/marketing"

export const metadata: Metadata = {
  title: "Contact | Muay Thai Pai",
  description:
    "Get in touch with Muay Thai Pai. Book your training sessions, ask questions, or plan your visit to our gym in Pai, Thailand.",
  keywords: ["Contact Muay Thai Pai", "Book Muay Thai training", "Pai Thailand gym contact"],
  openGraph: {
    title: "Contact | Muay Thai Pai",
    description:
      "Get in touch with Muay Thai Pai. Book your training sessions, ask questions, or plan your visit to our gym in Pai, Thailand.",
    url: "https://muaythaipai.com/contact",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function ContactPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://muaythaipai.com" },
          { name: "Contact", url: "https://muaythaipai.com/contact" },
        ]}
      />
      <ContactClient />
    </>
  )
}
