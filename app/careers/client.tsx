"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SplashScreen,
  useSplash,
  useMounted,
  CONTENT_FADE_IN,
} from "@/components/marketing"

export default function CareersClient() {
  const mounted = useMounted()
  const { showContent, dismiss } = useSplash()

  if (!mounted) {
    return null
  }

  return (
    <PageBackground>
      <h1 className="sr-only">Careers at Muay Thai Pai</h1>

      <AnimatePresence mode="wait">
        {!showContent ? (
          <SplashScreen key="careers-splash" onSkip={dismiss} />
        ) : (
          <motion.div
            key="careers-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={CONTENT_FADE_IN}
            className="relative z-20 min-h-screen"
          >
            <MarketingTopNav />

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
              <p className="text-lg md:text-xl font-semibold mb-4 text-amber-800/90 dark:text-amber-200/90">
                A Professional Path in Muay Thai
              </p>
              <p className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
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
                    <AccordionTrigger className="px-6 py-4 text-left text-xl md:text-2xl font-semibold hover:no-underline transition-colors text-amber-900 data-[state=open]:bg-orange-500/10 dark:text-amber-700 dark:data-[state=open]:bg-orange-500/20">
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
                    <AccordionTrigger className="px-6 py-4 text-left text-xl md:text-2xl font-semibold hover:no-underline transition-colors text-amber-900 data-[state=open]:bg-orange-500/10 dark:text-amber-700 dark:data-[state=open]:bg-orange-500/20">
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

            <MarketingBottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </PageBackground>
  )
}
