import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service · OckOck",
  description: "The terms for using OckOck — the Muay Thai gym software.",
  robots: { index: false },
}

const SECTIONS: { h: string; body: React.ReactNode }[] = [
  {
    h: "1. Who we are",
    body: (
      <>
        OckOck is software for running a Muay Thai gym, operated as part of the MUAYTHAIPAI
        network. &ldquo;OckOck&rdquo;, &ldquo;we&rdquo; and &ldquo;us&rdquo; mean the operator
        of this service; &ldquo;you&rdquo; means the gym (and the people you authorise to use
        the account).
      </>
    ),
  },
  {
    h: "2. The service",
    body: (
      <>
        OckOck lets your gym manage bookings, students, trainers, certifications, courses,
        payments, and customer messaging, and includes an AI assistant (&ldquo;OckOck&rdquo;)
        that helps answer your customers and draft content. We may add, change, or remove
        features over time. We provide the service &ldquo;as is&rdquo; — see section 6.
      </>
    ),
  },
  {
    h: "3. Your account",
    body: (
      <>
        You sign in with a magic link sent to your email. You&apos;re responsible for what
        happens under your account, for keeping your email secure, and for the conduct of
        anyone you invite (owners, trainers, staff). Tell us promptly if you think your
        account has been compromised. You must be authorised to act for the gym you register.
      </>
    ),
  },
  {
    h: "4. Free trial & billing",
    body: (
      <>
        New gyms get a free 30-day trial — no credit card required to start. After the trial,
        continued use requires a paid subscription (one plan, billed monthly; the price shown
        on our pricing page applies). You can cancel anytime from your dashboard; if you
        don&apos;t subscribe after the trial, or you cancel, your account moves to read-only
        rather than being deleted. Payments are processed by Stripe under their terms; Stripe&apos;s
        standard card-processing fees apply to card payments you take from your customers — we
        don&apos;t take a cut of your bookings. Taxes, if any, are your responsibility.
      </>
    ),
  },
  {
    h: "5. Your content & your customers' data",
    body: (
      <>
        Your gym&apos;s data — services, schedules, students, messages, certificates, and so
        on — stays yours. You grant us the rights needed to host, process, back up, and
        display it so the service works, including processing it (and your customers&apos;
        messages) through our AI to provide OckOck&apos;s features. You&apos;re responsible
        for having the right to collect and use your customers&apos; information, for telling
        them how it&apos;s used, and for not uploading anything you don&apos;t have the rights
        to. See our <a href="/privacy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a> for details on data handling.
      </>
    ),
  },
  {
    h: "6. Acceptable use",
    body: (
      <>
        Don&apos;t use OckOck to break the law, spam people, send abusive or deceptive
        messages, infringe others&apos; rights, probe or disrupt the service, or resell it
        without our agreement. We may suspend an account that puts the service, other gyms, or
        their customers at risk.
      </>
    ),
  },
  {
    h: "7. Availability & no warranty",
    body: (
      <>
        We work to keep OckOck running and accurate, but we don&apos;t guarantee it will be
        uninterrupted, error-free, or that the AI will always be right — review AI-drafted
        messages before they go out. To the extent the law allows, the service is provided
        without warranties, and our liability for any claim relating to the service is limited
        to the fees you paid us in the 12 months before the claim.
      </>
    ),
  },
  {
    h: "8. Termination",
    body: (
      <>
        You can stop using OckOck and cancel anytime. We may suspend or end an account for a
        material breach of these terms or non-payment. On a request to delete your data,
        we&apos;ll do so within a reasonable period, except where we need to keep records for
        legal or accounting reasons.
      </>
    ),
  },
  {
    h: "9. Changes & contact",
    body: (
      <>
        We may update these terms; if we make a material change we&apos;ll give reasonable
        notice. Continuing to use OckOck after a change means you accept it. Questions about
        these terms? Email <a href="mailto:hello@muaythaipai.com" className="text-indigo-400 hover:text-indigo-300">hello@muaythaipai.com</a>.
      </>
    ),
  },
]

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Terms of Service</h1>
      <p className="mt-3 rounded-lg bg-amber-500/10 px-3.5 py-2 text-[13px] text-amber-300/90 ring-1 ring-amber-500/20">
        Draft — we&apos;re finalising the legal copy. The summary below reflects how OckOck
        actually works; questions in the meantime go to{" "}
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
