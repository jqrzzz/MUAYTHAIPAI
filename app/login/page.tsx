import type { Metadata } from "next"
import LoginClient from "./client"

export const metadata: Metadata = {
  title: "Sign in | MUAYTHAIPAI",
  description:
    "Sign in to MUAYTHAIPAI — pick whether you're a student, trainer, or gym owner.",
  robots: "noindex, nofollow",
  openGraph: {
    title: "Sign in | MUAYTHAIPAI",
    description: "Sign in to MUAYTHAIPAI.",
    url: "https://muaythaipai.com/login",
    images: [{ url: "/images/pai-hero-main.jpeg", width: 1200, height: 630 }],
  },
}

export default function LoginPage() {
  return <LoginClient />
}
