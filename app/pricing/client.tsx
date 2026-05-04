"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Check, ChevronDown } from "lucide-react"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SacredDecoration,
  CONTENT_FADE_IN,
  EXPAND_COLLAPSE,
} from "@/components/marketing"

const INCLUDED = [
  "Unlimited bookings & students",
  "Unlimited trainers & staff",
  "Naga–Garuda certification ladder (all 5 levels)",
  "OckOck answers customer questions in your voice",
  "OckOck drafts FAQs, lessons, and quizzes from your data",
  "Bilingual chat — Thai & English",
  "Trainer skill signoff from any phone",
  "Online courses authoring",
  "Stripe payments + cash tracking",
  "Public gym page on the MUAYTHAIPAI network",
  "Promoter tools (fight events, tickets, fighters)",
  "Inbox: WhatsApp, LINE, email in one place",
  "Reports — students, certs, revenue, top trainers",
  "Setup help from a real human",
] as const

const FAQS = [
  {
    q: "What happens after the 30-day trial?",
    a: "If you love OckOck, you can subscribe for ฿999/month. If not, your account stays in read-only — no charge, no awkward sales call.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Just your gym name and email. We send you a magic link to sign in.",
  },
  {
    q: "Is there a setup fee?",
    a: "No. Setup is free, and we'll help you import your services, hours, and trainers.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your gym dashboard — no phone calls, no retention emails.",
  },
  {
    q: "Do you take a cut of bookings?",
    a: "No. The ฿999/month is all-in. You keep 100% of what your students pay.",
  },
  {
    q: "What about Stripe fees?",
    a: "Stripe charges their standard processing fee (around 3.65% + ฿11 for Thai cards) when you take card payments. Cash bookings have no fee.",
  },
  {
    q: "Is OckOck good with Thai?",
    a: "Yes — OckOck handles Thai and English natively. ตอบลูกค้าได้ทั้งภาษาไทยและอังกฤษ.",
  },
  {
    q: "Do you have student discounts or scholarships?",
    a: "We're flexible for small family-run gyms in Thailand. Email hello@muaythaipai.com — we'll find a way.",
  },
] as const

export default function PricingClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <PageBackground>
      <MarketingTopNav backHref="/for-gyms" backLabel="Back to For Gyms" />
      <SacredDecoration />

      <main className="relative z-10 px-4 pt-24 pb-32 max-w-4xl mx-auto">
        {/* Hero */}
        <section className="text-center">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6 bg-orange-100/80 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={CONTENT_FADE_IN}
          >
            <span className="text-base leading-none">🐃</span>
            Friendly pricing
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...CONTENT_FADE_IN, delay: 0.1 }}
          >
            One plan. Everything included.
          </motion.h1>

          <motion.p
            className="text-lg text-neutral-700 dark:text-neutral-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...CONTENT_FADE_IN, delay: 0.2 }}
          >
            No tiers, no upsells, no &ldquo;contact sales.&rdquo; Free for
            30 days, then ฿999/month.
          </motion.p>
        </section>

        {/* Pricing card */}
        <motion.section
          className="mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...CONTENT_FADE_IN, delay: 0.3 }}
        >
          <div className="mx-auto max-w-2xl rounded-3xl border-2 border-orange-300 dark:border-orange-500/40 bg-white dark:bg-neutral-900 p-8 md:p-10 shadow-2xl shadow-orange-500/10">
            <div className="text-center mb-8">
              <p className="text-sm font-semibold tracking-wide uppercase text-orange-600 dark:text-orange-400 mb-2">
                MUAYTHAIPAI Network
              </p>
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-6xl font-black text-neutral-900 dark:text-white">
                  ฿999
                </span>
                <span className="text-xl text-neutral-500">/month</span>
              </div>
              <p className="text-sm text-neutral-500">
                After your free 30-day trial · about $28 USD
              </p>
            </div>

            <Link
              href="/signup"
              className="block w-full rounded-xl bg-orange-500 py-4 font-bold text-white text-center text-lg transition-colors hover:bg-orange-400 shadow-lg shadow-orange-500/20"
            >
              Start free 30-day trial
              <ArrowRight className="h-5 w-5 inline-block ml-2" />
            </Link>
            <p className="mt-3 text-center text-xs text-neutral-500">
              No credit card · Cancel anytime
            </p>

            <hr className="my-8 border-neutral-200 dark:border-white/10" />

            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
              Everything you get
            </h3>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {INCLUDED.map((item) => (
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
        </motion.section>

        {/* FAQ */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-3 text-neutral-900 dark:text-white">
            Common questions
          </h2>
          <p className="text-center text-neutral-600 dark:text-neutral-400 mb-10">
            Anything else? Email{" "}
            <a
              href="mailto:hello@muaythaipai.com"
              className="text-orange-600 dark:text-orange-400 hover:underline"
            >
              hello@muaythaipai.com
            </a>
            .
          </p>

          <div className="grid gap-2 max-w-2xl mx-auto">
            {FAQS.map((faq, i) => {
              const open = openFaq === i
              return (
                <div
                  key={faq.q}
                  className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-sm overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left"
                  >
                    <span className="font-medium text-neutral-900 dark:text-white text-sm">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-neutral-500 shrink-0 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        {...EXPAND_COLLAPSE}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-4 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-20 text-center">
          <div className="text-5xl mb-4">🐃</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-neutral-900 dark:text-white">
            Try OckOck free for 30 days
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
            See if it fits your gym. If not, no worries — no charge, no awkwardness.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-4 font-bold text-white text-lg transition-colors hover:bg-orange-400 shadow-lg shadow-orange-500/20"
          >
            List your gym
            <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </main>

      <MarketingBottomNav />
    </PageBackground>
  )
}
