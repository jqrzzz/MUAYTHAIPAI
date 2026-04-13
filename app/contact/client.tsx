"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

import { motion } from "framer-motion"
import {
  ArrowLeft,
  Moon,
  Sun,
  Heart,
  MessageCircle,
  Mail,
  MapPin,
  BoxIcon as Boxing,
  Dumbbell,
  Menu,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { MoreMenu } from "@/components/more-menu"
import { cn } from "@/lib/utils"
import { BookingSection } from "@/components/booking-section"
import { SOCIAL_LINKS } from "@/lib/socials"
import { InstagramIcon, FacebookIcon } from "@/components/social-icons"

export default function ContactClient() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showMissionText, setShowMissionText] = useState(false)
  const [showSocialModal, setShowSocialModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null)

  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch("/api/send-contact-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus("success")
        setFormData({ name: "", email: "", phone: "", message: "" })
        setTimeout(() => setSubmitStatus(null), 5000)
      } else {
        setSubmitStatus("error")
        setTimeout(() => setSubmitStatus(null), 5000)
      }
    } catch (error) {
      console.error("[v0] Contact form submission error:", error)
      setSubmitStatus("error")
      setTimeout(() => setSubmitStatus(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen overflow-hidden relative transition-all duration-500 bg-gradient-to-b from-neutral-100 via-white to-neutral-50 dark:from-black dark:via-neutral-900 dark:to-black">
      <h1 className="sr-only">Contact Muay Thai Pai</h1>

      <div className="absolute inset-0 z-10 bg-gradient-to-br from-orange-500/20 via-transparent to-orange-400/15 dark:from-orange-600/25 dark:to-amber-600/20" />

      <motion.div
        key="contact-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-20 min-h-screen"
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
              className="backdrop-blur-md rounded-full p-3 border transition-colors bg-black/10 border-black/20 hover:bg-black/20 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5 text-orange-600 dark:text-amber-400" />
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
              { icon: MessageCircle, label: "Contact", active: true, href: "/contact" },
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
                  className={`flex flex-col items-center gap-1 ${
                    item.active ? "text-orange-500" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              ),
            )}
          </div>
        </motion.div>
      </motion.div>

      {showSocialModal && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowSocialModal(false)}
        >
          <motion.div
            className="relative max-w-md w-full mx-4 rounded-2xl p-6 bg-white border border-orange-500/20 dark:bg-neutral-900"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSocialModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <h3 className="text-2xl font-bold mb-6 text-orange-600 dark:text-amber-400">
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

      <MoreMenu isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} />
    </div>
  )
}
