"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Send,
  Check,
  Calendar,
  Award,
  MessageCircle,
  Users,
  Sparkles,
  Globe,
} from "lucide-react"
import { Surface } from "@/components/saas"
import { OckOckCta } from "@/components/ockock/ockock-cta"
import { SocialSignupButtons } from "@/components/ockock/social-signup-buttons"
import { PLAN, FEATURES } from "@/lib/ockock/product"

const AVATAR = "/images/ockock-avatar.png"

const GREETING =
  "Sawadee! I'm OckOck 🐃 — I help run Muay Thai gyms in Thailand. Ask me anything about the software, the pricing, or getting set up. (You can write in Thai too — เขียนภาษาไทยได้นะ.)"

const CHIPS = [
  { label: "I run a Muay Thai gym", send: "I run a Muay Thai gym in Thailand — how does OckOck work?" },
  { label: "What does it cost?", send: "What does OckOck cost?" },
  { label: "พูดภาษาไทยได้ไหม?", send: "พูดภาษาไทยได้ไหม?" },
  { label: "I want to train in Thailand", send: "I'm a traveler looking to train Muay Thai in Thailand." },
] as const

const FEATURE_ICONS = [Calendar, Award, MessageCircle, Users, Sparkles, Globe] as const

const STEPS = [
  { number: "1", title: "List your gym", desc: "30 seconds — name, location, your email. We send a magic link to sign in." },
  { number: "2", title: "Train OckOck", desc: "Add your services, hours, and trainers. OckOck reads your gym data and starts answering customers in your voice." },
  { number: "3", title: "Go live", desc: "Share your booking link, issue your first certificate, and let OckOck handle the rest." },
] as const

const BUILT_FOR = [
  "Naga, Phayra Nak, Singha, Hanuman, Garuda — issue all five",
  "Bilingual customer chat (Thai + English)",
  "Trainer skill signoff from a phone",
  "WhatsApp / LINE / email handled in one inbox",
  "Travelers find you on the network",
  "Promoter tools for fight events",
] as const

type Msg = { role: "user" | "assistant"; content: string }

