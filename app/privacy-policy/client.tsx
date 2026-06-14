"use client"

import { PageBackground, MarketingTopNav, MarketingBottomNav } from "@/components/marketing"

const H2 = "text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-3"
const A = "text-orange-600 dark:text-amber-400 hover:underline"
const UL = "list-disc pl-6 space-y-2 my-4"

export function PrivacyPolicyClient() {
  return (
    <PageBackground>
      {/* Content sits above PageBackground's z-10 orange overlay. */}
      <div className="relative z-20 min-h-screen pb-24">
        <MarketingTopNav />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <article className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              <strong>Effective date:</strong> {new Date().toLocaleDateString()}
            </p>

            <div className="space-y-5 leading-relaxed text-gray-700 dark:text-gray-300">
              <p>
                This Privacy Policy explains how <strong>Muay Thai Pai</strong> (the Wisarut
                Family Gym, based in Pai, Mae Hong Son, Thailand) collects and uses personal
                information when you visit <strong>muaythaipai.com</strong>, book training,
                enrol in a course or certification, or contact us. If you have any questions,
                email{" "}
                <a className={A} href="mailto:help@muaythaipai.com">
                  help@muaythaipai.com
                </a>
                .
              </p>

              <h2 className={H2}>Information we collect</h2>
              <p>We collect information in two ways:</p>
              <ul className={UL}>
                <li>
                  <strong>Information you give us</strong> &mdash; your name and email when
                  you create an account or sign in (we use a one-time &ldquo;magic
                  link&rdquo; rather than a password), the details of any class, course,
                  certification, or event you book, and the content of messages you send us
                  through the contact form, our chat assistant, or email.
                </li>
                <li>
                  <strong>Information collected automatically</strong> &mdash; basic
                  technical data such as your device and browser type, approximate location
                  from your IP address, and the pages you view, gathered through cookies and
                  the analytics tools described below.
                </li>
              </ul>
              <p>
                Payment card details are entered directly with our payment processor and are{" "}
                <strong>not</strong> stored on our servers (see Payments below).
              </p>

              <h2 className={H2}>How we use your information</h2>
              <ul className={UL}>
                <li>To create and manage your account and certification progress.</li>
                <li>To confirm and manage your bookings, courses, and event tickets.</li>
                <li>To respond to your enquiries, including through our AI assistant.</li>
                <li>To send service messages such as booking confirmations and receipts.</li>
                <li>To process payments and keep records required for accounting and tax.</li>
                <li>To operate, secure, and improve the website.</li>
                <li>To comply with our legal obligations.</li>
              </ul>

              <h2 className={H2}>Payments</h2>
              <p>
                Online payments are processed by <strong>Stripe</strong>. When you pay by
                card, your card details are handled by Stripe under its own security
                standards; we receive only a record of the transaction &mdash; such as the
                amount, date, and status &mdash; not your full card number. Prices are shown
                in Thai Baht (THB) or US Dollars (USD) depending on the service.
              </p>

              <h2 className={H2}>Our chat assistant</h2>
              <p>
                Our website includes an AI assistant (&ldquo;OckOck&rdquo;) that answers
                questions about the gym. Messages you send to it are processed by our AI
                provider, <strong>OpenAI</strong>, to generate a reply. Please do not share
                sensitive personal information in the chat that you would not want processed
                for this purpose.
              </p>

              <h2 className={H2}>Cookies and analytics</h2>
              <p>We use cookies and similar technologies for two purposes:</p>
              <ul className={UL}>
                <li>
                  <strong>Essential</strong> &mdash; to keep you signed in and remember
                  preferences such as light or dark theme. The site does not work properly
                  without these.
                </li>
                <li>
                  <strong>Analytics</strong> &mdash; we use <strong>Google Analytics</strong>{" "}
                  to understand how visitors use the site, which sets cookies. We also use{" "}
                  <strong>Vercel Analytics</strong> and <strong>Speed Insights</strong>, which
                  measure traffic and performance without identifying you.
                </li>
              </ul>
              <p>
                Some pages embed videos from YouTube in privacy-enhanced mode. You can block
                or delete cookies in your browser settings; doing so may affect how the site
                works.
              </p>

              <h2 className={H2}>Who we share information with</h2>
              <p>
                We do not sell your personal information. We share it only with the service
                providers that help us run the website and the gym:
              </p>
              <ul className={UL}>
                <li>
                  <strong>Supabase</strong> &mdash; database, sign-in, and storage of your
                  account data.
                </li>
                <li>
                  <strong>Stripe</strong> &mdash; payment processing.
                </li>
                <li>
                  <strong>Resend</strong> &mdash; sending emails such as confirmations and
                  receipts.
                </li>
                <li>
                  <strong>OpenAI</strong> &mdash; generating replies in our chat assistant.
                </li>
                <li>
                  <strong>Vercel</strong> &mdash; website hosting and analytics.
                </li>
                <li>
                  <strong>Google</strong> &mdash; website analytics.
                </li>
              </ul>
              <p>
                We may also disclose information where required by law or to protect our
                rights, safety, or property.
              </p>

              <h2 className={H2}>International transfers</h2>
              <p>
                Some of these providers process data on servers outside Thailand. Where that
                happens, we rely on the provider&apos;s safeguards and contractual
                protections to keep your information secure.
              </p>

              <h2 className={H2}>How long we keep it</h2>
              <p>
                We keep your information for as long as you have an account or as needed to
                provide our services, and afterwards only for as long as required for legal,
                accounting, or legitimate business reasons. You may ask us to delete your
                information at any time.
              </p>

              <h2 className={H2}>Your rights</h2>
              <p>
                Under Thailand&apos;s Personal Data Protection Act (PDPA) and other applicable
                laws, you may ask to access, correct, delete, or export your personal
                information, object to certain uses, or withdraw consent you have given. To
                make a request, email{" "}
                <a className={A} href="mailto:help@muaythaipai.com">
                  help@muaythaipai.com
                </a>
                .
              </p>

              <h2 className={H2}>Children</h2>
              <p>
                We offer classes for children, but accounts and bookings are made by a parent
                or guardian. We do not knowingly collect personal information directly from a
                child without the consent of their parent or guardian.
              </p>

              <h2 className={H2}>Security</h2>
              <p>
                We take reasonable technical and organisational measures to protect your
                information. No method of transmission or storage is completely secure,
                however, and we cannot guarantee absolute security.
              </p>

              <h2 className={H2}>Changes to this policy</h2>
              <p>
                We may update this policy from time to time. When we do, we will change the
                effective date at the top of this page.
              </p>

              <h2 className={H2}>Contact us</h2>
              <p>
                Muay Thai Pai (Wisarut Family Gym)
                <br />
                Pai, Mae Hong Son 58130, Thailand
                <br />
                <a className={A} href="mailto:help@muaythaipai.com">
                  help@muaythaipai.com
                </a>
              </p>

              <p className="mt-8 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                <strong>Operator note (remove before publishing):</strong> confirm the
                registered legal entity name (if different from &ldquo;Muay Thai Pai&rdquo;)
                and the best contact for privacy requests, then have this draft reviewed by a
                qualified lawyer for PDPA and any other regions you serve.
              </p>
            </div>
          </article>
        </div>
        <MarketingBottomNav />
      </div>
    </PageBackground>
  )
}
