"use client"

import Link from "next/link"
import { Award, Calendar, MessageCircle, ArrowRight } from "lucide-react"
import { useTheme } from "next-themes"
import { ockockUrl } from "@/lib/ockock/url"

export function PlatformCtaSection() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <section
      className={`py-16 px-4 ${
        isDark
          ? "bg-gradient-to-b from-transparent via-neutral-900/50 to-transparent"
          : "bg-gradient-to-b from-transparent via-gray-50 to-transparent"
      }`}
    >
      <div className="mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6 ${
            isDark
              ? "bg-orange-500/10 text-orange-300 border border-orange-500/20"
              : "bg-orange-50 text-orange-700 border border-orange-200"
          }`}
        >
          <span className="text-base leading-none">🐃</span>
          For Muay Thai gym owners
        </div>

        <h2
          className={`text-2xl font-bold mb-3 sm:text-3xl ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Run your gym with OckOck
        </h2>
        <p
          className={`mb-8 max-w-xl mx-auto ${
            isDark ? "text-neutral-400" : "text-gray-600"
          }`}
        >
          The friendliest way to manage a Muay Thai gym — bookings, the
          Naga–Garuda cert ladder, and OckOck answering your customers in your
          gym&apos;s voice.
        </p>

        {/* Features */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8 text-left">
          {[
            {
              icon: Calendar,
              title: "Bookings & students",
              desc: "Class scheduling, payments, student notes, and trainer signoffs in one dashboard.",
            },
            {
              icon: Award,
              title: "Cert ladder",
              desc: "Issue Naga–Garuda certifications. Students' progress is portable across the network.",
            },
            {
              icon: MessageCircle,
              title: "OckOck answers",
              desc: "Your gym's friendly receptionist. Knows your services, hours, prices, and trainers — replies in your voice.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`rounded-xl p-4 ${
                isDark
                  ? "bg-white/[0.03] border border-white/5"
                  : "bg-white border border-gray-100 shadow-sm"
              }`}
            >
              <feature.icon
                className={`h-5 w-5 mb-2 ${
                  isDark ? "text-orange-400" : "text-orange-500"
                }`}
              />
              <h3
                className={`font-semibold text-sm mb-1 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {feature.title}
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? "text-neutral-500" : "text-gray-500"
                }`}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors ${
              isDark
                ? "bg-orange-500 text-white hover:bg-orange-400"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            Start free 30-day trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={ockockUrl("/for-gyms")}
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors ${
              isDark
                ? "border border-white/20 text-white hover:bg-white/5"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Learn more
          </Link>
        </div>

        <p
          className={`mt-4 text-xs ${
            isDark ? "text-neutral-600" : "text-gray-400"
          }`}
        >
          No credit card required. Cancel anytime.
        </p>
      </div>
    </section>
  )
}
