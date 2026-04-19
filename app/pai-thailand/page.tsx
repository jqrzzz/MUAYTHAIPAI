import type { Metadata } from "next"
import PaiThailandClient from "./client"
import { BreadcrumbSchema } from "@/components/marketing"

export const metadata: Metadata = {
  title: "About Pai | Muay Thai Pai",
  description:
    "Discover Pai, Thailand - where adventure meets serenity. Explore food, wellness, culture, and nature in this beautiful mountain town near our Muay Thai gym.",
  keywords: [
    "Pai Thailand",
    "Pai travel guide",
    "Pai attractions",
    "Northern Thailand",
    "Mae Hong Son",
    "Pai nature",
    "Pai culture",
  ],
  openGraph: {
    title: "About Pai | Muay Thai Pai",
    description:
      "Discover Pai, Thailand - where adventure meets serenity. Explore food, wellness, culture, and nature in this beautiful mountain town.",
    url: "https://muaythaipai.com/pai-thailand",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function PaiThailandPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://muaythaipai.com" },
          { name: "About Pai", url: "https://muaythaipai.com/pai-thailand" },
        ]}
      />
      <PaiThailandClient />
    </>
  )
}
