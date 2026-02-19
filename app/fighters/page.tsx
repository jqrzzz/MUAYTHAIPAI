import FightersPageClient from "./client"

export const metadata = {
  title: "Muay Thai Fighters | Active & Retired Champions from Pai",
  description:
    "Meet the fighters of Muay Thai Pai. Active competitors and retired champions from our third-generation family gym in Pai, Thailand.",
  keywords:
    "muay thai fighters pai, thai boxing champions, kru wisarut fighters, muay thai gym fighters, thai boxers pai",
  openGraph: {
    title: "Muay Thai Fighters | Champions from Muay Thai Pai",
    description: "Meet our active and retired Muay Thai fighters from the Wisarut family gym in Pai, Thailand.",
    url: "https://www.muaythaipai.com/fighters",
  },
}

export default function FightersPage() {
  return <FightersPageClient />
}
