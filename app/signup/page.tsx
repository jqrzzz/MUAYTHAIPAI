import type { Metadata } from "next"
import SignupClient from "./client"

export const metadata: Metadata = {
  title: "Create Your Gym | Muay Thai Network",
  description:
    "Set up your gym on the Muay Thai Network. Manage bookings, trainers, and students with our all-in-one platform.",
}

export default function SignupPage() {
  return <SignupClient />
}
