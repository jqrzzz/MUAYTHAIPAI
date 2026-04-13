"use client"
import { useState, useEffect } from "react"

import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { SacredBackground } from "@/components/sacred-background"
import { MiniSlideshow } from "@/components/mini-slideshow"
import { BookingSection } from "@/components/booking-section"
import { ContinueLearning } from "@/components/blog/continue-learning"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SplashScreen,
  useSplash,
} from "@/components/marketing"

export default function ClassesClientPage() {
  const showContent = useSplash()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  // Define images for each section
  const groupImages = [
    { src: "/images/group-training-pads.jpeg", alt: "Group training session with trainer holding pads" },
    { src: "/images/group-pose-1.jpeg", alt: "Group of students and trainers posing after a session" },
    { src: "/images/group-pose-2.jpeg", alt: "Large group of students and trainers posing in the ring" },
  ]

  const privateImages = [
    { src: "/images/private-kick-female.jpeg", alt: "Female student practicing kick with trainer" },
    { src: "/images/private-punch-male.jpeg", alt: "Male student practicing punch with trainer" },
    { src: "/images/private-instruction.jpeg", alt: "Trainer giving personalized instruction to student" },
  ]

  const membershipImages = [
    { src: "/images/membership-punching-bags.jpeg", alt: "Various punching bags in a Muay Thai gym" },
    { src: "/images/membership-fighters-smiling.jpeg", alt: "Two fighters smiling after a match" },
    { src: "/images/membership-offering-bowl.jpeg", alt: "Traditional offering bowl in a boxing ring" },
  ]

  const kidsImages = [
    { src: "/images/kids-group-pose.png", alt: "Group of children posing in a Muay Thai gym" },
    { src: "/images/kids-stretching-legs.png", alt: "Children stretching legs on a mat in the gym" },
    { src: "/images/kids-resting-mat.png", alt: "Children resting on mats in the Muay Thai gym" },
  ]

  const onlineImages = [
    { src: "/placeholder.svg?height=300&width=500", alt: "Online training session" },
    { src: "/placeholder.svg?height=300&width=500", alt: "Home training" },
    { src: "/placeholder.svg?height=300&width=500", alt: "Virtual class" },
  ]

  const blacklabelImages = [
    { src: "/placeholder.svg?height=300&width=500", alt: "Sacred training" },
    { src: "/placeholder.svg?height=300&width=500", alt: "Ancient martial arts" },
    { src: "/placeholder.svg?height=300&width=500", alt: "Meditation and Muay Thai" },
  ]

  if (!mounted) return null

  return (
    <PageBackground>
      {/* Subtle Sacred Background */}
      <SacredBackground />

      <AnimatePresence mode="wait">
        {!showContent ? (
          <SplashScreen key="classes-splash" title="Classes" subtitle="MUAY THAI PAI" />
        ) : (
          // Classes Content
          <motion.div
            key="classes-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20 min-h-screen"
          >
            <MarketingTopNav />

            {/* Sacred Steps Accordion */}
            <div className="flex flex-col items-center min-h-screen px-4 pt-24 pb-16 gap-6">
              {/* Group Sessions - Step 1 */}
              <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <motion.div
                  className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 cursor-default ${
                    expandedSection === "group"
                      ? "border-orange-700/50"
                      : "bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                  }`}
                  whileHover={{ scale: expandedSection === "group" ? 1 : 1.02 }}
                  animate={{
                    boxShadow:
                      expandedSection === "group"
                        ? [
                            `0 0 20px rgba(249, 115, 22, ${theme === "dark" ? "0.5" : "0.6"})`,
                            `0 0 30px rgba(249, 115, 22, ${theme === "dark" ? "0.7" : "0.8"})`,
                            `0 0 20px rgba(249, 115, 22, ${theme === "dark" ? "0.5" : "0.6"})`,
                          ]
                        : [
                            `0 0 10px rgba(249, 115, 22, ${theme === "dark" ? "0.2" : "0.3"})`,
                            `0 0 15px rgba(249, 115, 22, ${theme === "dark" ? "0.3" : "0.4"})`,
                            `0 0 10px rgba(249, 115, 22, ${theme === "dark" ? "0.2" : "0.3"})`,
                          ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: expandedSection === "group" ? 2 : 4,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    },
                  }}
                >
                  {/* Header - Always Visible */}
                  <div
                    className="p-6 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("group")}
                  >
                    <div>
                      <h3
                        className={`text-2xl font-bold ${
                          expandedSection === "group"
                            ? "bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent dark:from-amber-700 dark:to-orange-700"
                            : "text-amber-900 dark:text-amber-700"
                        }`}
                      >
                        GROUP
                      </h3>
                      <p className="mt-1 text-amber-900 dark:text-amber-700">330 THB</p>
                    </div>
                    <div
                      className={`rounded-full p-2 ${
                        expandedSection === "group"
                          ? "bg-orange-500/10 dark:bg-orange-500/20"
                          : "bg-black/5 dark:bg-white/10"
                      }`}
                    >
                      {expandedSection === "group" ? (
                        <ChevronUp className="w-6 h-6 text-amber-900 dark:text-amber-700" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedSection === "group" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.4 },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.2 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { duration: 0.3, delay: 0.1 },
                          }}
                          className="px-6 pb-6 pt-2"
                        >
                          <motion.div
                            initial={{ opacity: 0, width: "0%" }}
                            animate={{
                              opacity: 1,
                              width: "100%",
                              transition: { duration: 0.5 },
                            }}
                            className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6"
                          />
                          {/* Mini Slideshow for Group */}
                          <MiniSlideshow images={groupImages} />
                          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                            <div>
                              <p className="font-semibold text-base mb-1">Schedule:</p>
                              <p className="ml-2">• Morning: 8:00-9:45am (Mon-Sat)</p>
                              <p className="ml-2">• Afternoon: 3:00-4:45pm (Mon-Sat)</p>
                            </div>
                            <div>
                              <p className="font-semibold text-base mb-1">Includes:</p>
                              <p className="ml-2">• All training gear provided</p>
                              <p className="ml-2">• Professional instruction</p>
                              <p className="ml-2">• Access to gym facilities</p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Train in our{" "}
                              <Link href="/gym" className="text-primary underline-offset-4 hover:underline">
                                fully-equipped gym
                              </Link>{" "}
                              with experienced trainers.
                            </p>
                            <BookingSection initialBookingItemId="group-session" />
                            <div className="flex justify-center mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedSection(null)
                                }}
                                className="flex items-center gap-1 px-4 py-2 rounded-full text-xs bg-black/5 text-gray-600 hover:bg-black/10 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                              >
                                <ChevronUp className="w-3 h-3" />
                                <span>Close</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Private Sessions - Step 2 */}
              <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.8 }}
              >
                <motion.div
                  className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 cursor-default ${
                    expandedSection === "private"
                      ? "border-orange-700/50"
                      : "bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                  }`}
                  whileHover={{ scale: expandedSection === "private" ? 1 : 1.02 }}
                  animate={{
                    boxShadow:
                      expandedSection === "private"
                        ? [
                            `0 0 20px rgba(249, 115, 22, ${theme === "dark" ? "0.5" : "0.6"})`,
                            `0 0 30px rgba(249, 115, 22, ${theme === "dark" ? "0.7" : "0.8"})`,
                            `0 0 20px rgba(249, 115, 22, ${theme === "dark" ? "0.5" : "0.6"})`,
                          ]
                        : [
                            `0 0 10px rgba(249, 115, 22, ${theme === "dark" ? "0.2" : "0.3"})`,
                            `0 0 15px rgba(249, 115, 22, ${theme === "dark" ? "0.3" : "0.4"})`,
                            `0 0 10px rgba(249, 115, 22, ${theme === "dark" ? "0.2" : "0.3"})`,
                          ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: expandedSection === "private" ? 2 : 4,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    },
                  }}
                >
                  {/* Header - Always Visible */}
                  <div
                    className="p-6 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("private")}
                  >
                    <div>
                      <h3
                        className={`text-2xl font-bold ${
                          expandedSection === "private"
                            ? "bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent dark:from-amber-700 dark:to-orange-700"
                            : "text-amber-900 dark:text-amber-700"
                        }`}
                      >
                        PRIVATE
                      </h3>
                      <p className="mt-1 text-amber-900 dark:text-amber-700">
                        600 THB - 900 THB<span className="text-sm">/hour</span>
                      </p>
                    </div>
                    <div
                      className={`rounded-full p-2 ${
                        expandedSection === "private"
                          ? "bg-orange-500/10 dark:bg-orange-500/20"
                          : "bg-black/5 dark:bg-white/10"
                      }`}
                    >
                      {expandedSection === "private" ? (
                        <ChevronUp className="w-6 h-6 text-amber-900 dark:text-amber-700" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedSection === "private" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.4 },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.2 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { duration: 0.3, delay: 0.1 },
                          }}
                          className="px-6 pb-6 pt-2"
                        >
                          <motion.div
                            initial={{ opacity: 0, width: "0%" }}
                            animate={{
                              opacity: 1,
                              width: "100%",
                              transition: { duration: 0.5 },
                            }}
                            className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6"
                          />
                          {/* Mini Slideshow for Private */}
                          <MiniSlideshow images={privateImages} />
                          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                            <div>
                              <p className="font-semibold text-base mb-1">Schedule:</p>
                              <p className="ml-2">• Available: 7:00am-6:00pm</p>
                              <p className="ml-2">• Every day (Mon-Sun)</p>
                            </div>
                            <div>
                              <p className="font-semibold text-base mb-1">Includes:</p>
                              <p className="ml-2">• 1-on-1 with trainer</p>
                              <p className="ml-2">• Personalized training</p>
                              <p className="ml-2">• All gear included</p>
                              <p className="ml-2">• Focused skill development</p>
                            </div>
                            <BookingSection initialBookingItemId="private-lesson" />
                            <div className="flex justify-center mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedSection(null)
                                }}
                                className="flex items-center gap-1 px-4 py-2 rounded-full text-xs bg-black/5 text-gray-600 hover:bg-black/10 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                              >
                                <ChevronUp className="w-3 h-3" />
                                <span>Close</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Membership - Step 3 */}
              <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.8 }}
              >
                <motion.div
                  className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 cursor-default ${
                    expandedSection === "membership"
                      ? "border-orange-700/50"
                      : "bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                  }`}
                  whileHover={{ scale: expandedSection === "membership" ? 1 : 1.02 }}
                  animate={{
                    boxShadow:
                      expandedSection === "membership"
                        ? [
                            `0 0 20px rgba(249, 115, 22, ${theme === "dark" ? "0.5" : "0.6"})`,
                            `0 0 30px rgba(249, 115, 22, ${theme === "dark" ? "0.7" : "0.8"})`,
                            `0 0 20px rgba(249, 115, 22, ${theme === "dark" ? "0.5" : "0.6"})`,
                          ]
                        : [
                            `0 0 10px rgba(249, 115, 22, ${theme === "dark" ? "0.2" : "0.3"})`,
                            `0 0 15px rgba(249, 115, 22, ${theme === "dark" ? "0.3" : "0.4"})`,
                            `0 0 10px rgba(249, 115, 22, ${theme === "dark" ? "0.2" : "0.3"})`,
                          ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: expandedSection === "membership" ? 2 : 4,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    },
                  }}
                >
                  {/* Header - Always Visible */}
                  <div
                    className="p-6 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("membership")}
                  >
                    <div>
                      <h3
                        className={`text-2xl font-bold ${
                          expandedSection === "membership"
                            ? "bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent dark:from-amber-700 dark:to-orange-700"
                            : "text-amber-900 dark:text-amber-700"
                        }`}
                      >
                        MEMBERSHIP
                      </h3>
                      <p className="mt-1 text-amber-900 dark:text-amber-700">
                        7,700 THB<span className="text-sm">/month</span>
                      </p>
                    </div>
                    <div
                      className={`rounded-full p-2 ${
                        expandedSection === "membership"
                          ? "bg-orange-500/10 dark:bg-orange-500/20"
                          : "bg-black/5 dark:bg-white/10"
                      }`}
                    >
                      {expandedSection === "membership" ? (
                        <ChevronUp className="w-6 h-6 text-amber-900 dark:text-amber-700" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedSection === "membership" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.4 },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.2 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { duration: 0.3, delay: 0.1 },
                          }}
                          className="px-6 pb-6 pt-2"
                        >
                          <motion.div
                            initial={{ opacity: 0, width: "0%" }}
                            animate={{
                              opacity: 1,
                              width: "100%",
                              transition: { duration: 0.5 },
                            }}
                            className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6"
                          />
                          {/* Mini Slideshow for Membership */}
                          <MiniSlideshow images={membershipImages} />
                          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                            <div>
                              <p className="font-semibold text-base mb-1">Benefits:</p>
                              <p className="ml-2">• Unlimited group sessions</p>
                              <p className="ml-2">• Full access to morning & afternoon classes</p>
                              <p className="ml-2">• Priority booking</p>
                              <p className="ml-2">• Join the Wisarut family</p>
                            </div>
                            <div>
                              <p className="font-semibold text-base mb-1">Includes:</p>
                              <p className="ml-2">• All training gear</p>
                              <p className="ml-2">• Personalized progress tracking</p>
                              <p className="ml-2">• Community events</p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Looking for accommodation? Check our{" "}
                              <Link href="/train-and-stay" className="text-primary underline-offset-4 hover:underline">
                                Train & Stay packages
                              </Link>
                              . Have questions? Visit our{" "}
                              <Link href="/faq" className="text-primary underline-offset-4 hover:underline">
                                FAQ
                              </Link>
                              .
                            </p>
                            <BookingSection initialBookingItemId="gym-membership" />
                            <div className="flex justify-center mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedSection(null)
                                }}
                                className="flex items-center gap-1 px-4 py-2 rounded-full text-xs bg-black/5 text-gray-600 hover:bg-black/10 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                              >
                                <ChevronUp className="w-3 h-3" />
                                <span>Close</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Kids Classes - Step 4 */}
              <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.8 }}
              >
                <motion.div
                  className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 cursor-default ${
                    expandedSection === "kids"
                      ? "border-red-500/30"
                      : "bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                  }`}
                  whileHover={{ scale: expandedSection === "kids" ? 1 : 1.02 }}
                  animate={{
                    boxShadow:
                      expandedSection === "kids"
                        ? [
                            `0 0 20px rgba(239, 68, 68, ${theme === "dark" ? "0.5" : "0.6"})`, // Using red for kids glow
                            `0 0 30px rgba(239, 68, 68, ${theme === "dark" ? "0.7" : "0.8"})`,
                            `0 0 20px rgba(239, 68, 68, ${theme === "dark" ? "0.5" : "0.6"})`,
                          ]
                        : [
                            `0 0 10px rgba(239, 68, 68, ${theme === "dark" ? "0.2" : "0.3"})`, // Using red for kids glow
                            `0 0 15px rgba(239, 68, 68, ${theme === "dark" ? "0.3" : "0.4"})`,
                            `0 0 10px rgba(239, 68, 68, ${theme === "dark" ? "0.2" : "0.3"})`,
                          ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: expandedSection === "kids" ? 2 : 4,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    },
                  }}
                >
                  {/* Header - Always Visible */}
                  <div
                    className="p-6 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("kids")}
                  >
                    <div>
                      <h3
                        className={`text-2xl font-bold ${
                          expandedSection === "kids"
                            ? "bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent dark:from-amber-700 dark:to-orange-700"
                            : "text-amber-900 dark:text-amber-700"
                        }`}
                      >
                        MUAY THAI FOR KIDS
                      </h3>
                      <p className="mt-1 text-amber-900 dark:text-amber-700">
                        500 THB<span className="text-sm">/session</span>
                      </p>
                    </div>
                    <div
                      className={`rounded-full p-2 ${
                        expandedSection === "kids"
                          ? "bg-red-500/10 dark:bg-red-500/20"
                          : "bg-black/5 dark:bg-white/10"
                      }`}
                    >
                      {expandedSection === "kids" ? (
                        <ChevronUp className="w-6 h-6 text-amber-900 dark:text-amber-700" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedSection === "kids" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.4 },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.2 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { duration: 0.3, delay: 0.1 },
                          }}
                          className="px-6 pb-6 pt-2"
                        >
                          <motion.div
                            initial={{ opacity: 0, width: "0%" }}
                            animate={{
                              opacity: 1,
                              width: "100%",
                              transition: { duration: 0.5 },
                            }}
                            className="h-px w-full bg-gradient-to-r from-transparent via-red-500/30 to-transparent mb-6"
                          />
                          {/* Mini Slideshow for Kids */}
                          <MiniSlideshow images={kidsImages} />
                          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                            <div>
                              <p className="font-semibold text-base mb-1">Ages:</p>
                              <p className="ml-2">• 6-12 years old</p>
                              <p className="ml-2">• Beginner friendly</p>
                            </div>
                            <div>
                              <p className="font-semibold text-base mb-1">Schedule:</p>
                              <p className="ml-2">• By appointment Monday - Sunday</p>
                            </div>
                            <div>
                              <p className="font-semibold text-base mb-1">Includes:</p>
                              <p className="ml-2">• Age-appropriate training</p>
                              <p className="ml-2">• Focus on discipline & respect</p>
                              <p className="ml-2">• Fun learning environment</p>
                              <p className="ml-2">• All gear provided</p>
                            </div>
                            <BookingSection initialBookingItemId="muay-thai-kids" />
                            <div className="flex justify-center mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedSection(null)
                                }}
                                className="flex items-center gap-1 px-4 py-2 rounded-full text-xs bg-black/5 text-gray-600 hover:bg-black/10 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                              >
                                <ChevronUp className="w-3 h-3" />
                                <span>Close</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Online Classes - Step 5 */}
              <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              >
                <motion.div
                  className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 cursor-default ${
                    expandedSection === "online"
                      ? "border-amber-700/50"
                      : "bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                  }`}
                  whileHover={{ scale: expandedSection === "online" ? 1 : 1.02 }}
                  animate={{
                    boxShadow:
                      expandedSection === "online"
                        ? [
                            `0 0 20px rgba(245, 158, 11, ${theme === "dark" ? "0.5" : "0.6"})`, // Using amber for online glow
                            `0 0 30px rgba(245, 158, 11, ${theme === "dark" ? "0.7" : "0.8"})`,
                            `0 0 20px rgba(245, 158, 11, ${theme === "dark" ? "0.5" : "0.6"})`,
                          ]
                        : [
                            `0 0 10px rgba(245, 158, 11, ${theme === "dark" ? "0.2" : "0.3"})`, // Using amber for online glow
                            `0 0 15px rgba(245, 158, 11, ${theme === "dark" ? "0.3" : "0.4"})`,
                            `0 0 10px rgba(245, 158, 11, ${theme === "dark" ? "0.2" : "0.3"})`,
                          ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: expandedSection === "online" ? 2 : 4,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    },
                  }}
                >
                  {/* Header - Always Visible */}
                  <div
                    className="p-6 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("online")}
                  >
                    <div>
                      <h3
                        className={`text-2xl font-bold ${
                          expandedSection === "online"
                            ? "bg-gradient-to-r from-amber-900 to-yellow-900 bg-clip-text text-transparent dark:from-amber-700 dark:to-yellow-700"
                            : "text-amber-900 dark:text-amber-700"
                        }`}
                      >
                        ONLINE
                      </h3>
                      <p className="mt-1 text-amber-900 dark:text-amber-700">
                        330 THB<span className="text-sm">/month</span>
                      </p>
                    </div>
                    <div
                      className={`rounded-full p-2 ${
                        expandedSection === "online"
                          ? "bg-amber-500/10 dark:bg-amber-500/20"
                          : "bg-black/5 dark:bg-white/10"
                      }`}
                    >
                      {expandedSection === "online" ? (
                        <ChevronUp className="w-6 h-6 text-amber-900 dark:text-amber-700" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedSection === "online" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.4 },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.2 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { duration: 0.3, delay: 0.1 },
                          }}
                          className="px-6 pb-6 pt-2"
                        >
                          <motion.div
                            initial={{ opacity: 0, width: "0%" }}
                            animate={{
                              opacity: 1,
                              width: "100%",
                              transition: { duration: 0.5 },
                            }}
                            className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mb-6"
                          />
                          {/* Mini Slideshow for Online */}
                          <MiniSlideshow images={onlineImages} />
                          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                            <p className="text-center text-xs italic text-gray-400">Coming soon</p>
                            <div>
                              <p className="font-semibold text-base mb-1">What's Included:</p>
                              <p className="ml-2">• Structured online courses & materials</p>
                              <p className="ml-2">• Start with basics (Naga level)</p>
                              <p className="ml-2">• Progress requires live instructor evaluation</p>
                              <p className="ml-2">• Rank up to unlock more content</p>
                            </div>
                            <BookingSection initialBookingItemId="online-training" />
                            <div className="flex justify-center mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedSection(null)
                                }}
                                className="flex items-center gap-1 px-4 py-2 rounded-full text-xs bg-black/5 text-gray-600 hover:bg-black/10 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                              >
                                <ChevronUp className="w-3 h-3" />
                                <span>Close</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Black Label Experience - Step 6 */}
              <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7, duration: 0.8 }}
              >
                <motion.div
                  className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 cursor-default ${
                    expandedSection === "blacklabel"
                      ? "border-white/50 bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90"
                      : "border-white/30 bg-gradient-to-br from-black/70 via-gray-900/70 to-black/70"
                  }`}
                  whileHover={{ scale: expandedSection === "blacklabel" ? 1 : 1.02 }}
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(0, 0, 0, 0.8)",
                      "0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(0, 0, 0, 0.9)",
                      "0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(0, 0, 0, 0.8)",
                    ],
                  }}
                  transition={{
                    boxShadow: {
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    },
                  }}
                >
                  {/* Header - Always Visible */}
                  <div
                    className="p-6 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("blacklabel")}
                  >
                    <div>
                      <motion.h3
                        className="text-2xl font-bold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent"
                        animate={{
                          textShadow: [
                            "0 0 10px rgba(255, 255, 255, 0.5)",
                            "0 0 20px rgba(255, 255, 255, 0.8)",
                            "0 0 10px rgba(255, 255, 255, 0.5)",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "reverse",
                        }}
                      >
                        BLACK LABEL EXPERIENCE
                      </motion.h3>
                      <p className="mt-1 text-gray-300 text-sm italic">By invitation only</p>
                    </div>
                    <div className="rounded-full p-2 bg-white/10">
                      {expandedSection === "blacklabel" ? (
                        <ChevronUp className="w-6 h-6 text-white" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedSection === "blacklabel" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.4 },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.2 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { duration: 0.3, delay: 0.1 },
                          }}
                          className="px-6 pb-6 pt-2"
                        >
                          <motion.div
                            initial={{ opacity: 0, width: "0%" }}
                            animate={{
                              opacity: 1,
                              width: "100%",
                              transition: { duration: 0.5 },
                            }}
                            className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6"
                          />
                          {/* Mini Slideshow for Black Label */}
                          <MiniSlideshow images={blacklabelImages} />
                          <div className="space-y-4 text-sm text-gray-300">
                            <div>
                              <p className="font-semibold text-base mb-1 text-white">The Ultimate Journey:</p>
                              <p className="ml-2">• Muay Thai survival meditation retreat</p>
                              <p className="ml-2">• Ancient warrior training methods</p>
                              <p className="ml-2">• Deep cultural immersion</p>
                              <p className="ml-2">• Sacred temple ceremonies</p>
                            </div>
                            <div>
                              <p className="font-semibold text-base mb-1 text-white">Experience Includes:</p>
                              <p className="ml-2">• Private mountain training grounds</p>
                              <p className="ml-2">• Traditional meditation practices</p>
                              <p className="ml-2">• Exclusive access to family secrets</p>
                              <p className="ml-2">• Transformation beyond fighting</p>
                            </div>
                            <motion.button
                              className="w-full py-3 rounded-xl font-bold text-black mt-6 bg-gradient-to-r from-white via-gray-200 to-white hover:from-gray-100 hover:via-white hover:to-gray-100 transition-all duration-300"
                              whileHover={{
                                scale: 1.02,
                                boxShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
                              }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Request Invitation
                            </motion.button>
                            <div className="flex justify-center mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedSection(null)
                                }}
                                className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs bg-white/10 text-gray-300 hover:bg-white/20`}
                              >
                                <ChevronUp className="w-3 h-3" />
                                <span>Close</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </div>

            <MarketingBottomNav active="classes" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Particles */}
      {showContent && (
        <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${
                i % 3 === 0 ? "bg-orange-500/20" : i % 3 === 1 ? "bg-amber-500/20" : "bg-orange-700/20"
              }`}
              style={{
                width: Math.random() * 6 + 2,
                height: Math.random() * 6 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      )}

      {/* Continue Learning Section - Added */}
      {showContent && (
        <div className="relative z-20 py-16 px-4">
          <ContinueLearning />
        </div>
      )}
    </PageBackground>
  )
}
