import type { Metadata } from "next"
import OnlineClassesClient from "./client"
import { BreadcrumbSchema } from "@/components/marketing"

export const metadata: Metadata = {
  title: "Muay Thai Online Classes — Learn from Anywhere | MUAYTHAIPAI",
  description:
    "Learn authentic Muay Thai online with structured courses from beginner to master. Video lessons, drills, quizzes, and certification. Train at your own pace for ฿299/month.",
  keywords: [
    "Muay Thai online classes",
    "learn Muay Thai online",
    "online Muay Thai training",
    "Muay Thai course",
    "Thai boxing lessons online",
    "Muay Thai for beginners",
    "Muay Thai certification online",
  ],
  openGraph: {
    title: "Muay Thai Online Classes — Learn from Anywhere | MUAYTHAIPAI",
    description:
      "Learn authentic Muay Thai online with structured courses from beginner to master. Video lessons, drills, quizzes, and certification.",
    url: "https://muaythaipai.com/online-classes",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function OnlineClassesPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://muaythaipai.com" },
          { name: "Online Classes", url: "https://muaythaipai.com/online-classes" },
        ]}
      />
      <OnlineClassesClient />
    </>
  )
}
