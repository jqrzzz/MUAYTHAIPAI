import type { Metadata } from "next"
import BookClient from "./client"

export const metadata: Metadata = {
  title: "Book a Session | MUAYTHAIPAI",
  description: "Book a Muay Thai training session at any gym in the MUAYTHAIPAI network across Thailand.",
}

export default function BookPage() {
  return <BookClient />
}
