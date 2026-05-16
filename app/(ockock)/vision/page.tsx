import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Award,
  Calendar,
  Check,
  CreditCard,
  MapPin,
  MessageCircle,
  Newspaper,
  Sparkles,
  Users,
} from "lucide-react"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"
import { PLAN } from "@/lib/ockock/product"
import { OckOckCta } from "@/components/ockock/ockock-cta"
import { PrintButton } from "@/components/deck/print-button"

export const metadata: Metadata = {
  title: "Our story — OckOck for Muay Thai gyms",
  description:
    "Muay Thai is Thailand's heritage. We're building the gentle, modern way to run the gyms preserving it. Built alongside the Wisarut Family Gym in Pai. Featured in National Geographic.",
}

const AVATAR = "/images/ockock-avatar.png"

// Small inline presentational helpers. Kept inline (not extracted into a
// shared deck primitive yet) — two decks isn't enough duplication to justify
// the indirection. Extract when a third one appears.

function Section({
  children,
  className = "",
  tight = false,
}: {
  children: React.ReactNode
  className?: string
  tight?: boolean
}) {
  return (
    <section className={`relative ${tight ? "py-16" : "py-24 md:py-28"} px-4 sm:px-6 print:break-inside-avoid print:py-12 ${className}`}>
      <div className="mx-auto max-w-4xl">{children}</div>
    </section>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-amber-300/80">{children}</p>
  )
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`text-[32px] leading-[1.05] tracking-tight text-white sm:text-[48px] ${className}`}
    >
      {children}
    </h2>
  )
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 text-[17px] leading-relaxed text-zinc-300 sm:text-[19px]">{children}</p>
}

