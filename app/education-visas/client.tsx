"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, GraduationCap, ChevronDown, ChevronUp } from "lucide-react"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SplashScreen,
  useSplash,
} from "@/components/marketing"

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
      <h1 className="sr-only">Education Visas in Thailand</h1>

      <AnimatePresence mode="wait">
        {!showContent ? (
          <SplashScreen key="visa-splash" title="Visas" subtitle="MUAY THAI PAI" />
        ) : (
          <motion.div
            key="visa-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20 min-h-screen flex flex-col"
          >
            <MarketingTopNav />

            {/* Main Content Area */}
            <div className="flex flex-col items-center justify-center flex-grow px-4 py-16 gap-6 max-w-7xl mx-auto pb-32">
              <div className="text-center mb-8 mt-16">
                <motion.h2
                  className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  Visa Options
                </motion.h2>
                <motion.p
                  className="text-lg md:text-xl font-semibold text-amber-800/90 dark:text-amber-200/90"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  Your Gateway to Training and Living in Thailand
                </motion.p>
                <motion.p
                  className="text-sm font-bold tracking-widest mt-2 text-orange-700/80 dark:text-amber-400/80"
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
                {visaOptions.map((option) => {
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
                            <BookOpen className="w-4 h-4 text-orange-500" />
                            <span>{option.duration}</span>
                            <GraduationCap className="w-4 h-4 text-orange-500" />
                            <span>{option.purpose}</span>
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
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-2">
                              <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                              <div className="space-y-4 text-gray-700 dark:text-gray-300">
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
                  )
                })}
              </motion.div>
            </div>

            <MarketingBottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </PageBackground>
  )
}
