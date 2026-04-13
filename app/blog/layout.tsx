import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Muay Thai Blog | Training Tips & Stories from Pai, Thailand",
  description:
    "Read authentic Muay Thai training tips, cultural insights, and stories from the Wisarut family gym in Pai, Thailand. Learn about technique, philosophy, and the warrior lifestyle.",
  keywords:
    "muay thai blog, thai boxing tips, muay thai training, kru wisarut stories, muay thai culture, training philosophy",
  openGraph: {
    title: "Muay Thai Blog | Training Tips & Stories from Pai",
    description:
      "Authentic Muay Thai wisdom, training insights, and cultural stories from our family gym in Pai, Thailand.",
    url: "https://muaythaipai.com/blog",
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
