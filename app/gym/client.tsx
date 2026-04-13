"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Moon, Sun, Heart, MessageCircle, Dumbbell, Menu, BoxIcon as Boxing } from "lucide-react"
import { useTheme } from "next-themes"
import { MoreMenu } from "@/components/more-menu"
import { SacredBackground, DynamicGradient } from "@/components/sacred-background"
import { ContinueLearning } from "@/components/blog/continue-learning"

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
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [visibleAmenities, setVisibleAmenities] = useState<number[]>([])
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setShowContent(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!showContent || isPaused) return
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % gymImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [showContent, isPaused])

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % gymImages.length)

  const prevImage = () => setCurrentImage((prev) => (prev - 1 + gymImages.length) % gymImages.length)

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  if (!mounted) return null

  return (
    <div className="min-h-screen overflow-hidden relative transition-all duration-500 bg-gradient-to-b from-neutral-100 via-white to-neutral-50 dark:from-black dark:via-neutral-900 dark:to-black">
      <DynamicGradient />
      <SacredBackground />

      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center min-h-screen z-20 relative"
          >
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-black text-amber-500">Gym</h1>
              <p className="text-lg text-amber-400 tracking-widest">MUAY THAI PAI</p>
              <p className="text-sm text-amber-300 tracking-wider">WISARUT FAMILY</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative z-20 min-h-screen"
          >
            {/* TOP NAV */}
            <div className="absolute top-0 left-0 right-0 z-50 flex justify-between p-4">
              <div className="flex gap-2">
                <Link href="/" className="backdrop-blur-md rounded-full p-3 border border-white/20">
                  <ArrowLeft className="w-5 h-5 text-amber-400" />
                </Link>
              </div>

              <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 backdrop-blur-md rounded-full p-3 border border-white/20"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-orange-600" />
                )}
              </button>
            </div>

            {/* TITLE */}
            <div className="text-center mt-20">
              <h1 className="text-5xl font-black bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                Our Gym
              </h1>
              <p className="text-lg text-amber-300/90 mt-2">No experience? No problem.</p>
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

            {/* Continue Learning section */}
            <div className="pb-24">
              <ContinueLearning currentPage="gym" />
            </div>

            {/* BOTTOM NAV */}
            <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-black/80 border-t border-white/10">
              <div className="flex justify-around py-3 px-4">
                {[
                  { icon: Heart, label: "Family", href: "/" },
                  { icon: Boxing, label: "Classes", href: "/classes" },
                  { icon: Dumbbell, label: "Gym", href: "/gym" },
                  { icon: MessageCircle, label: "Contact", href: "/contact" },
                  { icon: Menu, label: "More", isButton: true },
                ].map((item) =>
                  item.isButton ? (
                    <button
                      key={item.label}
                      onClick={() => setShowMoreMenu(true)}
                      className="flex flex-col items-center"
                    >
                      <item.icon className="w-5 h-5 text-gray-300" />
                      <span className="text-xs text-gray-400">{item.label}</span>
                    </button>
                  ) : (
                    <Link key={item.label} href={item.href!} className="flex flex-col items-center">
                      <item.icon className="w-5 h-5 text-gray-300" />
                      <span className="text-xs text-gray-400">{item.label}</span>
                    </Link>
                  ),
                )}
              </div>
            </div>

            <MoreMenu isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
