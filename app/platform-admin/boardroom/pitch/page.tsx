import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Calendar,
  Check,
  CreditCard,
  Globe,
  MapPin,
  MessageCircle,
  Newspaper,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"
import { PLAN } from "@/lib/ockock/product"
import { SaasShell, SaasHeader } from "@/components/saas"

export const metadata = {
  title: "OckOck — Partner deck",
  robots: "noindex, nofollow",
}

const AVATAR = "/images/ockock-avatar.png"

// ─────────────────────────── tiny presentational helpers ───────────────────────────

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
    <section className={`relative ${tight ? "py-16" : "py-24 md:py-28"} px-4 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-4xl">{children}</div>
    </section>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-indigo-300/80">
      {children}
    </p>
  )
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`font-display text-[34px] leading-[1.05] tracking-tight text-white sm:text-[52px] ${className}`}
    >
      {children}
    </h2>
  )
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 text-[17px] leading-relaxed text-zinc-300 sm:text-[19px]">{children}</p>
}

// ─────────────────────────── the deck ───────────────────────────

export default async function PartnerDeckPage() {
  const { user, isPlatformAdmin } = await getPlatformAdmin()
  if (!user) redirect("/admin/login?redirect=/platform-admin/boardroom/pitch")
  if (!isPlatformAdmin) redirect("/admin")

  return (
    <SaasShell>
      <SaasHeader
        left={<p className="text-[13px] text-zinc-400">Partner deck · v0.1</p>}
        right={
          <Link
            href="/platform-admin/boardroom"
            className="inline-flex items-center gap-1 text-[12px] text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft className="h-3 w-3" />
            Boardroom
          </Link>
        }
      />

      <article>
        {/* ═════════════════ 1. COVER ═════════════════ */}
        <section className="relative overflow-hidden px-4 sm:px-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.22),transparent_60%)]" />
          <div className="relative mx-auto max-w-4xl pb-24 pt-20 text-center sm:pb-28 sm:pt-28">
            <Image
              src={AVATAR}
              alt="OckOck"
              width={300}
              height={300}
              priority
              className="mx-auto h-auto w-[180px] drop-shadow-[0_24px_60px_rgba(99,102,241,0.3)] sm:w-[240px]"
            />
            <h1 className="mt-8 font-display text-[40px] leading-[1.05] tracking-tight text-white sm:text-[68px]">
              The operating system for{" "}
              <span className="text-indigo-400">traditional Muay Thai</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-zinc-400 sm:text-[19px]">
              Built in a Muay Thai gym in Pai, Thailand — the way Thai gyms actually run.
            </p>
            <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-[12px] text-zinc-300">
              <Newspaper className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-zinc-500">As featured in</span>
              <span className="font-display tracking-[0.1em] text-zinc-100">National Geographic</span>
            </div>
          </div>
        </section>

        {/* ═════════════════ 2. THE PROBLEM ═════════════════ */}
        <Section>
          <Eyebrow>The problem</Eyebrow>
          <H2>
            Thailand's gyms run on spreadsheets, LINE chats, and a wall calendar.
          </H2>
          <Lead>
            Muay Thai is Thailand's heritage and one of its biggest cultural exports. The gyms preserving
            it use the same tools they used twenty years ago. Generic gym software treats Muay Thai like
            CrossFit — nothing built for how a Thai gym actually runs.
          </Lead>

          <div className="mt-12 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-zinc-900/40 p-6 ring-1 ring-zinc-900">
              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Today</p>
              <p className="mt-2 font-display text-[20px] text-zinc-200">Spreadsheets · LINE threads · cash-in-a-drawer</p>
              <p className="mt-3 text-[14px] leading-relaxed text-zinc-500">
                Bookings missed. Trainers' signoffs lost. Tourists messaging in five languages. Ranks
                tracked in someone's head.
              </p>
            </div>
            <div className="rounded-2xl bg-indigo-500/[0.05] p-6 ring-1 ring-indigo-500/20">
              <p className="text-[11px] uppercase tracking-[0.16em] text-indigo-300/80">With OckOck</p>
              <p className="mt-2 font-display text-[20px] text-white">
                One dashboard, an AI in your voice, a portable rank ladder.
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-zinc-400">
                Bookings, students, trainers, certifications, payments — and OckOck answers customers in
                Thai or English while you teach.
              </p>
            </div>
          </div>
        </Section>

        {/* ═════════════════ 3. WHAT WE'RE BUILDING ═════════════════ */}
        <Section className="bg-gradient-to-b from-transparent via-indigo-500/[0.025] to-transparent">
          <Eyebrow>What we're building</Eyebrow>
          <H2>
            OckOck — your gym's <span className="text-indigo-400">friendly receptionist</span> and
            the network's spine.
          </H2>
          <Lead>
            One product, two faces. To a gym owner, it's the software that runs everything. To the
            network, it's the platform that connects every gym, student, fighter, and promoter in Muay
            Thai.
          </Lead>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Calendar, title: "Bookings & students", body: "Class scheduling, payments, student notes, trainer signoffs. Bilingual." },
              { icon: MessageCircle, title: "OckOck the AI", body: "Answers your customers in your gym's voice — LINE, WhatsApp, web, in Thai or English." },
              { icon: Award, title: "Naga–Garuda cert ladder", body: "The 5-level credential, verifiable, portable across every gym in the network." },
              { icon: Users, title: "Trainer-friendly", body: "Skill signoff from a phone. Students see their progress live." },
              { icon: Sparkles, title: "OckOck does the busywork", body: "Drafts FAQs, lessons, quizzes, replies — you approve, OckOck handles." },
              { icon: Globe, title: "Network membership", body: "Listed on the MUAYTHAIPAI network. Travelers find your gym; cert students bring their progress." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-zinc-900/40 p-5 ring-1 ring-zinc-900">
                <div className="mb-3 inline-flex rounded-lg bg-indigo-500/10 p-2.5">
                  <f.icon className="h-5 w-5 text-indigo-300" />
                </div>
                <p className="text-[15px] font-semibold text-zinc-100">{f.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">{f.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ═════════════════ 4. LAYER 1 — THE WEDGE ═════════════════ */}
        <Section>
          <Eyebrow>Layer 1 — The wedge</Eyebrow>
          <H2>The gym SaaS gets us into every Muay Thai gym in Thailand, organically.</H2>
          <Lead>
            One plan. Free for {PLAN.trialDays} days, then ฿{PLAN.priceTHB}/month all-in. OckOck pays for itself in the first
            week of saved-time and recovered-bookings. Currently live with the{" "}
            <span className="text-zinc-100">Wisarut Family Gym</span> in Pai — our first paying
            customer and the gym this whole thing was built alongside.
          </Lead>

          <div className="mt-12 rounded-3xl bg-gradient-to-b from-indigo-500/[0.08] to-zinc-900/40 p-8 ring-1 ring-indigo-500/25 sm:p-10">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-indigo-300/80">One plan</p>
                <p className="mt-1 font-display text-[40px] tracking-tight text-white sm:text-[52px]">
                  ฿{PLAN.priceTHB}
                  <span className="ml-1 text-[18px] text-zinc-500">/month</span>
                </p>
                <p className="mt-1 text-[13px] text-zinc-500">
                  About ${PLAN.priceUSDApprox} USD · free {PLAN.trialDays}-day trial, no card required
                </p>
              </div>
              <ul className="grid gap-y-2 text-[13px] text-zinc-300 sm:grid-cols-2 sm:gap-x-8">
                {[
                  "Unlimited gyms / students / trainers",
                  "Bilingual chat — Thai & English",
                  "Naga–Garuda cert ladder",
                  "Public gym page on the network",
                  "Inbox: LINE / WhatsApp / IG / FB",
                  "We take 0% of your bookings",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* ═════════════════ 5. LAYER 2 — THE MOAT ═════════════════ */}
        <Section className="bg-gradient-to-b from-transparent via-indigo-500/[0.025] to-transparent">
          <Eyebrow>Layer 2 — The moat</Eyebrow>
          <H2>
            The Naga–Garuda credential ladder — Kingdom-recognized, portable across every gym.
          </H2>
          <Lead>
            What turns "a SaaS" into "<em className="not-italic text-white">the</em> SaaS for Muay Thai."
            Five ranks named for Thailand's guardian creatures. When OckOck is in 100 gyms, a student's
            standing isn't gym-specific — it's network-wide. Every cert issued pulls the network deeper.
          </Lead>

          <div className="mt-12 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {CERTIFICATION_LEVELS.map((lvl) => (
              <div
                key={lvl.id}
                className="rounded-2xl bg-zinc-900/40 p-4 text-center ring-1 ring-zinc-900"
              >
                <div className="text-3xl">{lvl.icon}</div>
                <p className={`mt-2 font-display text-[15px] ${lvl.color}`}>{lvl.name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                  Rank {lvl.number}
                </p>
                <p className="mt-1.5 text-[11px] text-zinc-500">{lvl.creature}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-amber-500/[0.04] p-5 ring-1 ring-amber-500/20">
            <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300/90">Authority partnerships — in motion</p>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-300">
              Conversations open with traditional credentialing bodies. Big Dog is driving — these are
              6–18 month relationships, started now so the cert ladder carries the official stamp the
              moment we have density.
            </p>
          </div>
        </Section>

        {/* ═════════════════ 6. THE FLYWHEEL ═════════════════ */}
        <Section>
          <Eyebrow>The flywheel</Eyebrow>
          <H2>Each layer reinforces the one below.</H2>
          <Lead>
            The gym SaaS gets us into every gym. The credential ladder makes the network worth being on.
            That network of credentialed fighters becomes a marketplace promoters can search. The events
            promoters run become tickets. Tickets become the funnel for everything after.
          </Lead>

          <ol className="mt-12 space-y-3">
            {[
              { n: "1", t: "Gyms", b: "OckOck runs the gym. The gym joins the network." },
              { n: "2", t: "Students & credentials", b: "Every student tracked, every signoff recorded, every cert verifiable on a single ladder." },
              { n: "3", t: "Fighters & promoters", b: "Credentialed fighters listed. Promoters find them. Match-making, contracts, payouts." },
              { n: "4", t: "Events & tickets", b: "Promoters run cards. The network sells tickets. We're the ticketing platform for Thai Muay Thai." },
              { n: "5", t: "Long horizon", b: "Regulated prediction markets, via licensed partners only." },
            ].map((step) => (
              <li
                key={step.n}
                className="flex items-start gap-4 rounded-2xl bg-zinc-900/40 p-5 ring-1 ring-zinc-900"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)]">
                  {step.n}
                </span>
                <div>
                  <p className="font-display text-[18px] text-white">{step.t}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-zinc-400">{step.b}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* ═════════════════ 7. TRACTION ═════════════════ */}
        <Section className="bg-gradient-to-b from-transparent via-indigo-500/[0.025] to-transparent">
          <Eyebrow>Traction</Eyebrow>
          <H2>What's real today.</H2>

          <div className="mt-12 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-zinc-900/40 p-6 ring-1 ring-zinc-900">
              <div className="mb-3 inline-flex rounded-lg bg-amber-500/10 p-2.5">
                <Newspaper className="h-5 w-5 text-amber-300" />
              </div>
              <p className="font-display text-[18px] text-white">National Geographic</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
                Published feature on traditional Muay Thai preservation — the cultural anchor and a real
                door-opener for gym outreach.
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-900/40 p-6 ring-1 ring-zinc-900">
              <div className="mb-3 inline-flex rounded-lg bg-indigo-500/10 p-2.5">
                <Trophy className="h-5 w-5 text-indigo-300" />
              </div>
              <p className="font-display text-[18px] text-white">Wisarut Family Gym</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
                First paying customer. The gym OckOck was built alongside, in Pai. Live on the platform;
                the cert ladder issuing real credentials.
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-900/40 p-6 ring-1 ring-zinc-900">
              <div className="mb-3 inline-flex rounded-lg bg-emerald-500/10 p-2.5">
                <CreditCard className="h-5 w-5 text-emerald-300" />
              </div>
              <p className="font-display text-[18px] text-white">Authority pipeline</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">
                Cert-authority partnerships in motion — Big Dog driving relationships toward the official
                Kingdom-recognized stamp.
              </p>
            </div>
          </div>
        </Section>

        {/* ═════════════════ 8. TEAM ═════════════════ */}
        <Section>
          <Eyebrow>Team & partnership</Eyebrow>
          <H2>Built by people who actually trained in this.</H2>

          <ul className="mt-12 space-y-3">
            <li className="flex items-start gap-4 rounded-2xl bg-zinc-900/40 p-5 ring-1 ring-zinc-900">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[16px] ring-1 ring-indigo-500/30">
                🧠
              </span>
              <div>
                <p className="font-display text-[18px] text-white">Founder · product</p>
                <p className="mt-1 text-[14px] leading-relaxed text-zinc-400">
                  Built OckOck end-to-end alongside the Wisarut family. Holds the product vision and the
                  technical execution.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4 rounded-2xl bg-zinc-900/40 p-5 ring-1 ring-zinc-900">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[16px] ring-1 ring-indigo-500/30">
                🤝
              </span>
              <div>
                <p className="font-display text-[18px] text-white">Big Dog · partnerships</p>
                <p className="mt-1 text-[14px] leading-relaxed text-zinc-400">
                  Drives the credentialing-authority relationships and the broader partnership work. The
                  most important non-code job: turning the cert ladder into the recognized Thai-Muay-Thai
                  credential.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4 rounded-2xl bg-zinc-900/40 p-5 ring-1 ring-zinc-900">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[16px] ring-1 ring-amber-500/30">
                🥊
              </span>
              <div>
                <p className="font-display text-[18px] text-white">Wisarut Family Gym</p>
                <p className="mt-1 text-[14px] leading-relaxed text-zinc-400">
                  Foundational customer + cultural anchor. The gym this product is shaped around; the
                  legitimacy that makes "for Thai gyms" not a marketing line.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4 rounded-2xl bg-zinc-900/40 p-5 ring-1 ring-zinc-900">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[16px] ring-1 ring-amber-500/30">
                📰
              </span>
              <div>
                <p className="font-display text-[18px] text-white">National Geographic feature</p>
                <p className="mt-1 text-[14px] leading-relaxed text-zinc-400">
                  Independent cultural credibility for the "preserve traditional Muay Thai" mission.
                  Already in market.
                </p>
              </div>
            </li>
          </ul>
        </Section>

        {/* ═════════════════ 9. ROADMAP ═════════════════ */}
        <Section className="bg-gradient-to-b from-transparent via-indigo-500/[0.025] to-transparent">
          <Eyebrow>Roadmap</Eyebrow>
          <H2>Bottom-up. Each horizon unlocks the next.</H2>

          <div className="mt-12 grid gap-3 lg:grid-cols-4">
            {[
              {
                tag: "Now → next quarter",
                title: "Scale the wedge",
                body: "10 paying Thai gyms. Refine OckOck with real owner feedback. Cert ladder issuing certs in the wild. Nat Geo as outreach fuel.",
                tone: "indigo",
              },
              {
                tag: "6 months",
                title: "Authority + fighters",
                body: "First credential-authority partnership signed. Fighter directory + promoter accounts go live on top of the credentialed network.",
                tone: "indigo",
              },
              {
                tag: "12+ months",
                title: "Ticketing marketplace",
                body: "Events + ticketing on top of the active fighter+promoter network. Promoters run cards; we run the ticketing platform.",
                tone: "zinc",
              },
              {
                tag: "Year 2+",
                title: "Long horizon",
                body: "Regulated prediction markets, via licensed sportsbook partners only. Heritage-first, not gambling-first.",
                tone: "zinc",
              },
            ].map((p) => (
              <div
                key={p.tag}
                className={`rounded-2xl p-5 ring-1 ${p.tone === "indigo" ? "bg-indigo-500/[0.05] ring-indigo-500/25" : "bg-zinc-900/40 ring-zinc-900"}`}
              >
                <p className={`text-[10px] uppercase tracking-[0.16em] ${p.tone === "indigo" ? "text-indigo-300/80" : "text-zinc-500"}`}>
                  {p.tag}
                </p>
                <p className="mt-2 font-display text-[18px] text-white">{p.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{p.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ═════════════════ 10. CLOSE ═════════════════ */}
        <Section tight>
          <div className="rounded-3xl bg-gradient-to-b from-indigo-500/[0.1] to-zinc-900/40 p-10 text-center ring-1 ring-indigo-500/25 sm:p-14">
            <div className="mb-5 text-5xl">🐃</div>
            <H2 className="text-[28px] sm:text-[40px]">
              Let's build the operating system for Muay Thai.
            </H2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-400">
              Partnership, introductions to credentialing bodies, gym connections, capital — all
              welcome. The cert ladder is built; the wedge is in market; the network is the next mile.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="mailto:hello@muaythaipai.com"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-6 text-[14px] font-semibold text-white transition-colors hover:bg-indigo-400"
              >
                hello@muaythaipai.com
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <Link
                href="/platform-admin/boardroom"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-800/80 px-6 text-[14px] font-medium text-zinc-100 transition-colors hover:bg-zinc-700"
              >
                Back to the Boardroom
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-8 inline-flex items-center gap-1.5 text-[11px] text-zinc-600">
              <MapPin className="h-3 w-3" /> Pai · Thailand
            </p>
          </div>
        </Section>

        <footer className="mx-auto max-w-3xl px-5 pb-12 text-center">
          <p className="text-[11px] text-zinc-600">
            Partner deck · v0.1 · Confidential — please don't share without asking.
          </p>
        </footer>
      </article>
    </SaasShell>
  )
}
