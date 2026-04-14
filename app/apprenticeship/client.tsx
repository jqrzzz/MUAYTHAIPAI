"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ContinueLearning } from "@/components/blog/continue-learning"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SacredDecoration,
  SplashScreen,
  useSplash,
  useMounted,
  CONTENT_FADE_IN,
} from "@/components/marketing"

export default function ApprenticeshipClient() {
  const mounted = useMounted()
  const { showContent, dismiss } = useSplash()

  if (!mounted) {
    return null
  }

  return (
    <PageBackground>
      <h1 className="sr-only">Muay Thai Apprenticeship</h1>

      <SacredDecoration />

      <AnimatePresence mode="wait">
        {!showContent ? (
          <SplashScreen key="apprenticeship-splash" onSkip={dismiss} />
        ) : (
          <motion.div
            key="apprenticeship-content"
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
              FORGE YOUR PATH
            </motion.h2>

            <motion.section
              className="text-center px-4 max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <p className="text-lg md:text-xl font-semibold mb-4 text-amber-800/90 dark:text-amber-200/90">
                Muay Thai Apprenticeship
              </p>
              <p className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                Opportunity for committed fighters to immerse themselves in the world of Muay Thai, training,
                meditating, and fighting alongside our family.
              </p>
              <p className="text-sm mt-4 text-gray-600 dark:text-gray-400">
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
                      Daily Life
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
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
                    className="relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left text-xl md:text-2xl font-semibold hover:no-underline transition-colors text-amber-900 data-[state=open]:bg-orange-500/10 dark:text-amber-700 dark:data-[state=open]:bg-orange-500/20">
                      What We Provide
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
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
                    className="relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left text-xl md:text-2xl font-semibold hover:no-underline transition-colors text-amber-900 data-[state=open]:bg-orange-500/10 dark:text-amber-700 dark:data-[state=open]:bg-orange-500/20">
                      How to Apply
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <p>
                          If you are interested in our apprenticeship program, please contact us directly. We will
                          schedule a video call to discuss your goals and experience.
                        </p>
                        <Link
                          href="/contact"
                          className="inline-block mt-4 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-orange-600 dark:to-amber-600 dark:hover:from-orange-500 dark:hover:to-amber-500"
                        >
                          Contact Us
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>

              <motion.div
                className="w-full max-w-md mt-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.8 }}
              >
                <ContinueLearning currentPage="apprenticeship" />
              </motion.div>
            </div>

            <MarketingBottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </PageBackground>
  )
}
