"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronUp, ChevronDown, Heart, MessageCircle, Mail, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { BookingSection } from "@/components/booking-section"
import { SOCIAL_LINKS } from "@/lib/socials"
import { InstagramIcon, FacebookIcon } from "@/components/social-icons"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  useMounted,
  CONTENT_FADE_IN,
} from "@/components/marketing"

export default function ContactClient() {
  const mounted = useMounted()
  const [showMissionText, setShowMissionText] = useState(false)
  const [showSocialModal, setShowSocialModal] = useState(false)

  if (!mounted) {
    return null
  }

  return (
    <PageBackground>
      <h1 className="sr-only">Contact Muay Thai Pai</h1>

      <motion.div
        key="contact-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={CONTENT_FADE_IN}
        className="relative z-20 min-h-screen"
      >
        <MarketingTopNav />

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row min-h-screen px-4 py-16 gap-8 max-w-7xl mx-auto">
          <motion.div
            className="lg:w-full space-y-8 pt-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <BookingSection />

            {/* Our Mission Section */}
            <div className="space-y-4 pt-8">
              <div className="backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 bg-white/30 border-orange-500/20 dark:bg-black/30">
                <motion.div
                  onClick={() => setShowMissionText(!showMissionText)}
                  className={cn(
                    `flex justify-between items-center cursor-pointer rounded-xl p-4 transition-all duration-300`,
                    "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 dark:from-orange-700 dark:via-amber-700 dark:to-orange-700",
                    `text-white`,
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Heart className="w-6 h-6" /> Our Mission
                  </h2>
                  {showMissionText ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </motion.div>

                {showMissionText && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="mt-6 pt-6 border-t border-orange-500/20"
                  >
                    <p className="text-gray-700 dark:text-gray-300">
                      Our mission is to preserve the rich heritage of Muay Thai while empowering individuals to forge
                      their own path, elevating both body and mind through disciplined training.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-8">
              <motion.button
                onClick={() => setShowSocialModal(true)}
                className="backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 text-left bg-white/30 border-orange-500/20 hover:border-orange-500/40 dark:bg-black/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/10 dark:bg-orange-500/20">
                    <MessageCircle className="w-6 h-6 text-orange-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-orange-600 dark:text-amber-400">
                      DM Us On Socials
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {"We'll respond within 12 hours."}
                    </p>
                  </div>
                </div>
              </motion.button>

              <motion.a
                href="mailto:help@muaythaipai.com"
                className="backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 bg-white/30 border-orange-500/20 hover:border-orange-500/40 dark:bg-black/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/10 dark:bg-orange-500/20">
                    <Mail className="w-6 h-6 text-orange-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-orange-600 dark:text-amber-400">
                      Email Us
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">help@muaythaipai.com</p>
                  </div>
                </div>
              </motion.a>

              <motion.a
                href="https://maps.app.goo.gl/a3beanCSTPSnUKaUA"
                target="_blank"
                rel="noopener noreferrer"
                className="backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 bg-white/30 border-orange-500/20 hover:border-orange-500/40 dark:bg-black/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/10 dark:bg-orange-500/20">
                    <MapPin className="w-6 h-6 text-orange-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-orange-600 dark:text-amber-400">
                      Visit Us
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Pai, Mae Hong Son, Thailand
                    </p>
                  </div>
                </div>
              </motion.a>
            </div>
          </motion.div>
        </div>

        <MarketingBottomNav active="contact" />
      </motion.div>

      {showSocialModal && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowSocialModal(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="social-modal-title"
            className="relative max-w-md w-full mx-4 rounded-2xl p-6 bg-white border border-orange-500/20 dark:bg-neutral-900"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSocialModal(false)}
              aria-label="Close social links dialog"
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <h3 id="social-modal-title" className="text-2xl font-bold mb-6 text-orange-600 dark:text-amber-400">
              Message Us On Socials
            </h3>

            <div className="space-y-3">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border transition-colors bg-black/5 border-black/10 hover:bg-black/10 hover:border-orange-500/40 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                <div className="p-3 rounded-full bg-orange-500/10 dark:bg-orange-500/20">
                  <InstagramIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Instagram</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@muaythaipai</p>
                </div>
              </a>

              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border transition-colors bg-black/5 border-black/10 hover:bg-black/10 hover:border-orange-500/40 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                <div className="p-3 rounded-full bg-orange-500/10 dark:bg-orange-500/20">
                  <FacebookIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Facebook</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Muay Thai Pai</p>
                </div>
              </a>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              We typically respond within 12 hours
            </p>
          </motion.div>
        </motion.div>
      )}
    </PageBackground>
  )
}
