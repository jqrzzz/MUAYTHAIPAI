import type { Metadata } from "next"
import ForGymsClient from "./client"
import { BreadcrumbSchema } from "@/components/marketing"

export const metadata: Metadata = {
  title: "OckOck — run your Muay Thai gym",
  description:
    "The friendliest way to run a Muay Thai gym in Thailand. Bookings, students, the Naga–Garuda cert ladder, and OckOck answering your customers in your gym's voice. Free 30-day trial.",
  keywords: [
    "Muay Thai gym software",
    "gym management Thailand",
    "Muay Thai bookings",
    "OckOck",
    "MUAYTHAIPAI network",
    "gym admin",
    "Muay Thai certifications",
  ],
  openGraph: {
    title: "OckOck — run your Muay Thai gym",
    description:
      "The friendliest way to run a Muay Thai gym in Thailand. Bookings, certifications, and OckOck answering your customers.",
    url: "https://muaythaipai.com/for-gyms",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function ForGymsPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://muaythaipai.com" },
          { name: "For Gym Owners", url: "https://muaythaipai.com/for-gyms" },
        ]}
      />
      <ForGymsClient />
    </>
  )
}
