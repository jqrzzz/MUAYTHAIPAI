import type { Metadata } from "next"
import LoginClient from "./client"

export const metadata: Metadata = {
  title: "Login | Muay Thai Pai Online Courses",
  description:
    "Log in to access your Muay Thai Pai online courses. Subscribe to our online certification program with video instruction from Thai masters.",
  keywords: ["Muay Thai online courses", "Login Muay Thai Pai", "Online Muay Thai training", "Thai boxing courses"],
  robots: "noindex, nofollow",
  openGraph: {
    title: "Login | Muay Thai Pai Online Courses",
    description: "Log in to access your Muay Thai Pai online courses.",
    url: "https://muaythaipai.com/login",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function LoginPage() {
  return <LoginClient />
}
