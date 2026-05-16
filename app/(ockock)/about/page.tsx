import type { Metadata } from "next"
import Link from "next/link"
import { OckOckCta } from "@/components/ockock/ockock-cta"

export const metadata: Metadata = {
  title: "About OckOck",
  description:
    "OckOck started in a real Muay Thai gym in Pai, Thailand. We built the tools a Thai gym actually needs — bookings, the Naga–Garuda cert ladder, and an AI that answers customers in Thai or English — and now any gym can use them.",
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <div className="mb-10 text-center">
        <div className="mb-4 text-5xl">🐃</div>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Built in a Muay Thai gym, for Muay Thai gyms
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          OckOck didn&apos;t start as software. It started as a pile of spreadsheets, LINE
          chats, and a wall calendar in a family-run gym in Pai.
        </p>
      </div>

      <div className="space-y-6 text-[15px] leading-relaxed text-zinc-300">
        <p>
          Running a Muay Thai gym in Thailand means answering the same questions a hundred
          times a week — in Thai and in English — across LINE, WhatsApp, Instagram, walk-ins,
          and email. It means keeping track of who&apos;s paid, who&apos;s on which package,
          which trainer signed off which skill, and who&apos;s ready for their next belt. The
          tools that exist treat Muay Thai like CrossFit. They don&apos;t fit.
        </p>
        <p>
          So we built the thing that did fit — alongside a real gym, the Wisarut family&apos;s
          in Pai, solving the problems they actually had. Bookings and students in one place.
          The Naga–Garuda certification ladder, the way Thai gyms actually run it. And OckOck:
          a friendly assistant — yes, a water buffalo — who answers customers in the gym&apos;s
          own voice, in Thai or English, and quietly handles the busywork the owner never has
          time for.
        </p>
        <p>
          OckOck (อ๊อกอ๊อก) is now its own product, on its own home — but it&apos;s still part
          of the <span className="text-zinc-100">MUAYTHAIPAI network</span>: a shared
          credential ladder and directory that travels with students from gym to gym. List
          your gym on OckOck and you&apos;re on the network.
        </p>
        <p>
          One plan, no upsells, a free month to try it. We&apos;re a small team, we answer
          our own email (<a href="mailto:hello@muaythaipai.com" className="text-amber-400 hover:text-amber-300">hello@muaythaipai.com</a>),
          and we&apos;re flexible for small family gyms in Thailand. If OckOck makes your gym
          easier to run, that&apos;s the whole point.
        </p>
      </div>

      <div className="mt-12 flex flex-col items-center gap-3">
        <OckOckCta href="/signup" size="lg">
          Start free 30-day trial
        </OckOckCta>
        <Link href="/for-gyms" className="text-[13px] text-zinc-500 hover:text-zinc-300">
          ← Back to the overview
        </Link>
      </div>
    </div>
  )
}
