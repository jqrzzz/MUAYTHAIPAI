import type { Metadata } from "next"
import SignupClient from "./client"

export const metadata: Metadata = {
  // OckOck-branded — this is the gym SaaS signup, not network /
  // student / trainer signup. Title + description + OG should make
  // that obvious from search results or shared previews.
  title: "Start your free trial | OckOck",
  description:
    "Run your Muay Thai gym with OckOck — bookings, the Naga–Garuda cert ladder, fight events, and an AI receptionist that answers your customers in your voice. Free 30-day trial.",
  openGraph: {
    title: "Start your free trial | OckOck",
    description:
      "The friendly way to run a Muay Thai gym in Thailand. Free 30-day trial — no card required.",
    siteName: "OckOck",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Start your free trial | OckOck",
    description:
      "Run your Muay Thai gym with OckOck. Free 30-day trial.",
  },
}

export default function SignupPage() {
  return <SignupClient />
}
