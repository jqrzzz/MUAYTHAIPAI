"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun, ArrowLeft, Heart, MessageCircle, BoxIcon as Boxing, Dumbbell, Menu } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MoreMenu } from "@/components/more-menu"
import { ContinueLearning } from "@/components/blog/continue-learning"

export default function ApprenticeshipClient() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [muted, setMuted] = useState(true)
  const [isUserActive, setIsUserActive] = useState(true)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    setMounted(true)

    const splashTimer = setTimeout(() => {
      setShowContent(true)
    }, 2000)

    let activityTimer: NodeJS.Timeout

    const handleUserActivity = () => {
      setIsUserActive(true)
      if (activityTimer) {
        clearTimeout(activityTimer)
      }
      activityTimer = setTimeout(() => {
        setIsUserActive(false)
      }, 4000)
    }

    const events = ["mousemove", "scroll", "touchstart", "touchmove", "keydown"]
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true })
    })

    activityTimer = setTimeout(() => {
      setIsUserActive(false)
    }, 4000)

    return () => {
      clearTimeout(splashTimer)
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity)
      })
      if (activityTimer) {
        clearTimeout(activityTimer)
      }
    }
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const toggleMute = () => {
    setMuted(!muted)
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

      {/* Light Rays */}
      <div className="absolute inset-0 z-5 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute top-0 w-20 h-screen bg-gradient-to-b ${
              theme === "dark"
                ? "from-amber-500/5 via-orange-500/3 to-transparent"
                : "from-amber-500/10 via-orange-500/5 to-transparent"
            }`}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
            style={{
              left: `${10 + i * 20}%`,
              transformOrigin: "top",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div
            key="apprenticeship-splash"
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
                Forge Your Path
              </motion.h1>
              <motion.p
                className={`text-lg font-bold tracking-widest ${
                  theme === "dark" ? "text-amber-200/90" : "text-amber-800/90"
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                MUAY THAI APPRENTICESHIP
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="apprenticeship-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20 min-h-screen"
          >
            {/* Top Navigation */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: isUserActive ? 1 : 0.7, y: 0 }}
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
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: isUserActive ? 1 : 0.7, y: 0 }}
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

            {/* Page Title */}
            <motion.h2
              className={`text-3xl md:text-4xl font-black text-center pt-24 pb-4 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              FORGE YOUR PATH
            </motion.h2>

            {/* Apprenticeship Intro */}
            <motion.section
              className="text-center px-4 max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <p
                className={`text-lg md:text-xl font-semibold mb-4 ${theme === "dark" ? "text-amber-200/90" : "text-amber-800/90"}`}
              >
                Muay Thai Apprenticeship
              </p>
              <p
                className={`text-base md:text-lg leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
              >
                Opportunity for committed fighters to immerse themselves in the world of Muay Thai, training,
                meditating, and fighting alongside our family.
              </p>
              <p className={`text-sm mt-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Interested in our{" "}
                <Link href="/certificate-programs" className="text-primary underline-offset-4 hover:underline">
                  certificate programs
                </Link>
                ? Learn more about{" "}
                <Link href="/pai-thailand" className="text-primary underline-offset-4 hover:underline">
                  life in Pai
                </Link>
                .
              </p>
            </motion.section>

            {/* Program Details */}
            <div className="flex flex-col items-center justify-center px-4 py-16 gap-6">
              <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem
                    value="item-1"
                    className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-orange-950/30 border-orange-500/20"
                        : "bg-orange-100/60 border-orange-600/30"
                    }`}
                  >
                    <AccordionTrigger
                      className={`px-6 py-4 text-left text-xl md:text-2xl font-semibold hover:no-underline transition-colors ${
                        theme === "dark"
                          ? "text-amber-700 data-[state=open]:bg-orange-500/20"
                          : "text-amber-900 data-[state=open]:bg-orange-500/10"
                      }`}
                    >
                      Daily Life
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                      <div className={`space-y-4 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        <p>
                          This program offers a profound immersion into the life of a Muay Thai fighter alongside our
                          trainers. You will train, study, and contribute to the daily operations of the gym.
                        </p>
                        <p>
                          This is a minimum 6-12 month commitment and requires the appropriate visa for your stay in
                          Thailand.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>

              <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.8 }}
              >
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem
                    value="item-2"
                    className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-orange-950/30 border-orange-500/20"
                        : "bg-orange-100/60 border-orange-600/30"
                    }`}
                  >
                    <AccordionTrigger
                      className={`px-6 py-4 text-left text-xl md:text-2xl font-semibold hover:no-underline transition-colors ${
                        theme === "dark"
                          ? "text-amber-700 data-[state=open]:bg-orange-500/20"
                          : "text-amber-900 data-[state=open]:bg-orange-500/10"
                      }`}
                    >
                      What We Provide
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                      <div className={`space-y-4 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        <p>
                          We provide a room inside the gym, clean drinking water, restrooms, and showers. This program
                          fosters discipline, responsibility, and a deep connection with our Thai family.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>

              <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.8 }}
              >
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem
                    value="item-3"
                    className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-orange-950/30 border-orange-500/20"
                        : "bg-orange-100/60 border-orange-600/30"
                    }`}
                  >
                    <AccordionTrigger
                      className={`px-6 py-4 text-left text-xl md:text-2xl font-semibold hover:no-underline transition-colors ${
                        theme === "dark"
                          ? "text-amber-700 data-[state=open]:bg-orange-500/20"
                          : "text-amber-900 data-[state=open]:bg-orange-500/10"
                      }`}
                    >
                      How to Apply
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                      <div className={`space-y-4 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        <p>
                          If you are interested in our apprenticeship program, please contact us directly. We will
                          schedule a video call to discuss your goals and experience.
                        </p>
                        <Link
                          href="/contact"
                          className={`inline-block mt-4 px-6 py-3 rounded-xl font-bold text-white ${
                            theme === "dark"
                              ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500"
                              : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                          }`}
                        >
                          Contact Us
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>

              {/* Continue Learning Section */}
              <motion.div
                className="w-full max-w-md mt-12 pb-24"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.8 }}
              >
                <ContinueLearning currentPage="apprenticeship" />
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
