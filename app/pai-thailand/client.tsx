"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Utensils, Leaf, Landmark, Mountain } from "lucide-react"
import { MiniSlideshow } from "@/components/mini-slideshow"
import { ContinueLearning } from "@/components/blog/continue-learning"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SplashScreen,
  useSplash,
  CONTENT_FADE_IN,
  EXPAND_COLLAPSE,
} from "@/components/marketing"
import React from "react"

const paiSections = [
  {
    id: "food",
    title: "Food & Flavors",
    expandedHeading: "A Taste of Pai",
    description:
      "From bustling night markets to cozy cafes, Pai's culinary scene is a delight. Indulge in authentic Thai street food, fresh tropical fruits, and healthy local dishes.",
    media: { type: "icon", icon: Utensils, alt: "Food icon" },
  },
  {
    id: "wellness",
    title: "Relaxation & Wellness",
    expandedHeading: "Mind & Body Rejuvenation",
    description:
      "After intense training, unwind with a traditional Thai massage. Explore Pai's natural hot springs for a soothing soak, or find inner peace with meditation.",
    media: { type: "icon", icon: Leaf, alt: "Leaf icon" },
  },
  {
    id: "culture",
    title: "Culture & Spirituality",
    expandedHeading: "Immerse in Local Traditions",
    description:
      "Pai is rich in Lanna culture and Buddhist traditions. Visit ancient temples, witness local ceremonies, and explore vibrant art scenes.",
    media: { type: "icon", icon: Landmark, alt: "Landmark icon" },
  },
  {
    id: "nature",
    title: "Nature & Adventure",
    expandedHeading: "Explore Pai's Natural Wonders",
    description:
      "Rent a scooter and discover Pai's stunning natural wonders, from waterfalls and canyons to rice paddies and mountains.",
    media: { type: "icon", icon: Mountain, alt: "Mountain icon" },
  },
]

const paiSlideshowImages = [
  { src: "/images/pai-slideshow/rainbow-field.jpeg", alt: "Rainbow over Pai field" },
  { src: "/images/pai-slideshow/hut-mountains-sunset.jpeg", alt: "Mountain hut at sunset" },
  { src: "/images/pai-slideshow/dog-field-mountains.jpeg", alt: "Dog in field with mountains" },
  { src: "/images/pai-slideshow/pink-sky-field.jpeg", alt: "Pink sky over field" },
  { src: "/images/pai-slideshow/rainbow-mountains.jpeg", alt: "Rainbow over mountains" },
]

export default function PaiThailandClient() {
  const showContent = useSplash()
  const [mounted, setMounted] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  if (!mounted) {
    return null
  }

  return (
    <PageBackground>
      <h1 className="sr-only">About Pai, Thailand</h1>

      <AnimatePresence mode="wait">
        {!showContent ? (
          <SplashScreen key="pai-splash" title="About Pai" subtitle="MUAY THAI PAI" />
        ) : (
          <motion.div
            key="pai-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={CONTENT_FADE_IN}
            className="relative z-20 min-h-screen flex flex-col"
          >
            <MarketingTopNav />

            {/* Hero Section */}
            <div className="relative w-full h-screen flex items-center justify-center">
              <div
                className="absolute inset-0 bg-cover bg-center z-[1]"
                style={{ backgroundImage: `url('/images/pai-hero-main.jpeg')` }}
                role="img"
                aria-label="Pai landscape with person, dog, sunset, and mountains"
              />
              <div className="absolute inset-0 z-[2] bg-black/40 dark:bg-black/50" />
              <motion.div
                className="relative z-[3] text-center px-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
              >
                <h2 className="text-5xl md:text-7xl font-black mb-4 leading-tight text-orange-800 dark:bg-gradient-to-r dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500 dark:bg-clip-text dark:text-transparent">
                  Discover Pai
                </h2>
                <p className="text-xl md:text-2xl font-semibold text-orange-200/90 dark:text-amber-200/90">
                  Where Adventure Meets Serenity
                </p>
              </motion.div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col items-center flex-grow px-4 py-16 gap-6 max-w-7xl mx-auto">
              <section className="py-8 px-4 max-w-4xl mx-auto text-center">
                <motion.h3
                  className="text-3xl md:text-4xl font-bold mb-6 text-orange-800 dark:text-white"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  {"Rest, Recharge, and Immerse Yourself in Pai's Serenity"}
                </motion.h3>
                <motion.p
                  className="text-lg leading-relaxed text-gray-700 dark:text-gray-300"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  {
                    "Pai offers the perfect blend of comfort, culture, and connection to nature. Whether you're here for a short visit or an extended stay, you'll feel right at home."
                  }
                </motion.p>
                <motion.p
                  className="text-sm mt-4 text-gray-600 dark:text-gray-400"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  Ready to train? View our{" "}
                  <Link href="/classes" className="text-primary underline-offset-4 hover:underline">
                    Muay Thai classes
                  </Link>{" "}
                  or find{" "}
                  <Link href="/train-and-stay" className="text-primary underline-offset-4 hover:underline">
                    accommodation nearby
                  </Link>
                  .{" "}
                  <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
                    Contact us
                  </Link>{" "}
                  for more info.
                </motion.p>
              </section>

              {/* Thematic Sections as Accordions */}
              <motion.div
                className="w-full max-w-md space-y-6 mt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.8 }}
              >
                {paiSections.map((section) => {
                  const isExpanded = expandedSection === section.id
                  return (
                    <motion.div
                      key={section.id}
                      className={
                        isExpanded
                          ? "relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg cursor-pointer transition-all duration-300 border-orange-700/50 dark:border-orange-500/30"
                          : "relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg cursor-pointer transition-all duration-300 bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                      }
                      onClick={() => handleToggleSection(section.id)}
                      whileHover={{ scale: isExpanded ? 1 : 1.02 }}
                    >
                      <div className="p-6 flex justify-between items-center">
                        <div>
                          <h3
                            className={
                              isExpanded
                                ? "text-xl font-bold bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent dark:from-amber-700 dark:to-orange-700"
                                : "text-xl font-bold text-orange-800 dark:text-gray-300"
                            }
                          >
                            {section.title}
                          </h3>
                        </div>
                        <div
                          className={
                            isExpanded
                              ? "rounded-full p-2 bg-orange-500/10 dark:bg-orange-500/20"
                              : "rounded-full p-2 bg-gray-100 dark:bg-white/10"
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-6 h-6 text-amber-900 dark:text-amber-700" />
                          ) : (
                            <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={EXPAND_COLLAPSE}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-2">
                              <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-600/40 to-transparent dark:via-orange-500/30 mb-6" />
                              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                {section.media.type === "icon" && section.media.icon && (
                                  <div className="flex justify-center items-center w-full h-48 rounded-lg mb-4 overflow-hidden">
                                    {React.createElement(section.media.icon, {
                                      className: "w-24 h-24 text-orange-600/70 dark:text-amber-400/70",
                                      "aria-label": section.media.alt,
                                    })}
                                  </div>
                                )}
                                <h4 className="text-xl font-semibold text-orange-900 dark:text-amber-200">
                                  {section.expandedHeading}
                                </h4>
                                <p>{section.description}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </motion.div>

              {/* Slideshow */}
              <div className="w-full max-w-md mt-8">
                <MiniSlideshow images={paiSlideshowImages} interval={5000} />
              </div>

              {/* Continue Learning section */}
              <div className="w-full max-w-md mt-12 pb-24">
                <ContinueLearning currentPage="pai-thailand" />
              </div>
            </div>

            <MarketingBottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </PageBackground>
  )
}
