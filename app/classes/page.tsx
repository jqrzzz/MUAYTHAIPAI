import type { Metadata } from "next"
import ClassesClientPage from "./client"
import { BreadcrumbSchema } from "@/components/marketing"

export const metadata: Metadata = {
  title: "Muay Thai Classes & Schedule | Training Programs in Pai",
  description:
    "Flexible Muay Thai training schedule at Muay Thai Pai. Morning and afternoon sessions, private training, beginner to advanced classes. Train traditional Thai boxing in Pai, Thailand.",
  keywords:
    "muay thai classes, muay thai schedule, thai boxing training, muay thai sessions pai, private muay thai lessons, group training pai",
  openGraph: {
    title: "Muay Thai Classes & Schedule | Training Programs in Pai",
    description:
      "Flexible training schedule with morning and afternoon Muay Thai sessions. Private and group classes available.",
    url: "https://muaythaipai.com/classes",
  },
}

export default function ClassesPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://muaythaipai.com" },
          { name: "Classes", url: "https://muaythaipai.com/classes" },
        ]}
      />
      <ClassesClientPage />
    </>
  )
}
