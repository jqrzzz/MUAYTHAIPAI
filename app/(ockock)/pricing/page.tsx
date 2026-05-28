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
    // OG image comes from app/(ockock)/opengraph-image.tsx.
  },
}

export default function PricingPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://ockock.app" },
          { name: "Pricing", url: "https://ockock.app/pricing" },
        ]}
      />
      <PricingClient />
    </>
  )
}
