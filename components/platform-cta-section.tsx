"use client"

import Link from "next/link"
import { Award, Globe, Building2, ArrowRight } from "lucide-react"
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
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          <Globe className="h-3 w-3" />
          Part of the Muay Thai Network
        </div>

        <h2
          className={`text-2xl font-bold mb-3 sm:text-3xl ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Train at Any Gym in Thailand
        </h2>
        <p
          className={`mb-8 max-w-lg mx-auto ${
            isDark ? "text-neutral-400" : "text-gray-600"
          }`}
        >
          Wisarut Family Gym is part of the MUAYTHAIPAI Network.
          One account gives you access to gyms across Thailand with a
          shared certification system.
        </p>

        {/* Features */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8 text-left">
          {[
            {
              icon: Globe,
              title: "Train Anywhere",
              desc: "Browse and book at verified gyms across Thailand",
            },
            {
              icon: Award,
              title: "Portable Ranks",
              desc: "Your Naga to Garuda certification follows you between gyms",
            },
            {
              icon: Building2,
              title: "For Gym Owners",
              desc: "Get your gym online with bookings, payments, and more",
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
                className={`text-xs ${
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
            href="/gyms"
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors ${
              isDark
                ? "bg-white text-black hover:bg-neutral-200"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            Browse Gyms
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/signup"
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors ${
              isDark
                ? "border border-white/20 text-white hover:bg-white/5"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            List Your Gym — Free
          </Link>
        </div>
      </div>
    </section>
  )
}
