import type { Metadata } from "next"
import LoginClient from "./client"

// Universal role-picker page — works for Pai gym students/trainers
// and OckOck gym admins both. Kept brand-neutral so it doesn't tilt
// toward either side. noindex because the destination depends on
// role; no SEO value in indexing the picker itself.
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to manage your gym, training, or fight events.",
  robots: "noindex, nofollow",
}

export default function LoginPage() {
  return <LoginClient />
}
