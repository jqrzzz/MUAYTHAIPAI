"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun, ArrowLeft, Heart, MessageCircle, BoxIcon as Boxing, Dumbbell, Menu } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MoreMenu } from "@/components/more-menu"

export default function CareersClient() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    setMounted(true)

    const splashTimer = setTimeout(() => {
      setShowContent(true)
    }, 2000)

    return () => {
      clearTimeout(splashTimer)
    }
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen overflow-hidden relative transition-all duration-500 bg-gradient-to-b from-neutral-100 via-white to-neutral-50 dark:from-black dark:via-neutral-900 dark:to-black">
      <h1 className="sr-only">Careers at Muay Thai Pai</h1>

      <div className="absolute inset-0 z-10 bg-gradient-to-br from-orange-500/20 via-transparent to-orange-400/15 dark:from-orange-600/25 dark:to-amber-600/20" />

      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div
            key="careers-splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-20 flex items-center justify-center min-h-screen"
          >
            <div className="text-center">
              <motion.h1
                className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Forge Your Legacy
              </motion.h1>
              <motion.p
                className="text-lg font-bold tracking-widest text-amber-800/90 dark:text-amber-200/90"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                MUAY THAI CAREER PATH
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="careers-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20 min-h-screen"
          >
            {/* Navigation and content similar to apprenticeship */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/"
                  className="backdrop-blur-md rounded-full p-3 border transition-colors bg-black/10 border-black/20 hover:bg-black/20 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20"
                  aria-label="Back to home"
                >
                  <ArrowLeft className="w-5 h-5 text-orange-600 dark:text-amber-400" />
                </Link>
              </motion.div>

              <motion.div
                className="absolute top-4 right-4 z-50"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={toggleTheme}
                  className="backdrop-blur-md rounded-full p-3 border transition-colors bg-black/10 border-black/20 hover:bg-black/20 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20"
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

            <motion.h2
              className="text-3xl md:text-4xl font-black text-center pt-24 pb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              FORGE YOUR LEGACY
            </motion.h2>

            <motion.section
              className="text-center px-4 max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <p
                className="text-lg md:text-xl font-semibold mb-4 text-amber-800/90 dark:text-amber-200/90"
              >
                A Professional Path in Muay Thai
              </p>
              <p
                className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300"
              >
                For those committed to a professional career in Muay Thai, our gym offers a unique pathway to become a
                licensed fighter and coach.
              </p>
            </motion.section>

            {/* Career Paths */}
            <div className="flex flex-col items-center justify-center px-4 py-16 gap-6 pb-32">
              <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem
                    value="item-1"
                    className="relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                  >
                    <AccordionTrigger
                      className="px-6 py-4 text-left text-xl md:text-2xl font-semibold hover:no-underline transition-colors text-amber-900 data-[state=open]:bg-orange-500/10 dark:text-amber-700 dark:data-[state=open]:bg-orange-500/20"
                    >
                      {"Fighter's Path"}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <p>
                          Immerse yourself in rigorous training to become a professional Muay Thai fighter in Thailand.
                          This path demands unwavering dedication and discipline.
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
                    className="relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                  >
                    <AccordionTrigger
                      className="px-6 py-4 text-left text-xl md:text-2xl font-semibold hover:no-underline transition-colors text-amber-900 data-[state=open]:bg-orange-500/10 dark:text-amber-700 dark:data-[state=open]:bg-orange-500/20"
                    >
                      Official Accreditation
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <p>
                          Our gym is officially recognized in Thailand, providing legitimate accreditation and licensing
                          for professional Muay Thai practitioners.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>
            </div>

            {/* Bottom Navigation */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t bg-white/90 border-gray-200 dark:bg-black/80 dark:border-white/10"
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
                      className="text-gray-500 dark:text-gray-400"
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
                      className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400"
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
