import FightersPageClient from "./client"

export const metadata = {
  title: "Fighters | OckOck Fighter Registry",
  description:
    "Browse the OckOck fighter registry — active and retired Muay Thai fighters from gyms across Thailand. Records, stats, and profiles.",
  keywords:
    "muay thai fighters, thai boxing champions, ockock fighters, muay thai records, fighter database thailand",
  openGraph: {
    title: "Fighters | OckOck Fighter Registry",
    description: "Browse Muay Thai fighters from gyms across Thailand. Records, stats, and profiles.",
    url: "https://www.muaythaipai.com/fighters",
  },
}

export default function FightersPage() {
  return <FightersPageClient />
}
