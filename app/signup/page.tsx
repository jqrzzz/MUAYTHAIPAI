import type { Metadata } from "next"
import SignupClient from "./client"

export const metadata: Metadata = {
  title: "List your gym | MUAYTHAIPAI",
  description:
    "AI-native gym management for Muay Thai gyms — bookings, students, the Naga–Garuda cert ladder, and an AI receptionist that knows your gym. Free 30-day trial.",
}

export default function SignupPage() {
  return <SignupClient />
}
