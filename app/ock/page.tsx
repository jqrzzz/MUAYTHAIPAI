import Link from "next/link"
import { Swords, Users, MapPin, Ticket } from "lucide-react"

const features = [
  {
    href: "/ock/fights",
    icon: Swords,
    title: "Fight Events",
    description: "Browse upcoming Muay Thai fight nights across Thailand. See the fight cards, venues, and dates.",
  },
  {
    href: "/ock/fighters",
    icon: Users,
    title: "Fighters",
    description: "Discover fighters from gyms across Thailand. View records, weight classes, and stats.",
  },
  {
    href: "/ock/fights",
    icon: Ticket,
    title: "Buy Tickets",
    description: "Get ringside, VIP, or general admission tickets to live Muay Thai events.",
  },
  {
    href: "/gyms",
    icon: MapPin,
    title: "Find Gyms",
    description: "Explore Muay Thai gyms across Thailand. Book training sessions and find your camp.",
  },
]

export default function OckLandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-24">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/8 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          {/* OckOck avatar */}
          <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 ring-2 ring-amber-500/30">
            <span className="text-5xl">🐃</span>
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Your Guide to{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Muay Thai
            </span>{" "}
            in Thailand
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-lg text-neutral-400">
            Find fighters, discover fight events, buy ringside tickets, and
            connect with gyms across Thailand. OckOck makes Muay Thai
            accessible.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/ock/fights"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-black transition-colors hover:bg-amber-400"
            >
              <Swords className="h-5 w-5" />
              Browse Fights
            </Link>
            <Link
              href="/ock/fighters"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Users className="h-5 w-5" />
              Find Fighters
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-amber-500/30 hover:bg-white/[0.06]"
            >
              <div className="mb-3 inline-flex rounded-lg bg-amber-500/10 p-2.5">
                <feature.icon className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="mb-1.5 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-400">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* About OckOck */}
      <section className="border-t border-white/10 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">
            What is OckOck?
          </h2>
          <p className="mb-3 text-neutral-400">
            OckOck (อ๊อกอ๊อก) is the sound a water buffalo makes — Thailand&apos;s
            gentle giant and a symbol of strength. We&apos;re building the friendliest
            way to experience Muay Thai in Thailand.
          </p>
          <p className="text-neutral-500 text-sm">
            Whether you&apos;re a traveler wanting to watch a fight, a fighter
            looking for your next bout, or a promoter filling a card — OckOck
            connects the Muay Thai community.
          </p>
        </div>
      </section>
    </div>
  )
}
