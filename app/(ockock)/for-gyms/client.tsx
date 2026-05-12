"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Calendar,
  Award,
  MessageCircle,
  Users,
  Sparkles,
  Check,
  Globe,
} from "lucide-react"
import { Surface } from "@/components/saas"
import { OckOckCta } from "@/components/ockock/ockock-cta"

const FADE = { duration: 0.5, ease: "easeOut" as const }

const FEATURES = [
  {
    icon: Calendar,
    title: "Bookings & students",
    desc: "Class scheduling, payments, student notes, and trainer signoffs in one dashboard. Bilingual (English & Thai).",
  },
  {
    icon: Award,
    title: "Naga–Garuda cert ladder",
    desc: "Issue the 5-level Muay Thai certifications students actually want. Their progress is portable across the network.",
  },
  {
    icon: MessageCircle,
    title: "OckOck answers customers",
    desc: "Your gym's friendly receptionist. Knows your services, hours, prices, and trainers — replies in your voice on chat and email.",
  },
  {
    icon: Users,
    title: "Trainer-friendly",
    desc: "Trainers sign off skills from their phone. Students see their progress live. No spreadsheets, no missed signoffs.",
  },
  {
    icon: Sparkles,
    title: "OckOck does the busywork",
    desc: "Drafts FAQs from your data, suggests course lessons, generates quizzes, replies to leads — you approve, OckOck handles.",
  },
  {
    icon: Globe,
    title: "Network membership",
    desc: "Listed on the MUAYTHAIPAI network. Travelers find you. Cert students bring their progress with them.",
  },
] as const

const STEPS = [
  {
    number: "1",
    title: "List your gym",
    desc: "30 seconds — name, location, your email. We send a magic link to sign in.",
  },
  {
    number: "2",
    title: "Train OckOck",
    desc: "Add your services, hours, and trainers. OckOck reads your gym data and starts answering customers in your voice.",
  },
  {
    number: "3",
    title: "Go live",
    desc: "Share your booking link, issue your first certificate, and let OckOck handle the rest.",
  },
] as const

const BUILT_FOR = [
  "Naga, Phayra Nak, Singha, Hanuman, Garuda — issue all five",
  "Bilingual customer chat (Thai + English)",
  "Trainer skill signoff from a phone",
  "WhatsApp / LINE / email handled in one inbox",
  "Travelers find you on the network",
  "Promoter tools for fight events",
] as const

