"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Moon,
  Sun,
  Heart,
  MessageCircle,
  BoxIcon as Boxing,
  Dumbbell,
  Menu,
  ChevronDown,
  ChevronUp,
  Utensils,
  Leaf,
  Landmark,
  Mountain,
} from "lucide-react"
import { useTheme } from "next-themes"
import { MoreMenu } from "@/components/more-menu"
import { MiniSlideshow } from "@/components/mini-slideshow"
import { ContinueLearning } from "@/components/blog/continue-learning"
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
  const [showContent, setShowContent] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

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

  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu)
  }

  const handleToggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
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
      <div
        className={`absolute inset-0 z-10 ${
          theme === "dark"
            ? "bg-gradient-to-br from-orange-600/25 via-transparent to-amber-600/20"
            : "bg-gradient-to-br from-orange-500/20 via-transparent to-orange-400/15"
        }`}
      />

      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div
            key="pai-splash"
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
                    : "text-orange-800"
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                About Pai
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
            key="pai-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20 min-h-screen flex flex-col"
          >
            {/* Top Navigation */}
            <div className="absolute top-0 left-0 right-0 z-50 flex justify-between p-4">
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/"
                  className={`backdrop-blur-md rounded-full p-3 border transition-colors ${
                    theme === "dark"
                      ? "bg-white/10 border-white/20 hover:bg-white/20"
                      : "bg-black/15 border-black/25 hover:bg-black/25"
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
                      : "bg-black/15 border-black/25 hover:bg-black/25"
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

            {/* Hero Section */}
            <div className="relative w-full h-screen flex items-center justify-center">
              <div
                className="absolute inset-0 bg-cover bg-center z-[1]"
                style={{ backgroundImage: `url('/images/pai-hero-main.jpeg')` }}
                role="img"
                aria-label="Pai landscape with person, dog, sunset, and mountains"
              />
              <div className={`absolute inset-0 z-[2] ${theme === "dark" ? "bg-black/50" : "bg-black/40"}`} />
              <motion.div
                className="relative z-[3] text-center px-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
              >
                <h1
                  className={`text-5xl md:text-7xl font-black mb-4 leading-tight ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent"
                      : "text-orange-800"
                  }`}
                >
                  Discover Pai
                </h1>
                <p
                  className={`text-xl md:text-2xl font-semibold ${
                    theme === "dark" ? "text-amber-200/90" : "text-orange-200/90"
                  }`}
                >
                  Where Adventure Meets Serenity
                </p>
              </motion.div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col items-center flex-grow px-4 py-16 gap-6 max-w-7xl mx-auto">
              <section className="py-8 px-4 max-w-4xl mx-auto text-center">
                <motion.h2
                  className={`text-3xl md:text-4xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-orange-800"}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  {"Rest, Recharge, and Immerse Yourself in Pai's Serenity"}
                </motion.h2>
                <motion.p
                  className={`text-lg leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
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
                  className={`text-sm mt-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
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
                {paiSections.map((section) => (
                  <motion.div
                    key={section.id}
                    className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg cursor-pointer transition-all duration-300 ${
                      expandedSection === section.id
                        ? theme === "dark"
                          ? "border-orange-500/30"
                          : "border-orange-700/50"
                        : theme === "dark"
                          ? "bg-orange-950/30 border-orange-500/20"
                          : "bg-orange-100/60 border-orange-600/30"
                    }`}
                    onClick={() => handleToggleSection(section.id)}
                    whileHover={{ scale: expandedSection === section.id ? 1 : 1.02 }}
                  >
                    <div className="p-6 flex justify-between items-center">
                      <div>
                        <h3
                          className={`text-xl font-bold ${
                            expandedSection === section.id
                              ? theme === "dark"
                                ? "bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent"
                                : "bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent"
                              : theme === "dark"
                                ? "text-gray-300"
                                : "text-orange-800"
                          }`}
                        >
                          {section.title}
                        </h3>
                      </div>
                      <div
                        className={`rounded-full p-2 ${
                          expandedSection === section.id
                            ? theme === "dark"
                              ? "bg-orange-500/20"
                              : "bg-orange-500/10"
                            : theme === "dark"
                              ? "bg-white/10"
                              : "bg-gray-100"
                        }`}
                      >
                        {expandedSection === section.id ? (
                          <ChevronUp className={`w-6 h-6 ${theme === "dark" ? "text-amber-700" : "text-amber-900"}`} />
                        ) : (
                          <ChevronDown className={`w-6 h-6 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`} />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedSection === section.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-2">
                            <div
                              className={`h-px w-full bg-gradient-to-r from-transparent ${theme === "dark" ? "via-orange-500/30" : "via-orange-600/40"} to-transparent mb-6`}
                            />
                            <div className={`space-y-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                              {section.media.type === "icon" && section.media.icon && (
                                <div className="flex justify-center items-center w-full h-48 rounded-lg mb-4 overflow-hidden">
                                  {React.createElement(section.media.icon, {
                                    className: `w-24 h-24 ${theme === "dark" ? "text-amber-400/70" : "text-orange-600/70"}`,
                                    "aria-label": section.media.alt,
                                  })}
                                </div>
                              )}
                              <h4
                                className={`text-xl font-semibold ${theme === "dark" ? "text-amber-200" : "text-orange-900"}`}
                              >
                                {section.expandedHeading}
                              </h4>
                              <p>{section.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
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
