import type { Metadata } from "next"
import BlogClient from "./client"

export const metadata: Metadata = {
  title: "Blog | Muay Thai Pai",
  description:
    "Read stories, training tips, and insights from the Muay Thai Pai family. Articles about Muay Thai technique, Thai culture, and life in Pai.",
  keywords: ["Muay Thai blog", "Thai boxing articles", "Pai Thailand stories", "Muay Thai training tips"],
  openGraph: {
    title: "Blog | Muay Thai Pai",
    description:
      "Read stories, training tips, and insights from the Muay Thai Pai family. Articles about Muay Thai technique, Thai culture, and life in Pai.",
    url: "https://muaythaipai.com/blog",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function BlogPage() {
  return <BlogClient />
}