export default function ForGymsClient() {
  return (
    <div className="px-4 sm:px-6">
      {/* Hero */}
      <section className="mx-auto max-w-3xl pt-16 pb-20 text-center sm:pt-24">
        <motion.div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1.5 text-[12px] font-medium text-indigo-300"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={FADE}
        >
          <span className="text-sm leading-none">🐃</span>
          For Muay Thai gym owners
        </motion.div>

        <motion.h1
          className="text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-6xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...FADE, delay: 0.08 }}
        >
          Run your Muay Thai gym{" "}
          <span className="text-indigo-400">with OckOck</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-zinc-400"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...FADE, delay: 0.16 }}
        >
          The friendliest way to run a Muay Thai gym in Thailand — bookings, the
          Naga–Garuda cert ladder, and OckOck answering your customers in your
          gym&apos;s voice.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...FADE, delay: 0.24 }}
        >
          <OckOckCta href="/signup" size="lg">
            Start free 30-day trial
            <ArrowRight className="h-4 w-4" />
          </OckOckCta>
          <OckOckCta href="/pricing" variant="subtle" size="lg">
            See pricing
          </OckOckCta>
        </motion.div>
        <p className="mt-3 text-[12px] text-zinc-600">
          No credit card required · Cancel anytime
        </p>
      </section>

      {/* Feature grid */}
      <section id="features" className="mx-auto max-w-5xl scroll-mt-20 py-8">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            What you get
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[14px] text-zinc-500">
            Built for Muay Thai gyms, not generic gym software bolted on.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 3) * 0.05, duration: 0.4 }}
            >
              <Surface className="h-full p-5">
                <div className="mb-3 inline-flex rounded-lg bg-indigo-500/10 p-2.5">
                  <feature.icon className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="mb-1.5 text-[15px] font-semibold text-zinc-100">
                  {feature.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-zinc-400">
                  {feature.desc}
                </p>
              </Surface>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl py-20">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Three steps to live
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[14px] text-zinc-500">
            Most gyms are taking bookings the same day they sign up.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              className="text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)]">
                {step.number}
              </div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-zinc-100">
                {step.title}
              </h3>
              <p className="mx-auto max-w-[16rem] text-[13px] leading-relaxed text-zinc-400">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Built for Muay Thai */}
      <section className="mx-auto max-w-5xl py-8">
        <Surface accent="indigo" className="p-8 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="mb-4 text-5xl">🐃</div>
              <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Built for Muay Thai, not bolted on
              </h2>
              <p className="mb-4 text-[15px] leading-relaxed text-zinc-300">
                Generic gym software treats Muay Thai like CrossFit. We
                don&apos;t. The Naga–Garuda cert ladder, Wai Kru tracking,
                fight-event promotion — the whole approach is shaped around how
                Thai gyms actually run.
              </p>
              <p className="text-[15px] leading-relaxed text-zinc-300">
                OckOck (อ๊อกอ๊อก) speaks your customers&apos; language — Thai
                and English — and answers like a Thai trainer would, not like a
                chatbot.
              </p>
            </div>

            <ul className="space-y-3">
              {BUILT_FOR.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[14px] text-zinc-300"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Surface>
      </section>

      {/* Try OckOck live */}
      <section className="mx-auto max-w-3xl py-12">
        <Surface className="relative overflow-hidden p-8 text-center md:p-10">
          <div className="mb-3 text-5xl">🐃</div>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Try OckOck right now
          </h2>
          <p className="mx-auto mb-4 max-w-lg text-[15px] text-zinc-300">
            Tap the chat in the bottom corner — you&apos;re talking to OckOck
            for Wisarut Family Gym. Ask about prices, hours, what to bring, or
            how to get to Pai.
          </p>
          <p className="text-[13px] text-zinc-500">
            This is the same OckOck your customers will chat with on your
            gym&apos;s page. ↘
          </p>
          <motion.div
            className="pointer-events-none absolute bottom-3 right-4 hidden select-none text-4xl sm:block"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          >
            ↘
          </motion.div>
        </Surface>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-3xl py-12 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Simple, friendly pricing
        </h2>
        <p className="mb-8 mt-2 text-[14px] text-zinc-500">
          One plan. Everything included. Free to start.
        </p>

        <Surface accent="indigo" className="mx-auto max-w-md p-8">
          <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-indigo-400">
            MUAYTHAIPAI network
          </p>
          <div className="mb-1 flex items-baseline justify-center gap-1">
            <span className="text-5xl font-semibold tracking-tight text-white">
              ฿999
            </span>
            <span className="text-[16px] text-zinc-500">/month</span>
          </div>
          <p className="mb-6 text-[13px] text-zinc-500">
            After your free 30-day trial
          </p>

          <OckOckCta href="/signup" className="w-full">
            Start free trial
          </OckOckCta>
          <Link
            href="/pricing"
            className="mt-3 inline-block text-[13px] text-indigo-400 transition-colors hover:text-indigo-300"
          >
            See what&apos;s included →
          </Link>
        </Surface>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-2xl py-20 text-center">
        <div className="mb-4 text-5xl">🐃</div>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Ready to meet OckOck?
        </h2>
        <p className="mx-auto mb-8 max-w-md text-[15px] text-zinc-400">
          Sign up in 30 seconds. Take your first booking today.
        </p>
        <OckOckCta href="/signup" size="lg">
          List your gym — free 30-day trial
          <ArrowRight className="h-4 w-4" />
        </OckOckCta>
        <p className="mt-3 text-[12px] text-zinc-600">
          No credit card · Cancel anytime · Setup help included
        </p>
      </section>
    </div>
  )
}
