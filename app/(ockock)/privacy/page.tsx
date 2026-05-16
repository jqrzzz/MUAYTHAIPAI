import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy · OckOck",
  description: "How OckOck handles your data and your customers' data.",
  robots: { index: false },
}

const SECTIONS: { h: string; body: React.ReactNode }[] = [
  {
    h: "What we collect",
    body: (
      <>
        <span className="text-zinc-300">Account info</span> — your name, email, gym name, and
        location, used to set up and secure your account.{" "}
        <span className="text-zinc-300">Gym data you put in</span> — services, schedules,
        trainers, students, packages, certificates, courses, payment records.{" "}
        <span className="text-zinc-300">Your customers&apos; data</span> — the messages they
        send your gym (LINE, WhatsApp, Instagram, Facebook, web chat, email), their bookings,
        and any details you record about them.{" "}
        <span className="text-zinc-300">Usage & technical data</span> — log data, device/
        browser info, and basic analytics so we can run and improve the service.
      </>
    ),
  },
  {
    h: "How we use it",
    body: (
      <>
        To provide OckOck — bookings, certifications, messaging, reporting — and to power
        OckOck&apos;s AI features (answering your customers in your gym&apos;s voice, drafting
        FAQs, lessons, and replies). To secure the service, prevent abuse, provide support,
        and send you service-related email. We don&apos;t sell your data or your customers&apos;
        data, and we don&apos;t use it to train third-party AI models.
      </>
    ),
  },
  {
    h: "AI processing",
    body: (
      <>
        OckOck&apos;s assistant works by sending relevant gym data and customer messages to an
        AI model provider to generate replies, drafts, and suggestions. That processing
        happens to provide the feature you&apos;re using; the provider acts on our behalf and
        isn&apos;t permitted to use your content to train its models. You can review and
        approve AI-drafted messages before they&apos;re sent.
      </>
    ),
  },
  {
    h: "Who we share it with",
    body: (
      <>
        Service providers who help us run OckOck — hosting/infrastructure, our database
        provider, our AI model provider, and Stripe for payments — each under terms that limit
        them to processing data for us. The messaging platforms you connect (LINE, Meta, etc.)
        receive and send messages through their own APIs under their own terms. We may disclose
        data if required by law. If OckOck is ever acquired, data may transfer as part of that,
        subject to this policy.
      </>
    ),
  },
  {
    h: "Where data lives & how long we keep it",
    body: (
      <>
        Data is hosted with our infrastructure provider; some processing (e.g. AI) may occur
        in other regions. We keep your data while your account is active and for a reasonable
        period afterwards, then delete or anonymise it — except where we need to retain records
        for legal, tax, or security reasons.
      </>
    ),
  },
  {
    h: "Your choices",
    body: (
      <>
        You can view and edit most data from your dashboard. To access, correct, export, or
        delete data — yours or, where you&apos;re the controller, your customers&apos; — email
        us and we&apos;ll help. For your customers&apos; personal data, you&apos;re generally
        the controller and we&apos;re the processor; for your own account data, we&apos;re the
        controller.
      </>
    ),
  },
  {
    h: "Changes & contact",
    body: (
      <>
        We&apos;ll update this policy as the product evolves and give reasonable notice of
        material changes. Questions, requests, or concerns:{" "}
        <a href="mailto:hello@muaythaipai.com" className="text-amber-400 hover:text-amber-300">hello@muaythaipai.com</a>.
      </>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Privacy Policy</h1>
      <p className="mt-3 rounded-lg bg-amber-500/10 px-3.5 py-2 text-[13px] text-amber-300/90 ring-1 ring-amber-500/20">
        Draft — we&apos;re finalising the legal copy. The summary below reflects how OckOck
        actually handles data; questions in the meantime go to{" "}
        <a href="mailto:hello@muaythaipai.com" className="underline">hello@muaythaipai.com</a>.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="text-[16px] font-semibold text-zinc-100">{s.h}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
