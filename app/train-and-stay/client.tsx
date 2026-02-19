"use client"
import { useState, useEffect } from "react"

import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Moon,
  Sun,
  Heart,
  MessageCircle,
  Footprints,
  MapPin,
  BoxIcon as Boxing,
  Dumbbell,
  Menu,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { MoreMenu } from "@/components/more-menu"
import { ContinueLearning } from "@/components/blog/continue-learning"

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
  const [showContent, setShowContent] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu)
  }

  if (!mounted) {
    return null
  }

  return (
    <div
      className={`min-h-screen overflow-hidden relative transition-all duration-500 ${
        theme === "dark"
          ? "bg-gradient-to-b from-black via-neutral-900 to-black"
          : "bg-gradient-to-b from-neutral-100 via-white to-neutral-50"
      }`}
    >
      <h1 className="sr-only">Train and Stay in Pai</h1>

      {/* Dynamic Gradient Overlay */}
      <div
        className={`absolute inset-0 z-10 ${
          theme === "dark"
            ? "bg-gradient-to-br from-orange-600/25 via-transparent to-amber-600/20"
            : "bg-gradient-to-br from-orange-500/20 via-transparent to-orange-400/15"
        }`}
      />

      {/* Subtle Sacred Background */}
      <div className="absolute inset-0 z-5 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L60 30 L90 30 L65 50 L75 80 L50 65 L25 80 L35 50 L10 30 L40 30 Z' fill='none' stroke='%23${
              theme === "dark" ? "ffffff" : "000000"
            }' strokeWidth='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
            backgroundPosition: "center",
            opacity: 0.05,
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div
            key="train-stay-splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-20 flex items-center justify-center min-h-screen"
          >
            <div className="text-center">
              <motion.h1
                className={`text-4xl md:text-5xl font-black mb-2 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent"
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Train & Stay
              </motion.h1>
              <motion.p
                className={`text-lg font-bold tracking-widest ${
                  theme === "dark" ? "text-amber-200/90" : "text-amber-800/90"
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                MUAY THAI PAI
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="train-stay-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20 min-h-screen flex flex-col"
          >
            {/* Top Navigation */}
            <div className="absolute top-0 left-0 right-0 z-50 flex justify-between p-4">
              <motion.div
                className="absolute top-4 left-4 z-50 flex gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/"
                  className={`backdrop-blur-md rounded-full p-3 border transition-colors ${
                    theme === "dark"
                      ? "bg-white/10 border-white/20 hover:bg-white/20"
                      : "bg-black/10 border-black/20 hover:bg-black/20"
                  }`}
                  aria-label="Back to home"
                >
                  <ArrowLeft className={`w-5 h-5 ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`} />
                </Link>
              </motion.div>

              <motion.div
                className="absolute top-4 right-4 z-50"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={toggleTheme}
                  className={`backdrop-blur-md rounded-full p-3 border transition-colors ${
                    theme === "dark"
                      ? "bg-white/10 border-white/20 hover:bg-white/20"
                      : "bg-black/10 border-black/20 hover:bg-black/20"
                  }`}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-orange-600" />
                  )}
                </button>
              </motion.div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col items-center justify-center flex-grow px-4 py-16 gap-6 max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-8 mt-16">
                <motion.h1
                  className={`text-4xl md:text-5xl font-black mb-2 ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent"
                  }`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  Accommodation
                </motion.h1>
                <motion.p
                  className={`text-lg md:text-xl font-semibold ${
                    theme === "dark" ? "text-amber-200/90" : "text-amber-800/90"
                  }`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  {"Enjoy Your Slice of Pai'Radise"}
                </motion.p>
                <motion.p
                  className={`text-sm mt-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
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
                {accommodationOptions.map((option) => (
                  <motion.div
                    key={option.id}
                    className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg cursor-pointer transition-all duration-300 ${
                      expandedSection === option.id
                        ? "border-orange-700/50"
                        : theme === "dark"
                          ? "bg-orange-950/30 border-orange-500/20"
                          : "bg-orange-100/60 border-orange-600/30"
                    }`}
                    onClick={() => toggleSection(option.id)}
                    whileHover={{ scale: expandedSection === option.id ? 1 : 1.02 }}
                  >
                    <div className="p-6 flex justify-between items-center">
                      <div>
                        <h3
                          className={`text-xl font-bold mb-2 ${
                            expandedSection === option.id
                              ? theme === "dark"
                                ? "bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent"
                                : "bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent"
                              : theme === "dark"
                                ? "text-amber-700"
                                : "text-amber-900"
                          }`}
                        >
                          {option.name}
                        </h3>
                        <div
                          className={`flex items-center gap-3 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                        >
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <span>{option.distance}</span>
                          <Footprints className="w-4 h-4 text-orange-500" />
                          <span>{option.walkTime}</span>
                        </div>
                      </div>
                      <div
                        className={`rounded-full p-2 ${
                          expandedSection === option.id
                            ? theme === "dark"
                              ? "bg-orange-500/20"
                              : "bg-orange-500/10"
                            : theme === "dark"
                              ? "bg-white/10"
                              : "bg-black/5"
                        }`}
                      >
                        {expandedSection === option.id ? (
                          <ChevronUp className={`w-6 h-6 ${theme === "dark" ? "text-amber-700" : "text-amber-900"}`} />
                        ) : (
                          <ChevronDown className={`w-6 h-6 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`} />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedSection === option.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-2">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                            <div
                              className={`space-y-4 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                            >
                              {option.imageUrl && (
                                <img
                                  src={option.imageUrl || "/placeholder.svg"}
                                  alt={option.name}
                                  className="w-full h-48 object-cover rounded-lg mb-4"
                                />
                              )}
                              <p className={`mt-3 text-base ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                {option.description}
                              </p>
                              <motion.button
                                className={`w-full py-3 rounded-xl font-bold text-white mt-6 ${
                                  theme === "dark"
                                    ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500"
                                    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                                }`}
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
                ))}
              </motion.div>

              {/* Continue Learning Section */}
              <div className="w-full max-w-md mt-12 pb-24">
                <ContinueLearning currentPage="train-and-stay" />
              </div>
            </div>

            {/* Bottom Navigation */}
            <motion.div
              className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t ${
                theme === "dark" ? "bg-black/80 border-white/10" : "bg-white/90 border-gray-200"
              }`}
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
            >
              <div className="flex justify-around py-3 px-4">
                {[
                  { icon: Heart, label: "Family", href: "/" },
                  { icon: Boxing, label: "Classes", href: "/classes" },
                  { icon: Dumbbell, label: "Gym", href: "/gym" },
                  { icon: MessageCircle, label: "Contact", href: "/contact" },
                  { icon: Menu, label: "More", isButton: true },
                ].map((item) =>
                  item.isButton ? (
                    <motion.button
                      key={item.label}
                      onClick={toggleMoreMenu}
                      className={theme === "dark" ? "text-gray-400" : "text-gray-500"}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <item.icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                    </motion.button>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex flex-col items-center gap-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  ),
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MoreMenu isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} />
    </div>
  )
}
