"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Trophy, Loader2 } from "lucide-react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

interface Fighter {
  id: string | number
  name: string
  nickname: string
  record: string
  status: "active" | "retired"
  bio: string
  image?: string
  specialties?: string[]
  yearsExperience?: number
}

const ringsideImages = [
  "/placeholder.svg?height=600&width=800",
  "/placeholder.svg?height=600&width=800",
  "/placeholder.svg?height=600&width=800",
]

export default function FightersPageClient() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFighters() {
      try {
        const response = await fetch("/api/public/trainers?gym=wisarut-family-gym")
        const data = await response.json()
        setFighters(data.trainers || [])
      } catch (error) {
        console.error("Error fetching fighters:", error)
        setFighters([])
      } finally {
        setLoading(false)
      }
    }
    fetchFighters()
  }, [])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % ringsideImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + ringsideImages.length) % ringsideImages.length)
  }

  const sortedFighters = [...fighters].sort((a, b) => {
    if (a.status === "active" && b.status === "retired") return -1
    if (a.status === "retired" && b.status === "active") return 1
    return 0
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2d1810] via-[#1a0f08] to-black">
      {/* Header */}
      <div className="pt-20 pb-12 px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-center bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">
          The Heart of Muay Thai Pai: Our Fighters
        </h1>
      </div>

      {/* Fighters List using Accordion component */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="ml-3 text-neutral-400">Loading fighters...</span>
          </div>
        ) : fighters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 text-lg">No fighters found</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {sortedFighters.map((fighter) => (
              <AccordionItem
                key={fighter.id}
                value={`fighter-${fighter.id}`}
                className={`rounded-2xl border-0 overflow-hidden transition-all duration-300 ${
                  fighter.status === "active"
                    ? "bg-gradient-to-r from-emerald-900/20 via-teal-900/20 to-emerald-900/20 ring-2 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    : "bg-[#3d2416]/50"
                }`}
              >
                <AccordionTrigger className="px-6 py-6 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center gap-6 w-full">
                    {/* Profile Photo */}
                    <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-neutral-700">
                      {fighter.image ? (
                        <img
                          src={fighter.image || "/placeholder.svg"}
                          alt={`${fighter.name} ${fighter.nickname} profile photo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-3xl">
                          {fighter.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Fighter Info */}
                    <div className="text-left flex-1">
                      <h2
                        className={`text-2xl md:text-3xl font-bold ${
                          fighter.status === "active" ? "text-emerald-400" : "text-amber-500"
                        }`}
                      >
                        {fighter.name}
                        {fighter.nickname && ` '${fighter.nickname}'`}
                      </h2>
                      <p
                        className={`text-lg md:text-xl mt-1 ${
                          fighter.status === "active" ? "text-emerald-300" : "text-neutral-400"
                        }`}
                      >
                        {fighter.status === "active" ? "Active Fighter" : "Retired"} ({fighter.record})
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-6">
                  <p className="text-neutral-300 text-lg leading-relaxed">{fighter.bio}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Ringside Experience Section */}
      <div className="py-20 px-4 bg-gradient-to-b from-black to-[#1a0f08]">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Trophy className="w-12 h-12 text-amber-500" />
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">
                Experience the Thrill: Your Ringside Muay Thai Journey
              </h2>
            </div>
            <p className="text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
              Don't want to train but crave the authentic Muay Thai experience? Get in touch to arrange your exclusive
              behind-the-scenes ringside access and witness the adrenaline firsthand.
            </p>
          </div>

          {/* Image Carousel */}
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <div className="relative aspect-video">
              <img
                src={ringsideImages[currentImageIndex] || "/placeholder.svg"}
                alt="Ringside Muay Thai experience"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Carousel Navigation */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {ringsideImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentImageIndex === index ? "bg-amber-500 w-8" : "bg-white/50"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <a
              href="/contact"
              className="inline-block bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-700 hover:via-orange-700 hover:to-amber-700 text-white text-xl font-bold px-12 py-5 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(217,119,6,0.4)] hover:shadow-[0_0_40px_rgba(217,119,6,0.6)] hover:scale-105"
            >
              Arrange Your VIP Experience
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
