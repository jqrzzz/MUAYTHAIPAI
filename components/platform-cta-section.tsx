"use client"

import Link from "next/link"
import { Award, Calendar, Sparkles, ArrowRight } from "lucide-react"
import { useTheme } from "next-themes"

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
          <Sparkles className="h-3 w-3" />
          For Muay Thai gym owners
        </div>

        <h2
          className={`text-2xl font-bold mb-3 sm:text-3xl ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          AI-native gym management,
          <br className="hidden sm:block" /> built for Muay Thai
        </h2>
        <p
          className={`mb-8 max-w-xl mx-auto ${
            isDark ? "text-neutral-400" : "text-gray-600"
          }`}
        >
          Bookings, students, the Naga–Garuda cert ladder, and an AI receptionist
          that knows your gym — all in one place. Join the MUAYTHAIPAI network
          of gyms across Thailand.
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
              icon: Sparkles,
              title: "AI receptionist",
              desc: "OckOck answers customer questions in your gym's voice — pricing, schedule, what to bring.",
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
            List your gym — free 30-day trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/gyms"
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors ${
              isDark
                ? "border border-white/20 text-white hover:bg-white/5"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Browse the network
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
