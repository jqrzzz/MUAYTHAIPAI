"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Trophy, Loader2 } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  useMounted,
  CONTENT_FADE_IN,
} from "@/components/marketing"

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
  const mounted = useMounted()
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

  if (!mounted) return null

  return (
    <PageBackground>
      {/* Content sits above PageBackground's z-10 orange overlay. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={CONTENT_FADE_IN}
        className="relative z-20 min-h-screen pb-24"
      >
        <MarketingTopNav />

        {/* Header */}
        <div className="pt-24 pb-10 px-4">
          <h1 className="text-4xl md:text-6xl font-black text-center bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500">
            The Heart of Muay Thai Pai: Our Fighters
          </h1>
        </div>

        {/* Fighters list */}
        <div className="max-w-5xl mx-auto px-4 pb-16">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600 dark:text-amber-400" />
              <span className="ml-3 text-gray-600 dark:text-gray-300">Loading fighters...</span>
            </div>
          ) : fighters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300 text-lg">No fighters found</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {sortedFighters.map((fighter) => (
                <AccordionItem
                  key={fighter.id}
                  value={`fighter-${fighter.id}`}
                  className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${
                    fighter.status === "active"
                      ? "bg-orange-100/70 border-amber-500/50 ring-2 ring-amber-500/40 shadow-[0_0_24px_rgba(245,158,11,0.2)] dark:bg-orange-950/40 dark:border-amber-400/40 dark:ring-amber-400/30"
                      : "bg-orange-100/50 border-orange-600/20 dark:bg-orange-950/25 dark:border-orange-500/15"
                  }`}
                >
                  <AccordionTrigger className="px-6 py-6 hover:no-underline transition-colors data-[state=open]:bg-orange-500/10 dark:data-[state=open]:bg-orange-500/20 [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center gap-6 w-full">
                      {/* Profile photo */}
                      <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-orange-200 ring-2 ring-amber-500/30 dark:bg-orange-950/60 dark:ring-amber-400/20">
                        {fighter.image ? (
                          <Image
                            src={fighter.image || "/placeholder.svg"}
                            alt={`${fighter.name} ${fighter.nickname} profile photo`}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-amber-700 dark:text-amber-300 text-3xl font-bold">
                            {fighter.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Fighter info */}
                      <div className="text-left flex-1">
                        <h2
                          className={`text-2xl md:text-3xl font-bold ${
                            fighter.status === "active"
                              ? "text-amber-900 dark:text-amber-300"
                              : "text-amber-800/80 dark:text-amber-200/70"
                          }`}
                        >
                          {fighter.name}
                          {fighter.nickname && ` '${fighter.nickname}'`}
                        </h2>
                        <p
                          className={`text-lg md:text-xl mt-1 ${
                            fighter.status === "active"
                              ? "text-orange-700 dark:text-orange-300"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {fighter.status === "active" ? "Active Fighter" : "Retired"} ({fighter.record})
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 pb-6">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-5" />
                    <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">{fighter.bio}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Ringside Experience Section */}
        <div className="py-20 px-4 border-t border-orange-500/15">
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Trophy className="w-12 h-12 text-orange-600 dark:text-amber-400" />
                <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500">
                  Experience the Thrill: Your Ringside Muay Thai Journey
                </h2>
              </div>
              <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Don&apos;t want to train but crave the authentic Muay Thai experience? Get in touch to arrange your
                exclusive behind-the-scenes ringside access and witness the adrenaline firsthand.
              </p>
            </div>

            {/* Image carousel */}
            <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
              <div className="relative aspect-video">
                <Image
                  src={ringsideImages[currentImageIndex] || "/placeholder.svg"}
                  alt="Ringside Muay Thai experience"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                  priority={currentImageIndex === 0}
                />
              </div>

              {/* Carousel navigation */}
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

              {/* Carousel indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {ringsideImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      currentImageIndex === index
                        ? "bg-orange-600 dark:bg-amber-400 w-8"
                        : "bg-gray-400/60 dark:bg-white/40 w-2"
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

        <MarketingBottomNav />
      </motion.div>
    </PageBackground>
  )
}
