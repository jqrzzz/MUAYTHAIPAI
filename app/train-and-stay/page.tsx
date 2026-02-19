import type { Metadata } from "next"
import TrainAndStayClient from "./client"

export const metadata: Metadata = {
  title: "Train & Stay | Muay Thai Pai",
  description:
    "Find the perfect accommodation near Muay Thai Pai gym in Pai, Thailand. Recommended hostels, resorts, and guesthouses within walking distance.",
  keywords: [
    "Pai accommodation",
    "Muay Thai training accommodation",
    "Pai Thailand hostels",
    "Stay near Muay Thai gym",
  ],
  openGraph: {
    title: "Train & Stay | Muay Thai Pai",
    description:
      "Find the perfect accommodation near Muay Thai Pai gym in Pai, Thailand. Recommended hostels, resorts, and guesthouses within walking distance.",
    url: "https://muaythaipai.com/train-and-stay",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function TrainAndStayPage() {
  return <TrainAndStayClient />
}
