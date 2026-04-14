"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Footprints, MapPin, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { SacredBackground } from "@/components/sacred-background"
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

const accommodationOptions = [
  {
    id: "cozy-cabin",
    name: "Cozy Cabin in the Paddies",
    distance: "400m",
    walkTime: "5 min walk",
    highlight: "Tranquil cabins amidst rice paddies with breakfast included.",
    description:
      "Escape to a cozy cabin nestled in the serene rice paddies of Pai. Enjoy a peaceful stay with beautiful views and a complimentary breakfast, offering a perfect blend of nature and comfort close to the gym.",
    imageUrl: "/images/cozy-cabin-pai.png",
    bookNowLink: "https://www.airbnb.com/rooms/41373305",
  },
  {
    id: "mountain",
    name: "Paiviengfah Resort",
    distance: "450m",
    walkTime: "6 min walk",
    highlight: "Stunning mountain views, great swimming pool, and peaceful ambiance.",
    description:
      "Immerse yourself in the tranquility of Paiviengfah Resort, offering spacious rooms with stunning mountain vistas and a refreshing swimming pool.",
    imageUrl: "/images/image.png",
    bookNowLink: "https://www.agoda.com/paiviengfah-resort/hotel/pai-th.html",
  },
  {
    id: "riverside",
    name: "The Countryside Resort Pai",
    distance: "600m",
    walkTime: "8 min walk",
    highlight: "Tranquil resort with stunning views and a refreshing pool.",
    description:
      "Discover serenity at The Countryside Resort Pai, featuring charming bungalows nestled amidst lush fields with breathtaking mountain views.",
    imageUrl: "/images/image.png",
    bookNowLink: "https://www.agoda.com/the-countryside-resort-pai/hotel/pai-th.html",
  },
  {
    id: "hostel",
    name: "Pai My Guest Resort",
    distance: "750m",
    walkTime: "10 min walk",
    highlight: "Comfortable villas, surrounded by nature, with pool and shuttle service.",
    description:
      "Pai My Guest Resort offers comfortable villas with private terraces, surrounded by lush nature and mountains.",
    imageUrl: "/images/image.png",
    bookNowLink: "https://www.booking.com/hotel/th/pai-my-guest-resort.html",
  },
  {
    id: "society-house",
    name: "Society House Luxury Hostel",
    distance: "850m",
    walkTime: "11 min walk",
    highlight: "Luxury hostel with a farm setting, comfortable bunks, and friendly animals.",
    description:
      "Experience a unique stay at Society House Luxury Hostel, combining comfortable bunk bed accommodations with a charming farm environment.",
    imageUrl: "/images/society-house-hostel.png",
    bookNowLink: "https://www.booking.com/hotel/th/village-farm-luxury-hostel.html",
  },
  {
    id: "mad-monkey-pai",
    name: "Mad Monkey Hostel Pai",
    distance: "900m",
    walkTime: "12 min walk",
    highlight: "Lively hostel with a pool, bar, and social atmosphere.",
    description: "Mad Monkey Pai offers a vibrant and social atmosphere, perfect for travelers looking to connect.",
    imageUrl: "/images/mad-monkey-pai.png",
    bookNowLink: "https://www.booking.com/hotel/th/mad-monkey-pai-mae-hi.html",
  },
]

export default function TrainAndStayClient() {
  const showContent = useSplash()
  const [mounted, setMounted] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  if (!mounted) {
    return null
  }

  return (
    <PageBackground>
      <h1 className="sr-only">Train and Stay in Pai</h1>

      <SacredBackground />

      <AnimatePresence mode="wait">
        {!showContent ? (
          <SplashScreen key="train-stay-splash" title="Train & Stay" subtitle="MUAY THAI PAI" />
        ) : (
          <motion.div
            key="train-stay-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={CONTENT_FADE_IN}
            className="relative z-20 min-h-screen flex flex-col"
          >
            <MarketingTopNav />

            {/* Main Content Area */}
            <div className="flex flex-col items-center justify-center flex-grow px-4 py-16 gap-6 max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-8 mt-16">
                <motion.h2
                  className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  Accommodation
                </motion.h2>
                <motion.p
                  className="text-lg md:text-xl font-semibold text-amber-800/90 dark:text-amber-200/90"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  {"Enjoy Your Slice of Pai'Radise"}
                </motion.p>
                <motion.p
                  className="text-sm mt-4 text-gray-600 dark:text-gray-400"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.6 }}
                >
                  Stay near our gym and{" "}
                  <Link href="/classes" className="text-primary underline-offset-4 hover:underline">
                    train daily
                  </Link>
                  . Questions? Check our{" "}
                  <Link href="/faq" className="text-primary underline-offset-4 hover:underline">
                    FAQ
                  </Link>{" "}
                  or{" "}
                  <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
                    contact us
                  </Link>
                  .
                </motion.p>
              </div>

              {/* Accommodation Options */}
              <motion.div
                className="w-full max-w-md space-y-6 mt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.8 }}
              >
                {accommodationOptions.map((option) => {
                  const isExpanded = expandedSection === option.id
                  return (
                    <motion.div
                      key={option.id}
                      className={
                        isExpanded
                          ? "relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg cursor-pointer transition-all duration-300 border-orange-700/50"
                          : "relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg cursor-pointer transition-all duration-300 bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                      }
                      onClick={() => toggleSection(option.id)}
                      whileHover={{ scale: isExpanded ? 1 : 1.02 }}
                    >
                      <div className="p-6 flex justify-between items-center">
                        <div>
                          <h3
                            className={
                              isExpanded
                                ? "text-xl font-bold mb-2 bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent dark:from-amber-700 dark:to-orange-700"
                                : "text-xl font-bold mb-2 text-amber-900 dark:text-amber-700"
                            }
                          >
                            {option.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            <span>{option.distance}</span>
                            <Footprints className="w-4 h-4 text-orange-500" />
                            <span>{option.walkTime}</span>
                          </div>
                        </div>
                        <div
                          className={
                            isExpanded
                              ? "rounded-full p-2 bg-orange-500/10 dark:bg-orange-500/20"
                              : "rounded-full p-2 bg-black/5 dark:bg-white/10"
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
                              <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                                {option.imageUrl && (
                                  <img
                                    src={option.imageUrl || "/placeholder.svg"}
                                    alt={option.name}
                                    className="w-full h-48 object-cover rounded-lg mb-4"
                                  />
                                )}
                                <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
                                  {option.description}
                                </p>
                                <motion.button
                                  className="w-full py-3 rounded-xl font-bold text-white mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-orange-600 dark:to-amber-600 dark:hover:from-orange-500 dark:hover:to-amber-500"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (option.bookNowLink) {
                                      window.open(option.bookNowLink, "_blank")
                                    }
                                  }}
                                >
                                  Book Now
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </motion.div>

              {/* Continue Learning Section */}
              <div className="w-full max-w-md mt-12 pb-24">
                <ContinueLearning currentPage="train-and-stay" />
              </div>
            </div>

            <MarketingBottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </PageBackground>
  )
}