export default function ForGymsClient() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  const startChat = useCallback(() => {
    if (!started) {
      setStarted(true)
      setMessages([{ role: "assistant", content: GREETING }])
    }
    inputRef.current?.focus()
  }, [started])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return
      const base: Msg[] = started ? messages : [{ role: "assistant", content: GREETING }]
      const next: Msg[] = [...base, { role: "user", content: trimmed }]
      setStarted(true)
      setMessages(next)
      setInput("")
      setLoading(true)
      try {
        const res = await fetch("/api/landing/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        })
        const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string }
        const reply =
          (typeof data.reply === "string" && data.reply.trim()) ||
          (typeof data.error === "string" && data.error.trim()) ||
          'Hmm — something went wrong on my end 🐃. Try again, or just hit "Start free trial" above.'
        setMessages((m) => [...m, { role: "assistant", content: reply }])
      } catch {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "I couldn't reach my brain just now 🐃 — give it a sec and try again, or start the free trial above." },
        ])
      } finally {
        setLoading(false)
      }
    },
    [loading, messages, started],
  )

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages, loading])

  return (
    <div className="px-4 sm:px-6">
      {/* ============================ HERO — talk to OckOck ============================ */}
      <section className="relative mx-auto flex max-w-3xl flex-col items-center pt-14 pb-16 text-center sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-2 -z-10 h-[440px] w-[440px] -translate-x-1/2 rounded-full bg-amber-500/20 blur-[110px]"
        />

        <motion.button
          type="button"
          onClick={startChat}
          aria-label="Chat with OckOck"
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          whileTap={{ scale: 0.96 }}
        >
          <Image
            src={AVATAR}
            alt="OckOck"
            width={300}
            height={300}
            priority
            className="h-auto w-[190px] select-none drop-shadow-[0_24px_60px_rgba(99,102,241,0.3)] sm:w-[270px]"
          />
        </motion.button>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-[40px] sm:leading-tight">
          Run your Muay Thai gym with <span className="text-amber-400">OckOck</span>
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          Bookings, the Naga–Garuda cert ladder, and an AI that answers your customers in Thai or English.
          One plan — ฿{PLAN.priceTHB}/month after a free {PLAN.trialDays}-day trial.
        </p>

        {/* conversation thread (appears once you start) */}
        {started && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-7 w-full"
          >
            <div
              ref={threadRef}
              role="log"
              aria-live="polite"
              aria-label="Chat with OckOck"
              className="max-h-[44vh] space-y-3 overflow-y-auto rounded-2xl bg-zinc-900/40 p-4 text-left ring-1 ring-zinc-900"
            >
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex items-start gap-2"}>
                  {m.role === "assistant" && (
                    <Image src={AVATAR} alt="" width={28} height={28} className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-zinc-800 object-contain p-0.5" />
                  )}
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-amber-500 px-3.5 py-2 text-[14px] leading-relaxed text-white"
                        : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-zinc-800/80 px-3.5 py-2 text-[14px] leading-relaxed text-zinc-100"
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-2">
                  <Image src={AVATAR} alt="" width={28} height={28} className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-zinc-800 object-contain p-0.5" />
                  <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-zinc-800/80 px-3.5 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* audience chips — before the chat starts */}
        {!started && (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {CHIPS.map((c) => (
              <button
                key={c.label}
                onClick={() => send(c.send)}
                className="rounded-full bg-zinc-900/60 px-3.5 py-1.5 text-[13px] text-zinc-300 ring-1 ring-zinc-800 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* chat bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="mt-5 flex w-full max-w-xl items-center gap-2 rounded-2xl bg-zinc-900/60 p-2 ring-1 ring-zinc-800 transition-colors focus-within:ring-amber-500/40"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              if (!started) startChat()
            }}
            placeholder="Talk to OckOck — Thai or English…"
            aria-label="Message OckOck"
            className="flex-1 bg-transparent px-3 py-2 text-[15px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition-colors hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {/* always-visible conversion path */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <OckOckCta href="/signup" size="lg">
            Start free {PLAN.trialDays}-day trial
            <ArrowRight className="h-4 w-4" />
          </OckOckCta>
          <SocialSignupButtons label="Or jump straight in with" className="w-full max-w-xs" />
          <p className="text-[12px] text-zinc-600">
            No credit card · Cancel anytime · This is the same OckOck that runs in your gym
          </p>
        </div>
      </section>

      {/* ============================ Built for Muay Thai ============================ */}
      <section className="mx-auto max-w-5xl py-10">
        <Surface accent="indigo" className="p-8 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="mb-4 text-5xl">🐃</div>
              <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Built for Muay Thai, not bolted on
              </h2>
              <p className="mb-4 text-[15px] leading-relaxed text-zinc-300">
                Generic gym software treats Muay Thai like CrossFit. We don&apos;t. The Naga–Garuda cert
                ladder, Wai Kru tracking, fight-event promotion — the whole approach is shaped around how
                Thai gyms actually run.
              </p>
              <p className="text-[15px] leading-relaxed text-zinc-300">
                OckOck (อ๊อกอ๊อก) speaks your customers&apos; language — Thai and English — and answers like
                a Thai trainer would, not like a chatbot.
              </p>
              <Link
                href="/vision"
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-amber-300 transition-colors hover:text-amber-200"
              >
                Read the full story
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="space-y-3">
              {BUILT_FOR.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[14px] text-zinc-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Surface>
      </section>

      {/* ============================ Feature grid ============================ */}
      <section id="features" className="mx-auto max-w-5xl scroll-mt-20 py-10">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">What you get</h2>
          <p className="mx-auto mt-2 max-w-xl text-[14px] text-zinc-500">
            Built for Muay Thai gyms, not generic gym software bolted on.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = FEATURE_ICONS[i] ?? Sparkles
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: (i % 3) * 0.05, duration: 0.4 }}
              >
                <Surface className="h-full p-5">
                  <div className="mb-3 inline-flex rounded-lg bg-amber-500/10 p-2.5">
                    <Icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="mb-1.5 text-[15px] font-semibold text-zinc-100">{feature.title}</h3>
                  <p className="text-[13px] leading-relaxed text-zinc-400">{feature.desc}</p>
                </Surface>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ============================ Three steps ============================ */}
      <section className="mx-auto max-w-4xl py-10">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Three steps to live</h2>
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
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-500 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)]">
                {step.number}
              </div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-zinc-100">{step.title}</h3>
              <p className="mx-auto max-w-[16rem] text-[13px] leading-relaxed text-zinc-400">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================ Pricing teaser ============================ */}
      <section className="mx-auto max-w-3xl py-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Simple, friendly pricing</h2>
        <p className="mb-8 mt-2 text-[14px] text-zinc-500">One plan. Everything included. Free to start.</p>
        <Surface accent="indigo" className="mx-auto max-w-md p-8">
          <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-amber-400">MUAYTHAIPAI network</p>
          <div className="mb-1 flex items-baseline justify-center gap-1">
            <span className="text-5xl font-semibold tracking-tight text-white">฿{PLAN.priceTHB}</span>
            <span className="text-[16px] text-zinc-500">/month</span>
          </div>
          <p className="mb-6 text-[13px] text-zinc-500">After your free {PLAN.trialDays}-day trial · about ${PLAN.priceUSDApprox} USD</p>
          <OckOckCta href="/signup" className="w-full">
            Start free trial
          </OckOckCta>
          <Link href="/pricing" className="mt-3 inline-block text-[13px] text-amber-400 transition-colors hover:text-amber-300">
            See what&apos;s included →
          </Link>
        </Surface>
      </section>

      {/* ============================ Final CTA ============================ */}
      <section className="mx-auto max-w-2xl py-16 text-center">
        <div className="mb-4 text-5xl">🐃</div>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-white md:text-3xl">Ready to meet OckOck?</h2>
        <p className="mx-auto mb-8 max-w-md text-[15px] text-zinc-400">
          Ask OckOck anything up top — or just sign up. Most gyms take their first booking the same day.
        </p>
        <OckOckCta href="/signup" size="lg">
          List your gym — free {PLAN.trialDays}-day trial
          <ArrowRight className="h-4 w-4" />
        </OckOckCta>
        <p className="mt-3 text-[12px] text-zinc-600">No credit card · Cancel anytime · Setup help included</p>
      </section>
    </div>
  )
}
