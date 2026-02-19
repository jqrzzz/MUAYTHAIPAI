"use client"
import { useState, useEffect } from "react"
import { Dumbbell } from "lucide-react"

import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Moon,
  Sun,
  Heart,
  MessageCircle,
  BookOpen,
  GraduationCap,
  Menu,
  ChevronDown,
  ChevronUp,
  BoxIcon as Boxing,
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { MoreMenu } from "@/components/more-menu"

const visaOptions = [
  {
    id: "student-visa",
    name: "Student (ED) Visa",
    duration: "6-12 Months (Extendable)",
    purpose: "Full-time Muay Thai study",
    description:
      "The Student (ED) Visa is perfect for those dedicated to long-term Muay Thai training. It allows extended stays with options for renewal.",
    requirements: [
      "Enrollment letter from our school",
      "Proof of financial stability",
      "Passport valid for 6+ months",
      "Passport-sized photos",
      "Application form & fee",
    ],
  },
  {
    id: "digital-nomad-visa",
    name: "Digital Nomad (DTV) Visa",
    duration: "Up to 5 Years (Extendable)",
    purpose: "Remote work & long-term stay",
    description:
      "The Digital Nomad Visa (DTV) is designed for remote workers and freelancers seeking a long-term stay in Thailand.",
    requirements: [
      "Proof of remote employment/freelance income",
      "Minimum income requirement",
      "Health insurance",
      "Passport valid for 6+ months",
      "Application form & fee",
    ],
  },
]

export default function EducationVisasClient() {
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
      <h1 className="sr-only">Education Visas in Thailand</h1>

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
            key="visa-splash"
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
                Visas
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
            key="visa-content"
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
                  Visa Options
                </motion.h1>
                <motion.p
                  className={`text-lg md:text-xl font-semibold ${
                    theme === "dark" ? "text-amber-200/90" : "text-amber-800/90"
                  }`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  Your Gateway to Training and Living in Thailand
                </motion.p>
                <motion.p
                  className={`text-sm font-bold tracking-widest mt-2 ${
                    theme === "dark" ? "text-amber-400/80" : "text-orange-700/80"
                  }`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                >
                  Coming soon
                </motion.p>
              </div>

              {/* Visa Options */}
              <motion.div
                className="w-full max-w-md space-y-6 mt-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.8 }}
              >
                {visaOptions.map((option) => (
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
                          <BookOpen className="w-4 h-4 text-orange-500" />
                          <span>{option.duration}</span>
                          <GraduationCap className="w-4 h-4 text-orange-500" />
                          <span>{option.purpose}</span>
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
                            <div className={`space-y-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                              <p>{option.description}</p>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {option.requirements.map((req, idx) => (
                                  <li key={idx}>{req}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
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
