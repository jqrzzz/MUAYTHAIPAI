"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import {
  MapPin,
  Dumbbell,
  ChevronRight,
  Search,
  BadgeCheck,
  Award,
  Building2,
  ArrowRight,
} from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface Gym {
  id: string
  name: string
  slug: string
  description: string | null
  city: string | null
  province: string | null
  logo_url: string | null
  cover_image_url: string | null
  verified: boolean
}

interface GymsListClientProps {
  gyms: Gym[]
  user: User | null
}

export default function GymsListClient({ gyms, user }: GymsListClientProps) {
  const [search, setSearch] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("all")

  // Get unique provinces
  const provinces = Array.from(
    new Set(gyms.map((g) => g.province).filter(Boolean))
  ).sort() as string[]

  // Filter
  const filtered = gyms.filter((gym) => {
    if (selectedProvince !== "all" && gym.province !== selectedProvince) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        gym.name.toLowerCase().includes(q) ||
        gym.city?.toLowerCase().includes(q) ||
        gym.province?.toLowerCase().includes(q) ||
        gym.description?.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Platform Header */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-semibold">
            <Dumbbell className="w-5 h-5 text-orange-500" />
            <span className="text-sm">MUAYTHAIPAI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              List Your Gym
            </Link>
            <Link
              href={user ? "/admin" : "/admin/login"}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/15 transition-colors"
            >
              {user ? "Dashboard" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        {/* Hero */}
        <div className="py-12 text-center">
          <h1 className="text-3xl font-bold text-white mb-3 sm:text-4xl">
            Find Your Gym in Thailand
          </h1>
          <p className="text-neutral-400 max-w-lg mx-auto mb-8">
            Browse verified Muay Thai gyms across Thailand. One account, train anywhere.
            Every gym offers the Naga to Garuda certification pathway.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by gym name, city, or province..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Province Filter */}
          {provinces.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setSelectedProvince("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedProvince === "all"
                    ? "bg-orange-500 text-black"
                    : "bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                All Provinces
              </button>
              {provinces.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedProvince(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedProvince === p
                      ? "bg-orange-500 text-black"
                      : "bg-white/5 text-neutral-400 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-xs text-neutral-500 mb-4">
          {filtered.length} gym{filtered.length !== 1 ? "s" : ""} on the network
        </p>

        {/* Gym Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 pb-8">
            {filtered.map((gym) => (
              <Link key={gym.id} href={`/gyms/${gym.slug}`}>
                <Card className="h-full bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/50 hover:border-neutral-700 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        {gym.logo_url ? (
                          <Image
                            src={gym.logo_url}
                            alt={gym.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          <Dumbbell className="w-6 h-6 text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white truncate">{gym.name}</h3>
                          {gym.verified && (
                            <BadgeCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                        {gym.city && (
                          <p className="flex items-center gap-1 text-sm text-neutral-500 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {gym.city}{gym.province ? `, ${gym.province}` : ""}
                          </p>
                        )}
                        {gym.description && (
                          <p className="text-xs text-neutral-600 mt-1.5 line-clamp-2">{gym.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-700 flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-neutral-900/30 border-neutral-800/50 mb-8">
            <CardContent className="p-8 text-center">
              <Dumbbell className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-400 mb-2">
                {search || selectedProvince !== "all"
                  ? "No gyms match your search"
                  : "No gyms on the network yet"}
              </p>
              {(search || selectedProvince !== "all") && (
                <button
                  onClick={() => { setSearch(""); setSelectedProvince("all") }}
                  className="text-sm text-orange-400 hover:text-orange-300"
                >
                  Clear filters
                </button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Certification Banner */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 mb-8 sm:p-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 flex-shrink-0">
              <Award className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                Naga to Garuda Certification
              </h3>
              <p className="text-sm text-neutral-400 mb-3">
                Every gym on the network offers Thailand&apos;s standardized Muay Thai progression
                system — from Naga (beginner) to Garuda (master). Your rank follows you
                across gyms.
              </p>
              <Link
                href="/certificate-programs"
                className="inline-flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300"
              >
                Learn about the certification path
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Gym Owner CTA */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 mb-12 text-center sm:p-8">
          <Building2 className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Own a Muay Thai Gym?
          </h3>
          <p className="text-sm text-neutral-400 mb-4 max-w-md mx-auto">
            Get your gym online in minutes. Manage bookings, trainers, students,
            and certifications. Join the only Muay Thai gym network with a
            standardized ranking system.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-400 transition-colors"
          >
            Start Your Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-neutral-500 mt-3">
            30 days free. No credit card required.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-neutral-500">
            <Dumbbell className="h-4 w-4" />
            <span className="text-sm">MUAYTHAIPAI Network</span>
          </div>
          <div className="flex gap-6 text-sm text-neutral-500">
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms-conditions" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
