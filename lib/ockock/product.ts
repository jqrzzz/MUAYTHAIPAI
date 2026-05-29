/**
 * Single source of truth for OckOck product facts — plan, price, trial,
 * features. Read by /for-gyms, /pricing, and the landing-chat AI so the
 * three can't drift. Marketing copy that's page-specific (headlines, FAQ
 * wording) stays on the page; the *facts* live here.
 */

export const OCKOCK = {
  name: "OckOck",
  thaiName: "อ๊อกอ๊อก",
  contactEmail: "hello@muaythaipai.com",
  /** One-line "what is this" for cold visitors. */
  oneLiner:
    "Run your Muay Thai gym with OckOck — bookings, the Naga–Garuda cert ladder, and an AI that answers your customers in Thai or English.",
} as const

export const PLAN = {
  priceTHB: 999,
  priceUSDApprox: 28,
  /** Exact Stripe charge in USD cents. Single source of truth for any
   * Stripe checkout / subscription line items + the DB column
   * gym_subscriptions.monthly_price_usd_cents. */
  priceUSDCents: 2900,
  trialDays: 30,
  creditCardRequired: false,
} as const

/** Short feature list — used by the marketing grid and the chat overview. */
export const FEATURES: ReadonlyArray<{ title: string; desc: string }> = [
  {
    title: "Bookings & students",
    desc: "Class scheduling, payments, student notes, and trainer signoffs in one dashboard. Bilingual — English & Thai.",
  },
  {
    title: "Naga–Garuda cert ladder",
    desc: "Issue the 5-level Muay Thai certifications students actually want. Their progress is portable across the network.",
  },
  {
    title: "OckOck answers customers",
    desc: "Your gym's friendly receptionist — knows your services, hours, prices, and trainers, and replies in your voice on chat and email.",
  },
  {
    title: "Trainer-friendly",
    desc: "Trainers sign off skills from their phone. Students see their progress live. No spreadsheets, no missed signoffs.",
  },
  {
    title: "OckOck does the busywork",
    desc: "Drafts FAQs from your data, suggests course lessons, generates quizzes, replies to leads — you approve, OckOck handles it.",
  },
  {
    title: "Network membership",
    desc: "A public page on muaythaipai.com — the network where travelers and students discover Muay Thai gyms in Thailand. Your cert students' progress travels with them.",
  },
]

/** Full "everything included" list for the pricing page. */
export const INCLUDED: ReadonlyArray<string> = [
  "Unlimited bookings & students",
  "Unlimited trainers & staff",
  "Naga–Garuda certification ladder (all 5 levels)",
  "OckOck answers customer questions in your voice",
  "OckOck drafts FAQs, lessons, and quizzes from your data",
  "Bilingual chat — Thai & English",
  "Trainer skill signoff from any phone",
  "Online courses authoring",
  "Stripe payments + cash tracking",
  "Public gym page on muaythaipai.com (the discovery portal)",
  "Promoter tools (fight events, tickets, fighters)",
  "Inbox: WhatsApp, LINE, email in one place",
  "Reports — students, certs, revenue, top trainers",
  "Setup help from a real human",
]

/** Plain-English facts the landing chat is allowed to state. */
export const KEY_FACTS: ReadonlyArray<string> = [
  `One plan — ฿${PLAN.priceTHB}/month (about $${PLAN.priceUSDApprox} USD). No tiers, no upsells, no "contact sales".`,
  `Free for ${PLAN.trialDays} days. No credit card to start — just your gym name and email; we send a magic link to sign in.`,
  "No setup fee — we help you import your services, hours, and trainers.",
  "Cancel anytime from your dashboard. After the trial, if you don't subscribe, your account goes read-only — no charge, no awkward sales call.",
  `OckOck takes no cut of your bookings — the ฿${PLAN.priceTHB}/month is all-in; you keep 100% of what students pay. (Stripe's standard card fee — roughly 3.65% + ฿11 for Thai cards — applies only to card payments; cash has no fee.)`,
  "OckOck handles Thai and English natively — ตอบลูกค้าได้ทั้งภาษาไทยและอังกฤษ.",
  "Built for Muay Thai gyms specifically — the cert ladder, Wai Kru tracking, fight-event promotion — not generic gym software bolted on.",
  "Most gyms take bookings the same day they sign up: list your gym → train OckOck on your services → go live.",
]

/** Compact knowledge block for the landing-chat system prompt. */
export function ockockKnowledgeBlock(): string {
  return [
    "## What OckOck is",
    OCKOCK.oneLiner,
    "",
    "## Pricing & terms",
    ...KEY_FACTS.map((f) => `- ${f}`),
    "",
    "## What's included in the plan",
    ...INCLUDED.map((f) => `- ${f}`),
    "",
    "## Getting started",
    "- Sign up at /signup — gym name, your name, email, location. ~30 seconds; we email a magic link.",
    "- After signing in, a short guided setup covers gym details, services, hours, the cert ladder, meeting OckOck, and connecting channels (WhatsApp / LINE / etc.).",
    "- Then you're live — OckOck starts answering your customers in your gym's voice.",
  ].join("\n")
}
