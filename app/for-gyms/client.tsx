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
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SacredDecoration,
  CONTENT_FADE_IN,
} from "@/components/marketing"

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

export default function ForGymsClient() {
  return (
    <PageBackground>
      <MarketingTopNav backHref="/" backLabel="Back to home" />
      <SacredDecoration />

      <main className="relative z-10 px-4 pt-24 pb-32 max-w-5xl mx-auto">
        {/* Hero */}
        <section className="text-center">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6 bg-orange-100/80 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={CONTENT_FADE_IN}
          >
            <span className="text-base leading-none">🐃</span>
            For Muay Thai gym owners
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...CONTENT_FADE_IN, delay: 0.1 }}
          >
            Run your gym with OckOck
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl max-w-2xl mx-auto text-neutral-700 dark:text-neutral-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...CONTENT_FADE_IN, delay: 0.2 }}
          >
            The friendliest way to manage a Muay Thai gym in Thailand —
            bookings, the Naga–Garuda cert ladder, and OckOck answering your
            customers in your gym&apos;s voice.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...CONTENT_FADE_IN, delay: 0.3 }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 font-bold text-white transition-colors hover:bg-orange-400 shadow-lg shadow-orange-500/20"
            >
              Start free 30-day trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-white/15 bg-white/50 dark:bg-white/5 px-6 py-3.5 font-semibold text-neutral-800 dark:text-white transition-colors hover:bg-white/80 dark:hover:bg-white/10"
            >
              See pricing
            </Link>
          </motion.div>

          <motion.p
            className="mt-3 text-xs text-neutral-500 dark:text-neutral-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...CONTENT_FADE_IN, delay: 0.4 }}
          >
            No credit card required · Cancel anytime
          </motion.p>
        </section>

        {/* Feature grid */}
        <section className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-3 text-neutral-900 dark:text-white">
            What you get
          </h2>
          <p className="text-center text-neutral-600 dark:text-neutral-400 mb-12 max-w-xl mx-auto">
            Built for Muay Thai gyms, not generic gym software bolted on.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="rounded-2xl p-5 bg-white/70 border border-neutral-200 dark:bg-white/[0.03] dark:border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <div className="rounded-lg bg-orange-100 dark:bg-orange-500/10 p-2.5 inline-flex mb-3">
                  <feature.icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-base mb-1.5 text-neutral-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-3 text-neutral-900 dark:text-white">
            Three steps to live
          </h2>
          <p className="text-center text-neutral-600 dark:text-neutral-400 mb-12 max-w-xl mx-auto">
            Most gyms are taking bookings the same day they sign up.
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xl font-bold shadow-lg shadow-orange-500/30">
                  {step.number}
                </div>
                <h3 className="font-semibold text-lg mb-1.5 text-neutral-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Built for Muay Thai */}
        <section className="mt-24">
          <div className="rounded-3xl border border-orange-200 dark:border-orange-500/20 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/5 dark:to-amber-500/5 p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div>
                <div className="text-5xl mb-4">🐃</div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-neutral-900 dark:text-white">
                  Built for Muay Thai, not bolted on
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed">
                  Generic gym software treats Muay Thai like CrossFit. We don&apos;t.
                  The Naga–Garuda cert ladder, Wai Kru tracking, fight-event
                  promotion, the whole approach is shaped around how Thai gyms
                  actually run.
                </p>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  OckOck (อ๊อกอ๊อก) speaks your customers&apos; language — Thai
                  and English — and answers like a Thai trainer would, not like
                  a chatbot.
                </p>
              </div>

              <ul className="space-y-3">
                {[
                  "Naga, Phayra Nak, Singha, Hanuman, Garuda — issue all five",
                  "Bilingual customer chat (Thai + English)",
                  "Trainer skill signoff from a phone",
                  "WhatsApp / LINE / email handled in one inbox",
                  "Travelers find you on the network",
                  "Promoter tools for fight events",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                  >
                    <Check className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Try OckOck live */}
        <section className="mt-24">
          <div className="rounded-3xl border-2 border-dashed border-orange-300 dark:border-orange-500/40 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-orange-500/[0.07] dark:to-amber-500/[0.04] p-8 md:p-10 text-center relative overflow-hidden">
            <div className="text-5xl mb-3">🐃</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-neutral-900 dark:text-white">
              Try OckOck right now
            </h2>
            <p className="max-w-lg mx-auto text-neutral-700 dark:text-neutral-300 mb-4">
              Tap the chat in the bottom corner — you&apos;re talking to OckOck
              for Wisarut Family Gym. Ask about prices, hours, what to bring,
              or how to get to Pai.
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              This is the same OckOck your customers will chat with on your
              gym&apos;s page. ↘
            </p>

            {/* Visual arrow pointing down-right toward the floating widget */}
            <motion.div
              className="absolute bottom-3 right-4 text-4xl pointer-events-none select-none hidden sm:block"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            >
              ↘
            </motion.div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="mt-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-3 text-neutral-900 dark:text-white">
              Simple, friendly pricing
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              One plan. Everything included. Free to start.
            </p>

            <div className="mx-auto max-w-md rounded-3xl border border-orange-200 dark:border-orange-500/30 bg-white dark:bg-neutral-900 p-8 shadow-xl shadow-orange-500/10">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                MUAYTHAIPAI Network
              </p>
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-5xl font-black text-neutral-900 dark:text-white">
                  ฿999
                </span>
                <span className="text-lg text-neutral-500">/month</span>
              </div>
              <p className="text-sm text-neutral-500 mb-6">
                After your free 30-day trial
              </p>

              <Link
                href="/signup"
                className="block w-full rounded-xl bg-orange-500 py-3 font-bold text-white text-center transition-colors hover:bg-orange-400"
              >
                Start free trial
              </Link>
              <Link
                href="/pricing"
                className="mt-3 block text-sm text-orange-600 dark:text-orange-400 hover:underline"
              >
                See what&apos;s included →
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-24 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-neutral-900 dark:text-white">
            Ready to meet OckOck?
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
            Sign up in 30 seconds. Take your first booking today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-4 font-bold text-white text-lg transition-colors hover:bg-orange-400 shadow-lg shadow-orange-500/20"
          >
            List your gym — free 30-day trial
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-3 text-xs text-neutral-500">
            No credit card · Cancel anytime · Setup help included
          </p>
        </section>
      </main>

      <MarketingBottomNav />
    </PageBackground>
  )
}
