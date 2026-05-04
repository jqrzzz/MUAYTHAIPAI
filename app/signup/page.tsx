import type { Metadata } from "next"
import SignupClient from "./client"

export const metadata: Metadata = {
  title: "List your gym | MUAYTHAIPAI",
  description:
    "Run your Muay Thai gym with OckOck — bookings, students, the Naga–Garuda cert ladder, and OckOck answering your customers in your voice. Free 30-day trial.",
}

export default function SignupPage() {
  return <SignupClient />
}
