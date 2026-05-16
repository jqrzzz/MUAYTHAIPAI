"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Check, ChevronDown } from "lucide-react"
import { Surface } from "@/components/saas"
import { OckOckCta } from "@/components/ockock/ockock-cta"
import { PLAN, INCLUDED } from "@/lib/ockock/product"

const FADE = { duration: 0.5, ease: "easeOut" as const }

const FAQS = [
  {
    q: `What happens after the ${PLAN.trialDays}-day trial?`,
    a: `If you love OckOck, you can subscribe for ฿${PLAN.priceTHB}/month. If not, your account stays in read-only — no charge, no awkward sales call.`,
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
    a: `No. The ฿${PLAN.priceTHB}/month is all-in. You keep 100% of what your students pay.`,
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
    <div className="px-4 sm:px-6">
      {/* Hero */}
      <section className="mx-auto max-w-3xl pt-16 pb-8 text-center sm:pt-24">
        <motion.div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1.5 text-[12px] font-medium text-amber-300"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={FADE}
        >
          <span className="text-sm leading-none">🐃</span>
          Friendly pricing
        </motion.div>

        <motion.h1
          className="text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...FADE, delay: 0.08 }}
        >
          One plan. Everything included.
        </motion.h1>

        <motion.p
          className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-zinc-400"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...FADE, delay: 0.16 }}
        >
          No tiers, no upsells, no &ldquo;contact sales.&rdquo; Free for{" "}
          {PLAN.trialDays} days, then ฿{PLAN.priceTHB}/month.
        </motion.p>
      </section>

      {/* Pricing card */}
      <motion.section
        className="mx-auto max-w-2xl py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...FADE, delay: 0.24 }}
      >
        <Surface accent="indigo" className="p-8 md:p-10">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-amber-400">
              MUAYTHAIPAI network
            </p>
            <div className="mb-1 flex items-baseline justify-center gap-1">
              <span className="text-6xl font-semibold tracking-tight text-white">
                ฿{PLAN.priceTHB}
              </span>
              <span className="text-xl text-zinc-500">/month</span>
            </div>
            <p className="text-[13px] text-zinc-500">
              After your free {PLAN.trialDays}-day trial · about ${PLAN.priceUSDApprox} USD
            </p>
          </div>

          <OckOckCta href="/signup" size="lg" className="w-full">
            Start free {PLAN.trialDays}-day trial
            <ArrowRight className="h-4 w-4" />
          </OckOckCta>
          <p className="mt-3 text-center text-[12px] text-zinc-600">
            No credit card · Cancel anytime
          </p>

          <hr className="my-8 border-zinc-800" />

          <h3 className="mb-4 text-[14px] font-semibold text-zinc-100">
            Everything you get
          </h3>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-[13px] text-zinc-300"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Surface>
      </motion.section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Common questions
          </h2>
          <p className="mt-2 text-[14px] text-zinc-500">
            Anything else? Email{" "}
            <a
              href="mailto:hello@muaythaipai.com"
              className="text-amber-400 transition-colors hover:text-amber-300"
            >
              hello@muaythaipai.com
            </a>
            .
          </p>
        </div>

        <div className="grid gap-2">
          {FAQS.map((faq, i) => {
            const open = openFaq === i
            return (
              <Surface key={faq.q}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="text-[14px] font-medium text-zinc-100">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-[13px] leading-relaxed text-zinc-400">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Surface>
            )
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-2xl py-16 text-center">
        <div className="mb-4 text-5xl">🐃</div>
        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Try OckOck free for {PLAN.trialDays} days
        </h2>
        <p className="mx-auto mb-8 max-w-md text-[15px] text-zinc-400">
          See if it fits your gym. If not, no worries — no charge, no
          awkwardness.
        </p>
        <OckOckCta href="/signup" size="lg">
          List your gym
          <ArrowRight className="h-4 w-4" />
        </OckOckCta>
      </section>
    </div>
  )
}
