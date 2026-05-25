"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { SacredBackground } from "@/components/sacred-background"
import { ContinueLearning } from "@/components/blog/continue-learning"
import { familyMembers } from "@/lib/family-data"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SplashScreen,
  useSplash,
  useMounted,
} from "@/components/marketing"

const gymImages = [
  { id: 1, url: "/images/gym-certificate.png", alt: "Muay Thai certification" },
  { id: 2, url: "/images/group-training-pads.jpeg", alt: "Pad work training" },
  { id: 3, url: "/images/group-pose-1.jpeg", alt: "Training group photo" },
  { id: 4, url: "/images/group-pose-2.jpeg", alt: "Group training" },
]

const amenities = [
  { name: "Traditional Muay Thai Gym", icon: "🥊", delay: 0 },
  { name: "Weight Equipment", icon: "🏋️", delay: 0.5 },
  { name: "Outdoor Spaces", icon: "🌿", delay: 1 },
  { name: "Meditation Areas", icon: "🧘", delay: 1.5 },
  { name: "Professional Instruction", icon: "👨‍🏫", delay: 2 },
  { name: "Family Atmosphere", icon: "❤️", delay: 2.5 },
  { name: "Gear Provided", icon: "🥋", delay: 3 },
  { name: "Certified Muay Thai Gym", icon: "🏛️", delay: 3.5 },
]

export default function GymPageClient() {
  const mounted = useMounted()
  const { showContent, dismiss } = useSplash()
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    if (!showContent) return
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % gymImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [showContent])

  if (!mounted) return null

  return (
    <PageBackground>
      <SacredBackground />

      <AnimatePresence mode="wait">
        {!showContent ? (
          <SplashScreen key="gym-splash" onSkip={dismiss} />
        ) : (
          <motion.div
            key="gym-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative z-20 min-h-screen"
          >
            <MarketingTopNav />

            {/* TITLE */}
            <div className="text-center mt-20">
              <h1 className="text-5xl font-black bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                Our Gym
              </h1>
              <p className="text-lg text-amber-300/90 mt-2">No experience? No problem.</p>
            </div>

            {/* CREDIBILITY */}
            <div className="max-w-3xl mx-auto px-4 mt-6">
              <p className="text-center text-gray-300 leading-relaxed">
                A <span className="text-amber-300 font-semibold">third-generation family gym</span> in Pai, Thailand,
                teaching traditional Muay Thai <span className="text-amber-300 font-semibold">since 1975</span> and
                featured in <span className="text-amber-300 font-semibold">National Geographic</span>. Led by Kru
                Wisarut and the whole family.
              </p>
            </div>

            {/* IMAGE CAROUSEL */}
            <div className="relative w-full max-w-4xl mx-auto h-64 md:h-96 mt-10 rounded-xl overflow-hidden shadow-lg">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={currentImage}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -80 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={gymImages[currentImage].url || "/placeholder.svg"}
                    alt={gymImages[currentImage].alt}
                    fill
                    className="object-cover rounded-xl"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* AMENITIES */}
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
              <h2 className="text-3xl font-bold text-amber-300 mb-6">Always welcome, our gym is your gym.</h2>
              <p className="text-gray-300 mb-8">
                Experience world-class training in an authentic, family-friendly environment.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {amenities.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: a.delay }}
                    className="flex flex-col items-center p-4 rounded-xl border border-amber-500/20 bg-amber-950/20"
                  >
                    <span className="text-4xl mb-2">{a.icon}</span>
                    <h3 className="text-md font-semibold text-amber-200">{a.name}</h3>
                  </motion.div>
                ))}
              </div>

              {/* MEET THE FAMILY */}
              <div className="mt-14 pt-8 border-t border-amber-500/20">
                <h2 className="text-3xl font-bold text-amber-300 mb-2">Meet the family</h2>
                <p className="text-gray-300 mb-8">The people who&apos;ll train you — three generations under one roof.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex flex-col items-center">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-amber-500/30 bg-amber-950/40 flex items-center justify-center mb-2">
                        {member.image ? (
                          <Image src={member.image} alt={member.name} fill className="object-cover" sizes="80px" />
                        ) : (
                          <span className="text-2xl">🥊</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-amber-200">{member.name}</h3>
                      <p className="text-xs text-gray-400 text-center leading-tight">{member.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-amber-500/20">
                <p className="text-gray-400 mb-4">Ready to start your journey?</p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <Link href="/classes" className="text-primary underline-offset-4 hover:underline">
                    View our classes
                  </Link>
                  <span className="text-gray-600">•</span>
                  <Link href="/train-and-stay" className="text-primary underline-offset-4 hover:underline">
                    Find accommodation
                  </Link>
                  <span className="text-gray-600">•</span>
                  <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
                    Contact us
                  </Link>
                </div>
              </div>
            </div>

            <div className="pb-24">
              <ContinueLearning currentPage="gym" />
            </div>

            <MarketingBottomNav active="gym" />
          </motion.div>
        )}
      </AnimatePresence>
    </PageBackground>
  )
}
