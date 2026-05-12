import type { Metadata } from "next"
import PricingClient from "./client"
import { BreadcrumbSchema } from "@/components/marketing"

export const metadata: Metadata = {
  title: "Pricing | OckOck for Muay Thai gyms",
  description:
    "Simple pricing for Muay Thai gym software. One plan, everything included, free 30-day trial. Bookings, certifications, and OckOck — your gym's friendly receptionist.",
  openGraph: {
    title: "Pricing | OckOck for Muay Thai gyms",
    description:
      "One plan. Everything included. Free 30-day trial. ฿999/month after trial.",
    url: "https://muaythaipai.com/pricing",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function PricingPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://muaythaipai.com" },
          { name: "Pricing", url: "https://muaythaipai.com/pricing" },
        ]}
      />
      <PricingClient />
    </>
  )
}
