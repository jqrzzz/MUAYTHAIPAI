"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, MapPin, Dumbbell, ChevronRight } from "lucide-react"
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
}

interface GymsListClientProps {
  gyms: Gym[]
  user: User | null
}

export default function GymsListClient({ gyms, user }: GymsListClientProps) {
  // Group gyms by province
  const gymsByProvince = gyms.reduce(
    (acc, gym) => {
      const province = gym.province || "Other"
      if (!acc[province]) acc[province] = []
      acc[province].push(gym)
      return acc
    },
    {} as Record<string, Gym[]>,
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={user ? "/student" : "/"}
            className="inline-flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {user ? "Dashboard" : "Home"}
          </Link>
          {!user && (
            <Link href="/student/login">
              <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 bg-transparent">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Thailand Muay Thai Network</h1>
          <p className="text-neutral-400">One account. Train at any gym across Thailand.</p>
        </div>

        {/* Gyms List */}
        {Object.entries(gymsByProvince).map(([province, provinceGyms]) => (
          <section key={province} className="mb-8">
            <h2 className="text-sm font-medium text-neutral-500 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {province}
            </h2>
            <div className="space-y-3">
              {provinceGyms.map((gym) => (
                <Link key={gym.id} href={`/gyms/${gym.slug}`}>
                  <Card className="bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          {gym.logo_url ? (
                            <img
                              src={gym.logo_url || "/placeholder.svg"}
                              alt={gym.name}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <Dumbbell className="w-6 h-6 text-neutral-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{gym.name}</h3>
                          <p className="text-sm text-neutral-500">{gym.city}</p>
                          {gym.description && (
                            <p className="text-xs text-neutral-600 mt-1 line-clamp-1">{gym.description}</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {gyms.length === 0 && (
          <Card className="bg-neutral-900/30 border-neutral-800/50">
            <CardContent className="p-8 text-center">
              <Dumbbell className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-400 mb-2">No gyms available yet</p>
              <p className="text-neutral-600 text-sm">Check back soon for new gyms joining the network</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
