import type { Metadata } from "next"
import CoursesClient from "./client"

export const metadata: Metadata = {
  title: "Online Muay Thai Courses | MUAYTHAIPAI",
  description:
    "Learn Muay Thai online with structured video courses from beginner to advanced. Earn Naga-to-Garuda certification through the MUAYTHAIPAI network.",
}

export default function CoursesPage() {
  return <CoursesClient />
}