export default function VisionPage() {
  return (
    <>
      <PrintButton />
      <article>
      {/* ═════════════════ 1. COVER ═════════════════ */}
      <section className="relative overflow-hidden px-4 sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.22),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
          <Image
            src={AVATAR}
            alt="OckOck"
            width={300}
            height={300}
            priority
            className="mx-auto h-auto w-[170px] drop-shadow-[0_24px_60px_rgba(99,102,241,0.3)] sm:w-[230px]"
          />
          <h1 className="mt-8 text-[36px] leading-[1.06] tracking-tight text-white sm:text-[62px]">
            Muay Thai isn&apos;t just a sport.
            <br />
            It&apos;s Thailand&apos;s <span className="text-amber-400">heritage</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-zinc-400 sm:text-[19px]">
            We&apos;re building the gentle, modern way to run the gyms preserving it. Built in a
            Muay Thai gym in Pai, alongside the Wisarut family.
          </p>
          <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-[12px] text-zinc-300">
            <Newspaper className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-zinc-500">As featured in</span>
            <span className="tracking-[0.1em] text-zinc-100">National Geographic</span>
          </div>
        </div>
      </section>

      {/* ═════════════════ 2. THE STORY ═════════════════ */}
      <Section>
        <Eyebrow>Where this came from</Eyebrow>
        <H2>OckOck didn&apos;t start as software.</H2>
        <Lead>
          It started in a Muay Thai gym in Pai — the Wisarut family&apos;s. Three generations of
          krus, a yard full of pads, and the same problem every gym owner has: the tools don&apos;t
          fit. Spreadsheets and LINE chats. Generic gym software made for CrossFit, bolted onto a
          Wai Kru. We built the thing that fit.
        </Lead>
        <Lead>
          OckOck is the friendly water-buffalo who answers your customers in your gym&apos;s voice
          — and the system that quietly handles everything else.
        </Lead>
      </Section>

      {/* ═════════════════ 3. THE EVERYDAY ═════════════════ */}
      <Section className="bg-gradient-to-b from-transparent via-amber-500/[0.025] to-transparent">
        <Eyebrow>What you live every day</Eyebrow>
        <H2>You&apos;re a kru, not a customer-service agent.</H2>
        <Lead>
          Tourists ask about prices in English on Instagram. Locals ask on LINE in Thai. Students
          want to know what to bring; their parents want to know when the kids&apos; class meets.
          You answer the same questions a hundred times a week — while you&apos;re teaching.
        </Lead>
        <Lead>
          OckOck steps in. Reads your services, hours, prices, trainer bios — and answers like a
          Thai trainer would, not like a chatbot. In Thai. In English. On chat. On email. On LINE
          and WhatsApp if you want.
        </Lead>
      </Section>

      {/* ═════════════════ 4. EVERYTHING IN ONE PLACE ═════════════════ */}
      <Section>
        <Eyebrow>One place for everything</Eyebrow>
        <H2>Bookings, students, certs, trainers — all in one dashboard.</H2>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Calendar,
              title: "Bookings",
              body: "Class scheduling and payments. Drop-ins, week passes, monthly. Cash or card.",
            },
            {
              icon: Users,
              title: "Students",
              body: "Profiles, attendance, credits, notes. Bilingual — Thai and English.",
            },
            {
              icon: Award,
              title: "The cert ladder",
              body: "Naga to Garuda. Issue real, verifiable credentials.",
            },
            {
              icon: MessageCircle,
              title: "One inbox",
              body: "LINE, WhatsApp, Instagram, web — every customer message in one place.",
            },
            {
              icon: Sparkles,
              title: "OckOck does the busywork",
              body: "Drafts replies, FAQs, social posts in your gym's voice. You approve.",
            },
            {
              icon: CreditCard,
              title: "Trainer signoff",
              body: "Trainers tick off skills from their phone. Students see progress live.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-zinc-900/40 p-5 ring-1 ring-zinc-900">
              <div className="mb-3 inline-flex rounded-lg bg-amber-500/10 p-2.5">
                <f.icon className="h-5 w-5 text-amber-300" />
              </div>
              <p className="text-[15px] font-semibold text-zinc-100">{f.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═════════════════ 5. THE LADDER ═════════════════ */}
      <Section className="bg-gradient-to-b from-transparent via-amber-500/[0.025] to-transparent">
        <Eyebrow>The Naga–Garuda ladder</Eyebrow>
        <H2>Your students earn a credential that travels with them.</H2>
        <Lead>
          Five ranks, named for Thailand&apos;s guardian creatures. A student doesn&apos;t get a
          paper certificate that only matters at one gym — they earn a verifiable rank that follows
          them across the network. Designed to carry the official Kingdom recognition the masters
          deserve.
        </Lead>

        <div className="mt-12 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {CERTIFICATION_LEVELS.map((lvl) => (
            <div
              key={lvl.id}
              className="rounded-2xl bg-zinc-900/40 p-4 text-center ring-1 ring-zinc-900"
            >
              <div className="text-3xl">{lvl.icon}</div>
              <p className={`mt-2 text-[15px] ${lvl.color}`}>{lvl.name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                Rank {lvl.number}
              </p>
              <p className="mt-1.5 text-[11px] text-zinc-500">{lvl.creature}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═════════════════ 6. THE NETWORK ═════════════════ */}
      <Section>
        <Eyebrow>The network</Eyebrow>
        <H2>You&apos;re not alone in this.</H2>
        <Lead>
          When you list your gym on OckOck, you join the MUAYTHAIPAI network. Travelers searching
          for a real Muay Thai gym find yours. Students moving cities bring their rank with them.
          Other gyms in the network are colleagues — preserving the same thing you are.
        </Lead>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Travelers find you",
              body: "Listed on the public network directory. Verifiable. Mapped. Real.",
            },
            {
              title: "Students bring their progress",
              body: "Their rank ladder is portable — your gym picks them up where the last one left off.",
            },
            {
              title: "Other gyms are colleagues",
              body: "Shared cert standard, shared traveler base, shared mission. Not competitors.",
            },
          ].map((b) => (
            <div key={b.title} className="rounded-2xl bg-zinc-900/40 p-5 ring-1 ring-zinc-900">
              <p className="text-[16px] text-white">{b.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">{b.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═════════════════ 7. BUILT IN PAI ═════════════════ */}
      <Section className="bg-gradient-to-b from-transparent via-amber-500/[0.025] to-transparent">
        <Eyebrow>Built where it matters</Eyebrow>
        <H2>Pai. The Wisarut family. Three generations.</H2>
        <Lead>
          This wasn&apos;t built by a software company in Silicon Valley and translated into Thai.
          It was built in a real Muay Thai gym, alongside a family who&apos;s been teaching this
          tradition for three generations. National Geographic published a feature on them — and on
          what we&apos;re doing to keep traditional Muay Thai healthy in a changing Thailand.
        </Lead>

        <div className="mt-10 rounded-2xl bg-zinc-900/40 p-6 ring-1 ring-zinc-900">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
              <Newspaper className="h-4 w-4 text-amber-300" />
            </div>
            <p className="text-[13px] text-zinc-300">
              <span className="tracking-[0.08em] text-zinc-100">National Geographic</span>{" "}
              <span className="text-zinc-500">·</span> the Wisarut Family Gym and the work to
              preserve traditional Muay Thai.
            </p>
          </div>
        </div>
      </Section>

      {/* ═════════════════ 8. PRICING ═════════════════ */}
      <Section>
        <Eyebrow>Simple pricing</Eyebrow>
        <H2>One plan. Free for {PLAN.trialDays} days.</H2>

        <div className="mt-12 rounded-3xl bg-gradient-to-b from-amber-500/[0.08] to-zinc-900/40 p-8 ring-1 ring-amber-500/25 sm:p-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300/80">
                Everything, one price
              </p>
              <p className="mt-1 text-[40px] tracking-tight text-white sm:text-[52px]">
                ฿{PLAN.priceTHB}
                <span className="ml-1 text-[18px] text-zinc-500">/month</span>
              </p>
              <p className="mt-1 text-[13px] text-zinc-500">
                After your free {PLAN.trialDays}-day trial · no credit card to start
              </p>
            </div>
            <ul className="grid gap-y-2 text-[13px] text-zinc-300 sm:grid-cols-2 sm:gap-x-8">
              {[
                "Unlimited students & bookings",
                "Unlimited trainers & staff",
                "We take 0% of your bookings",
                "All channels (LINE, WhatsApp, IG, FB)",
                "Cert ladder issuing & verification",
                "Cancel anytime, no questions",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ═════════════════ 9. THREE STEPS ═════════════════ */}
      <Section className="bg-gradient-to-b from-transparent via-amber-500/[0.025] to-transparent">
        <Eyebrow>Getting started</Eyebrow>
        <H2>Three steps. Most gyms take their first booking the same day.</H2>

        <ol className="mt-12 space-y-3">
          {[
            {
              n: "1",
              t: "List your gym",
              b: "30 seconds — name, your email, where you are. We send a magic link to sign in. No credit card.",
            },
            {
              n: "2",
              t: "Train OckOck",
              b: "Tell OckOck about your gym in your own words (Thai or English). It writes up your services, hours, and a draft of your page. You review and edit.",
            },
            {
              n: "3",
              t: "Go live",
              b: "Share your booking link. Connect LINE/WhatsApp if you want. OckOck starts answering customers in your voice.",
            },
          ].map((step) => (
            <li
              key={step.n}
              className="flex items-start gap-4 rounded-2xl bg-zinc-900/40 p-5 ring-1 ring-zinc-900"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)]">
                {step.n}
              </span>
              <div>
                <p className="text-[18px] text-white">{step.t}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-zinc-400">{step.b}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ═════════════════ 10. CLOSE / CTA ═════════════════ */}
      <Section tight>
        <div className="rounded-3xl bg-gradient-to-b from-amber-500/[0.1] to-zinc-900/40 p-10 text-center ring-1 ring-amber-500/25 sm:p-14">
          <div className="mb-5 text-5xl">🐃</div>
          <H2 className="text-[26px] sm:text-[40px]">Run your gym the way it should be.</H2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-400">
            Try OckOck free for {PLAN.trialDays} days. If it fits, you stay. If it doesn&apos;t, you
            walk away — no charge, no awkward sales call.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <OckOckCta href="/signup" size="lg">
              Start free {PLAN.trialDays}-day trial
              <ArrowRight className="h-4 w-4" />
            </OckOckCta>
            <a
              href="mailto:hello@muaythaipai.com?subject=Tell%20me%20more%20about%20OckOck"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-zinc-800/80 px-7 text-[15px] font-medium text-zinc-100 transition-colors hover:bg-zinc-700"
            >
              Talk to us first →
            </a>
          </div>
          <p className="mt-8 inline-flex items-center gap-1.5 text-[11px] text-zinc-600">
            <MapPin className="h-3 w-3" /> Pai · Thailand
          </p>
        </div>
      </Section>

      <footer className="mx-auto max-w-3xl px-5 pb-12 text-center">
        <p className="text-[11px] text-zinc-600">
          OckOck · part of the MUAYTHAIPAI network
        </p>
        <Link
          href="/for-gyms"
          className="mt-2 inline-block text-[12px] text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to the features overview
        </Link>
      </footer>
    </article>
    </>
  )
}
