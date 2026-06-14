"use client"

import { PageBackground, MarketingTopNav, MarketingBottomNav } from "@/components/marketing"

const H2 = "text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-3"
const A = "text-orange-600 dark:text-amber-400 hover:underline"

export function TermsConditionsClient() {
  return (
    <PageBackground>
      {/* Content sits above PageBackground's z-10 orange overlay. */}
      <div className="relative z-20 min-h-screen pb-24">
        <MarketingTopNav />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <article className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
              Terms and Conditions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              <strong>Effective date:</strong> {new Date().toLocaleDateString()}
            </p>

            <div className="space-y-5 leading-relaxed text-gray-700 dark:text-gray-300">
              <p>
                These Terms and Conditions govern your use of{" "}
                <strong>muaythaipai.com</strong> and the training, courses, certifications,
                and events offered by <strong>Muay Thai Pai</strong> (the Wisarut Family Gym,
                Pai, Mae Hong Son, Thailand). By using the website or booking with us, you
                agree to these terms.
              </p>

              <h2 className={H2}>The services we provide</h2>
              <p>
                We offer in-person Muay Thai training and classes, multi-day training
                packages, online courses, the Naga&ndash;Garuda certification programme, and
                tickets to fight events. Schedules, availability, and prices may change.
              </p>

              <h2 className={H2}>Your account</h2>
              <p>
                Some features require an account. You agree to give accurate information and
                to keep access to your email secure, since we sign you in with a one-time link
                sent to it. You are responsible for activity that takes place under your
                account.
              </p>

              <h2 className={H2}>Bookings and payment</h2>
              <p>
                Prices are shown in Thai Baht (THB) or US Dollars (USD) depending on the
                service. You can pay online by card through <strong>Stripe</strong> or, where
                offered, in cash at the gym. A booking is confirmed once payment has been
                received or confirmed. You are responsible for any fees your own card or bank
                may charge.
              </p>

              <h2 className={H2}>Cancellations and refunds</h2>
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200">
                <strong>To be completed:</strong> insert your cancellation and refund policy
                here &mdash; for example, how far in advance a class or package may be
                cancelled or rescheduled, whether refunds or credits are given, and any
                non-refundable items such as event tickets or courses already started.
              </p>
              <p>
                Until that policy is published, please contact{" "}
                <a className={A} href="mailto:help@muaythaipai.com">
                  help@muaythaipai.com
                </a>{" "}
                about any cancellation or refund.
              </p>

              <h2 className={H2}>Training, health, and assumption of risk</h2>
              <p>
                Muay Thai is a physical combat sport that carries an inherent risk of injury.
                By training with us, you confirm that you are in adequate health to take part
                and, if in any doubt, have consulted a doctor. You agree to follow our
                trainers&apos; instructions and the rules of the gym at all times. You take
                part at your own risk, and we may ask you to sign a separate liability waiver
                before training.
              </p>

              <h2 className={H2}>Certification</h2>
              <p>
                Our certifications are awarded under the five-level Naga&ndash;Garuda ladder
                and depend on assessment by our instructors. Certificates record the skills
                that have been signed off and can be verified publicly. We may decline or
                revoke a certification that was issued in error or obtained improperly.
              </p>

              <h2 className={H2}>Conduct</h2>
              <p>
                We want a safe and respectful environment for everyone. We may refuse,
                suspend, or end service for anyone who behaves unsafely, abusively, or in a way
                that puts others at risk.
              </p>

              <h2 className={H2}>Courses and content</h2>
              <p>
                Access to online courses is for your personal use only. The videos, written
                materials, logos, and other content on the website belong to us or our
                licensors and may not be copied, resold, or redistributed without our
                permission.
              </p>

              <h2 className={H2}>Third-party services</h2>
              <p>
                We rely on third parties such as Stripe and messaging platforms to provide
                parts of the service. Your use of those services is also subject to their own
                terms.
              </p>

              <h2 className={H2}>Limitation of liability</h2>
              <p>
                The website and its content are provided on an &ldquo;as is&rdquo; basis. To
                the fullest extent permitted by law, we are not liable for indirect or
                consequential loss arising from your use of the website. Nothing in these
                terms limits any liability that cannot be limited under applicable law,
                including for death or personal injury caused by negligence.
              </p>

              <h2 className={H2}>Changes to these terms</h2>
              <p>
                We may update these terms from time to time. When we do, we will change the
                effective date at the top of this page.
              </p>

              <h2 className={H2}>Governing law</h2>
              <p>
                These terms are governed by the laws of Thailand, and the courts of Thailand
                will have jurisdiction over any dispute, unless applicable law requires
                otherwise.
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
                <strong>Operator note (remove before publishing):</strong> set the
                cancellation and refund policy above, confirm the governing-law jurisdiction,
                then have this draft reviewed by a qualified lawyer before relying on it.
              </p>
            </div>
          </article>
        </div>
        <MarketingBottomNav />
      </div>
    </PageBackground>
  )
}
