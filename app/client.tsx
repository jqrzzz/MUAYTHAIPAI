"use client"

import React, { type ReactElement, useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import {
  Heart,
  MessageCircle,
  Share2,
  User,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  ChevronDown,
  Maximize,
  Minimize,
  X,
  BoxIcon as Boxing,
  Dumbbell,
  Menu,
  ChevronUp,
  MapPin,
  Star,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import Link from "next/link"
import { MoreMenu } from "@/components/more-menu"
import { BookingSection } from "@/components/booking-section"
import { PlatformCtaSection } from "@/components/platform-cta-section"
import { SOCIAL_LINKS } from "@/lib/socials"
import { familyMembers } from "@/lib/family-data"

const StudentHighlights = dynamic(
  () => import("@/components/student-highlights").then((mod) => ({ default: mod.StudentHighlights })),
  {
    loading: () => null,
  },
)

const GymLocation = dynamic(() => import("@/components/gym-location").then((mod) => ({ default: mod.GymLocation })), {
  loading: () => null,
})

export function ClientPage(): ReactElement {
  const [selectedMember, setSelectedMember] = useState<number | null>(null)
  const [muted, setMuted] = useState(true)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentDesktopSlide, setCurrentDesktopSlide] = useState(0)
  const totalDesktopSlides = Math.ceil(familyMembers.length / 4)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showFamilyOverlay, setShowFamilyOverlay] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [showFavicon, setShowFavicon] = useState(true)

  const carouselRef = useRef<HTMLDivElement>(null)

  // Check if mobile/tablet
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    setMounted(true)

    const checkDeviceSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    checkDeviceSize()
    window.addEventListener("resize", checkDeviceSize)

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    const faviconTimer = setTimeout(() => {
      setShowFavicon(false)
    }, 1500)

    return () => {
      window.removeEventListener("resize", checkDeviceSize)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      clearTimeout(faviconTimer)
    }
  }, [])

  // Enhanced toggle function with better UX
  const handleProfileClick = (memberId: number) => {
    if (selectedMember === memberId) {
      setSelectedMember(null)
    } else {
      setSelectedMember(memberId)
    }
  }

  const closeProfile = () => {
    setSelectedMember(null)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const toggleMute = () => {
    const newMutedState = !muted
    setMuted(newMutedState)

    // Send message to iframe to sync state
    const iframe = document.querySelector("iframe")
    if (iframe && iframe.contentWindow) {
      const command = newMutedState ? "mute" : "unMute"
      iframe.contentWindow.postMessage(`{"event":"command","func":"${command}","args":""}`, "*")
    }
  }

  const handleFullscreenToggle = () => {
    const iframe = document.querySelector("iframe")
    if (iframe) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        iframe.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
      }
    }
  }

  // Toggle More menu
  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu)
  }

  // Function to start video with sound - REQUIRES USER INTERACTION
  const startVideoWithSound = () => {
    setShowWelcome(false)

    // Only unmute on desktop - mobile/tablet browsers block autoplay with sound
    if (!isMobile && !isTablet) {
      setMuted(false)

      // Send unmute command to iframe
      const iframe = document.querySelector("iframe")
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', "*")
      }
    }
    // On mobile/tablet, video stays muted - users can manually unmute via button
  }

  // Navigation handlers for desktop carousel
  const handlePrevDesktopSlide = () => {
    setCurrentDesktopSlide((prev) => Math.max(prev - 1, 0))
  }

  const handleNextDesktopSlide = () => {
    setCurrentDesktopSlide((prev) => Math.min(prev + 1, totalDesktopSlides - 1))
  }

  if (!mounted) {
    return null
  }

  return (
    <div
      className={`overflow-x-hidden relative transition-all duration-500 ${
        theme === "dark"
          ? "bg-gradient-to-b from-black via-neutral-900 to-black"
          : "bg-gradient-to-b from-neutral-100 via-white to-neutral-50"
      }`}
    >
      {/* Video Section - Optimized for all devices */}
      <div className="relative w-full h-screen">
        {/* Video poster/placeholder while loading */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            mounted ? "opacity-0" : "opacity-100"
          }`}
          style={{
            backgroundImage: `url('https://i.ytimg.com/vi/ldoymhY6Xzc/maxresdefault.jpg')`,
          }}
        />

        {/* Optimized YouTube Video */}
        <iframe
          className="w-full h-full object-cover"
          src={`https://www.youtube-nocookie.com/embed/ldoymhY6Xzc?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=ldoymhY6Xzc&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&cc_load_policy=0&fs=1&disablekb=1&preload=metadata&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="eager"
          title="Muay Thai Pai - Traditional Thai Boxing Training Documentary"
        />

        <AnimatePresence>
          {showFavicon && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center"
            >
              <motion.img
                src="/favicon.ico"
                alt="Muay Thai Pai logo - Wisarut Family traditional Thai boxing gym in Pai, Thailand"
                className="w-24 h-24 md:w-32 md:h-32"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome Message Overlay - REQUIRES USER CLICK TO DISMISS */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center"
              onClick={startVideoWithSound}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative max-w-xl mx-4 -translate-y-[15%]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Radiating Border Effect - Rich Jade Green Marble */}
                <div className="absolute inset-0 rounded-3xl">
                  <motion.div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-900"
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0.4, 0.6, 0.4],
                    }}
                    transition={{
                      duration: 3,
                      ease: "easeInOut",
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-r from-teal-800 via-emerald-800 to-green-900"
                    animate={{
                      scale: [1.02, 1, 1.02],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 4,
                      ease: "easeInOut",
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                      delay: 0.5,
                    }}
                  />
                </div>

                {/* Main Content Container - Dark Glassmorphic Effect with Jade Green accent */}
                <div
                  className={`relative p-4 md:p-10 rounded-3xl text-center scale-[0.85] ${
                    theme === "dark"
                      ? "bg-neutral-900/70 border border-emerald-700/30"
                      : "bg-neutral-800/60 border border-emerald-600/40"
                  } backdrop-blur-2xl shadow-2xl`}
                  style={{
                    boxShadow:
                      theme === "dark"
                        ? "0 8px 32px 0 rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                        : "0 8px 32px 0 rgba(5, 150, 105, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {/* Close Button - Clean X */}
                  <button
                    onClick={startVideoWithSound}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 transition-all duration-300 min-h-[44px] min-w-[44px] group relative z-10"
                    aria-label="Close welcome message and start video with sound"
                  >
                    <X className="w-7 h-7 text-white hover:text-emerald-400 transition-colors drop-shadow-lg font-bold stroke-[3]" />
                  </button>

                  {/* Welcome Content */}
                  <div className="space-y-4 md:space-y-8">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-1.5"
                    >
                      <h1 className="text-3xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">
                        Sawasdee! :D
                      </h1>
                      <p className="text-lg md:text-2xl font-medium text-white drop-shadow-md">Welcome to our home</p>
                      <div className="w-20 h-1 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                    </motion.div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm md:text-lg leading-relaxed"
                    >
                      <div className="space-y-3 max-w-md mx-auto">
                        <div className="flex items-start gap-3 group">
                          <span className="text-xl flex-shrink-0 mt-0.5">🏠</span>
                          <div className="text-left">
                            <p className="font-semibold text-white group-hover:text-emerald-300 transition-colors text-sm md:text-base">
                              Local Pai Family Gym
                            </p>
                            <p className="text-xs md:text-sm text-gray-300">3rd generation, locally owned</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 group">
                          <span className="text-xl flex-shrink-0 mt-0.5">🥊</span>
                          <div className="text-left">
                            <p className="font-semibold text-white group-hover:text-emerald-300 transition-colors text-sm md:text-base">
                              Traditional Muay Thai
                            </p>
                            <p className="text-xs md:text-sm text-gray-300">
                              Learn the authentic art from local masters
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 group">
                          <span className="text-xl flex-shrink-0 mt-0.5">❤️</span>
                          <div className="text-left">
                            <p className="font-semibold text-white group-hover:text-emerald-300 transition-colors text-sm md:text-base">
                              Real Family, Real Training
                            </p>
                            <p className="text-xs md:text-sm text-gray-300">Not perfect, but family 😂</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <button
                        onClick={startVideoWithSound}
                        className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-700 text-white px-6 md:px-10 py-3 md:py-5 rounded-2xl font-semibold text-sm md:text-lg hover:from-emerald-800 hover:via-teal-800 hover:to-emerald-800 transition-all duration-300 shadow-2xl hover:shadow-emerald-500/30 transform hover:scale-105 hover:-translate-y-1 group"
                        style={{
                          boxShadow: "0 10px 40px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
                        }}
                      >
                        <span className="group-hover:tracking-wide transition-all">Start Your Experience</span>
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive overlay for better mobile visibility */}
        <div
          className={`absolute inset-0 ${
            theme === "dark"
              ? isMobile
                ? "bg-black/15"
                : isTablet
                  ? "bg-black/25"
                  : "bg-black/40"
              : isMobile
                ? "bg-black/10"
                : isTablet
                  ? "bg-black/20"
                  : "bg-black/30"
          }`}
        />

        {/* Dynamic Gradient Overlay */}
        <div
          className={`absolute inset-0 z-10 ${
            theme === "dark"
              ? "bg-gradient-to-br from-orange-600/25 via-transparent to-amber-600/20"
              : "bg-gradient-to-br from-orange-700/30 via-transparent to-orange-600/25"
          }`}
        />

        {/* Top Navigation with Social Icons - Responsive sizing */}
        <motion.div
          className={`absolute ${
            isMobile ? "top-2 left-2" : isTablet ? "top-3 left-3" : "top-4 left-4"
          } z-50 flex gap-2`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={`backdrop-blur-md rounded-full ${
              isMobile ? "p-2" : isTablet ? "p-2.5" : "p-3"
            } border transition-colors ${
              theme === "dark"
                ? "bg-white/10 border-white/20 hover:bg-white/20"
                : "bg-black/10 border-black/20 hover:bg-black/20"
            }`}
            aria-label="Follow us on Instagram"
          >
            <svg
              className={`${
                isMobile ? "w-4 h-4" : isTablet ? "w-4.5 h-4.5" : "w-5 h-5"
              } ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92.058-1.265.07-1.644.07-4.849 0-3.204.013-3.583.072-4.948.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          <a
            href={SOCIAL_LINKS.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className={`backdrop-blur-md rounded-full ${
              isMobile ? "p-2" : isTablet ? "p-2.5" : "p-3"
            } border transition-colors ${
              theme === "dark"
                ? "bg-white/10 border-white/20 hover:bg-white/20"
                : "bg-black/10 border-black/20 hover:bg-black/20"
            }`}
            aria-label="Follow us on Facebook"
          >
            <svg
              className={`${
                isMobile ? "w-4 h-4" : isTablet ? "w-4.5 h-4.5" : "w-5 h-5"
              } ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          <a
            href={SOCIAL_LINKS.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className={`backdrop-blur-md rounded-full ${
              isMobile ? "p-2" : isTablet ? "p-2.5" : "p-3"
            } border transition-colors ${
              theme === "dark"
                ? "bg-white/10 border-white/20 hover:bg-white/20"
                : "bg-black/10 border-black/20 hover:bg-black/20"
            }`}
            aria-label="Follow us on TikTok"
          >
            <svg
              className={`${
                isMobile ? "w-4 h-4" : isTablet ? "w-4.5 h-4.5" : "w-5 h-5"
              } ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
          </a>
          <a
            href="https://maps.app.goo.gl/vud6badgg3uqsTVF7"
            target="_blank"
            rel="noopener noreferrer"
            className={`backdrop-blur-md rounded-full ${
              isMobile ? "p-2" : isTablet ? "p-2.5" : "p-3"
            } border transition-colors ${
              theme === "dark"
                ? "bg-white/10 border-white/20 hover:bg-white/20"
                : "bg-black/10 border-black/20 hover:bg-black/20"
            }`}
            aria-label="Find us on Google Maps"
          >
            <MapPin
              className={`${
                isMobile ? "w-4 h-4" : isTablet ? "w-4.5 h-4.5" : "w-5 h-5"
              } ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`}
            />
          </a>
          <a
            href="https://www.tripadvisor.com/Attraction_Review-g303916-d11796232-Reviews-Muay_Thai_Pai-Pai_Mae_Hong_Son_Province.html"
            target="_blank"
            rel="noopener noreferrer"
            className={`backdrop-blur-md rounded-full ${
              isMobile ? "p-2" : isTablet ? "p-2.5" : "p-3"
            } border transition-colors ${
              theme === "dark"
                ? "bg-white/10 border-white/20 hover:bg-white/20"
                : "bg-black/10 border-black/20 hover:bg-black/20"
            }`}
            aria-label="Read our TripAdvisor reviews"
          >
            <Star
              className={`${
                isMobile ? "w-4 h-4" : isTablet ? "w-4.5 h-4.5" : "w-5 h-5"
              } ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`}
            />
          </a>
        </motion.div>

        {/* National Geographic Badge - Responsive positioning */}
        <motion.div
          className={`absolute ${isMobile ? "top-16 left-2" : isTablet ? "top-18 left-3" : "top-20 left-4"} z-50`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <a
            href="https://www.nationalgeographic.com/culture/article/one-mans-fight-to-save-traditional-muay-thai-boxing"
            target="_blank"
            rel="noopener noreferrer"
            className={`block backdrop-blur-xl rounded-lg ${
              isMobile ? "px-3 py-2" : isTablet ? "px-3.5 py-2.5" : "px-4 py-3"
            } border transition-all duration-300 hover:scale-105 shadow-lg ${
              theme === "dark"
                ? "bg-black/20 border-white/20 hover:bg-black/30"
                : "bg-white/30 border-gray-200/40 hover:bg-white/40"
            }`}
          >
            <div className="flex flex-row items-center gap-3">
              <img
                src="/images/natgeo-logo.png"
                alt="National Geographic"
                className={`${isMobile ? "h-5" : isTablet ? "h-6" : "h-7"} w-auto ${
                  theme === "dark"
                    ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                    : "drop-shadow-[0_0_6px_rgba(217,119,6,0.4)]"
                }`}
              />
              <span
                className={`${
                  isMobile ? "text-xs" : isTablet ? "text-sm" : "text-sm"
                } font-semibold whitespace-nowrap ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                Watch Full Episode
              </span>
            </div>
          </a>
        </motion.div>

        {/* Top Navigation - Theme & Mute - Responsive */}
        <motion.div
          className={`absolute ${
            isMobile ? "top-2 right-2" : isTablet ? "top-3 right-3" : "top-4 right-4"
          } z-50 flex gap-2`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={toggleTheme}
            className={`backdrop-blur-md rounded-full ${
              isMobile ? "p-2" : isTablet ? "p-2.5" : "p-3"
            } border transition-colors ${
              theme === "dark"
                ? "bg-white/10 border-white/20 hover:bg-white/20"
                : "bg-black/10 border-black/20 hover:bg-black/20"
            }`}
            aria-label="Toggle dark/light theme"
          >
            {theme === "dark" ? (
              <Sun className={`${isMobile ? "w-4 h-4" : isTablet ? "w-4.5 h-4.5" : "w-5 h-5"} text-amber-400`} />
            ) : (
              <Moon className={`${isMobile ? "w-4 h-4" : isTablet ? "w-4.5 h-4.5" : "w-5 h-5"} text-orange-600`} />
            )}
          </button>
          <button
            onClick={toggleMute}
            className={`backdrop-blur-md rounded-full ${
              isMobile ? "p-2" : isTablet ? "p-2.5" : "p-3"
            } border transition-colors ${
              theme === "dark"
                ? "bg-white/10 border-white/20 hover:bg-white/20"
                : "bg-black/10 border-black/20 hover:bg-black/20"
            }`}
            aria-label={muted ? "Unmute video" : "Mute video"}
          >
            {muted ? (
              <VolumeX
                className={`${isMobile ? "w-4 h-4" : isTablet ? "w-4.5 h-4.5" : "w-5 h-5"} ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`}
              />
            ) : (
              <Volume2
                className={`${isMobile ? "w-4 h-4" : isTablet ? "w-4.5 h-4.5" : "w-5 h-5"} ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`}
              />
            )}
          </button>
        </motion.div>

        {/* Mobile/Tablet Fullscreen Button */}
        {(isMobile || isTablet) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`absolute ${isMobile ? "bottom-20 right-4" : "bottom-24 right-6"} z-30 flex flex-col gap-2`}
          >
            <button
              onClick={handleFullscreenToggle}
              className={`backdrop-blur-md bg-black/50 rounded-full ${
                isMobile ? "p-3" : "p-4"
              } text-white border border-white/20 shadow-lg transition-all duration-200 hover:bg-black/60`}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className={`${isMobile ? "w-5 h-5" : "w-6 h-6"}`} />
              ) : (
                <Maximize className={`${isMobile ? "w-5 h-5" : "w-6 h-6"}`} />
              )}
            </button>
            {isFullscreen && (
              <button
                onClick={toggleMute}
                className={`backdrop-blur-md bg-black/50 rounded-full ${
                  isMobile ? "p-3" : "p-4"
                } text-white border border-white/20 shadow-lg transition-all duration-200 hover:bg-black/60`}
                aria-label={muted ? "Unmute video" : "Mute video"}
              >
                {muted ? (
                  <VolumeX className={`${isMobile ? "w-5 h-5" : "w-6 h-6"}`} />
                ) : (
                  <Volume2 className={`${isMobile ? "w-5 h-5" : "w-6 h-6"}`} />
                )}
              </button>
            )}
          </motion.div>
        )}

        {/* Mobile Family Button */}
        {isMobile && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            onClick={() => setShowFamilyOverlay(true)}
            className={`fixed bottom-24 left-4 z-40 backdrop-blur-md rounded-full px-4 py-3 border shadow-lg transition-all duration-300 min-h-[48px] ${
              theme === "dark"
                ? "bg-orange-500/90 border-orange-400/50 text-white"
                : "bg-orange-500/90 border-orange-400/50 text-white"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="View family members"
          >
            <span className="font-medium">Meet the Fam</span>
          </motion.button>
        )}

        {/* Tablet Family Button */}
        {isTablet && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            onClick={() => setShowFamilyOverlay(true)}
            className={`fixed bottom-28 left-6 z-40 backdrop-blur-md rounded-full px-5 py-3.5 border shadow-lg transition-all duration-300 min-h-[52px] ${
              theme === "dark"
                ? "bg-orange-500/90 border-orange-400/50 text-white"
                : "bg-orange-500/90 border-orange-400/50 text-white"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="View family members"
          >
            <span className="font-medium text-lg">Meet the Fam</span>
          </motion.button>
        )}

        {/* Scroll indicator - responsive */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1 }}
          className={`absolute ${
            isMobile ? "bottom-8" : isTablet ? "bottom-10" : "bottom-8"
          } left-1/2 -translate-x-1/2 z-30`}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className={`flex flex-col items-center gap-2 ${theme === "dark" ? "text-white/60" : "text-black/60"}`}
          >
            <span className={`${isMobile ? "text-sm" : "text-base"} font-medium`}>Scroll to explore</span>
            <ChevronDown className={`${isMobile ? "w-5 h-5" : "w-6 h-6"}`} />
          </motion.div>
        </motion.div>
      </div>

      {/* Mobile/Tablet Family Overlay */}
      <AnimatePresence>
        {showFamilyOverlay && (isMobile || isTablet) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
            onClick={() => setShowFamilyOverlay(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`absolute inset-x-0 bottom-0 rounded-t-3xl ${
                isMobile ? "p-6" : "p-8"
              } max-h-[85vh] overflow-y-auto ${theme === "dark" ? "bg-neutral-900" : "bg-white"}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                >
                  Meet Our Family
                </h2>
                <button
                  onClick={() => setShowFamilyOverlay(false)}
                  className={`rounded-full p-2 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center ${
                    theme === "dark"
                      ? "bg-white/10 text-gray-300 hover:bg-white/20"
                      : "bg-black/5 text-gray-600 hover:bg-black/10"
                  }`}
                  aria-label="Close family overlay"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Family Grid - Responsive */}
              <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-3"} gap-4`}>
                {familyMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${isMobile ? "p-4" : "p-5"} rounded-2xl cursor-pointer transition-all duration-300 min-h-[120px] ${
                      selectedMember === member.id
                        ? theme === "dark"
                          ? "bg-orange-500/20 border-2 border-orange-400"
                          : "bg-orange-50 border-2 border-orange-400"
                        : theme === "dark"
                          ? "bg-white/5 hover:bg-white/10"
                          : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => handleProfileClick(member.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-center">
                      <div className={`relative mx-auto ${isMobile ? "w-16 h-16" : "w-20 h-20"} mb-3`}>
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600"
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: selectedMember === member.id ? [0.6, 0.8, 0.6] : [0.4, 0.6, 0.4],
                          }}
                          transition={{
                            duration: 3,
                            ease: "easeInOut",
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                          }}
                        />
                        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center z-10 shadow-lg">
                          {member.image ? (
                            <img
                              src={member.image || "/placeholder.svg"}
                              alt={`${member.name}'s profile photo`}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <User className={`text-white ${isMobile ? "w-8 h-8" : "w-10 h-10"}`} />
                          )}
                        </div>
                      </div>
                      <h4
                        className={`font-semibold ${isMobile ? "text-sm" : "text-base"} mb-1 ${
                          theme === "dark" ? "text-white" : "text-gray-800"
                        } ${selectedMember === member.id ? "text-orange-500" : ""}`}
                      >
                        {member.name}
                      </h4>
                      <p className={`text-orange-500 ${isMobile ? "text-xs" : "text-sm"} leading-tight`}>
                        {member.role}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Selected Member Details */}
              <AnimatePresence>
                {selectedMember && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`mt-6 ${isMobile ? "p-4" : "p-6"} rounded-2xl ${theme === "dark" ? "bg-white/5" : "bg-gray-50"}`}
                  >
                    {(() => {
                      const member = familyMembers.find((m) => m.id === selectedMember)
                      if (!member) return null

                      return (
                        <div>
                          <h3
                            className={`${isMobile ? "text-lg" : "text-xl"} font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                          >
                            {member.name}
                          </h3>
                          <p className={`text-orange-500 font-semibold mb-3 ${isMobile ? "text-sm" : "text-base"}`}>
                            {member.role}
                          </p>
                          <p
                            className={`${isMobile ? "text-sm" : "text-base"} leading-relaxed ${
                              theme === "dark" ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {member.description}
                          </p>
                        </div>
                      )
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Profile Sidebar */}
      {!isMobile && !isTablet && (
        <motion.div
          className="fixed right-4 top-1/4 -translate-y-1/2 z-40 w-20"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            opacity: { duration: 1, ease: "easeInOut" },
            x: { delay: 2, duration: 1 },
          }}
        >
          {totalDesktopSlides > 1 && (
            <div className="flex flex-col items-center mb-3">
              <button
                onClick={handlePrevDesktopSlide}
                className={`backdrop-blur-md rounded-full p-2 border transition-colors min-h-[44px] min-w-[44px] ${
                  theme === "dark"
                    ? "bg-white/10 border-white/20 hover:bg-white/20"
                    : "bg-black/10 border-black/20 hover:bg-black/20"
                }`}
                aria-label="Previous family members"
              >
                <ChevronUp className={`w-5 h-5 ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`} />
              </button>
            </div>
          )}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {familyMembers.slice(currentDesktopSlide * 4, currentDesktopSlide * 4 + 4).map((member, index) => (
                <motion.div
                  key={`${member.id}-${currentDesktopSlide}`}
                  className={`text-center cursor-pointer transition-all duration-300 ${
                    selectedMember === member.id ? "transform scale-105" : ""
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleProfileClick(member.id)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="relative mx-auto w-16 h-16 mb-3">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600"
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity:
                          selectedMember === member.id || selectedMember === null
                            ? [0.4, 0.7, 0.4]
                            : theme === "dark"
                              ? 0.2
                              : 0.4,
                      }}
                      transition={{
                        duration: 4,
                        ease: "easeInOut",
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                      }}
                    />
                    <div
                      className={`relative w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center border-2 z-10 ${
                        selectedMember === member.id
                          ? "border-orange-400 shadow-lg shadow-orange-400/50"
                          : theme === "dark"
                            ? "border-white/20"
                            : "border-gray-300"
                      }`}
                    >
                      {member.image ? (
                        <img
                          src={member.image || "/placeholder.svg"}
                          alt={`${member.name}'s profile photo`}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="text-white w-6 h-6" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4
                      className={`font-semibold text-xs ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      } ${selectedMember === member.id ? "text-orange-400" : ""}`}
                    >
                      {member.name}
                    </h4>
                    <p className="text-orange-500 leading-tight text-xs">{member.role}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {totalDesktopSlides > 1 && (
            <div className="flex flex-col items-center mt-3">
              <button
                onClick={handleNextDesktopSlide}
                className={`backdrop-blur-md rounded-full p-2 border transition-colors min-h-[44px] min-w-[44px] ${
                  theme === "dark"
                    ? "bg-white/10 border-white/20 hover:bg-white/20"
                    : "bg-black/10 border-black/20 hover:bg-black/20"
                }`}
                aria-label="Next family members"
              >
                <ChevronDown className={`w-5 h-5 ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`} />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Content Section */}
      <div
        className={`py-16 ${
          theme === "dark" ? "bg-gradient-to-b from-black/95 to-black" : "bg-gradient-to-b from-white/95 to-white"
        }`}
      >
        <div className={`max-w-4xl mx-auto ${isMobile ? "px-4" : isTablet ? "px-6" : "px-4"} text-center space-y-12`}>
          <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            <p className="mb-2">Explore more:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/classes" className="text-primary underline-offset-4 hover:underline">
                Classes & Pricing
              </Link>
              <Link href="/train-and-stay" className="text-primary underline-offset-4 hover:underline">
                Train & Stay Packages
              </Link>
              <Link href="/gym" className="text-primary underline-offset-4 hover:underline">
                Our Gym
              </Link>
            </div>
          </div>
          <BookingSection />
          <StudentHighlights />
          <GymLocation />
        </div>
      </div>

      {/* Desktop Profile Expanded View */}
      <AnimatePresence>
        {selectedMember && !isMobile && !isTablet && (
          <motion.div
            className={`fixed right-28 top-1/4 -translate-y-1/2 z-50 w-[400px] backdrop-blur-md rounded-2xl p-6 border ${
              theme === "dark" ? "bg-white/5 border-white/10" : "bg-white/40 border-gray-300"
            }`}
          >
            {(() => {
              const member = familyMembers.find((m) => m.id === selectedMember)
              if (!member) return null

              return (
                <>
                  <button
                    onClick={closeProfile}
                    className={`absolute top-3 right-3 rounded-full p-1 transition-colors min-h-[32px] min-w-[32px] ${
                      theme === "dark"
                        ? "bg-white/10 text-gray-300 hover:bg-white/20"
                        : "bg-black/5 text-gray-600 hover:bg-black/10"
                    }`}
                    aria-label="Close profile"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="relative w-20 h-20">
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600"
                          animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.4, 0.7, 0.4],
                          }}
                          transition={{
                            duration: 4,
                            ease: "easeInOut",
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "reverse",
                          }}
                        />
                        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center z-10 shadow-lg shadow-orange-400/50">
                          {member.image ? (
                            <img
                              src={member.image || "/placeholder.svg"}
                              alt={`${member.name}'s profile photo`}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <User className="text-white w-10 h-10" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-1 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                        {member.name}
                      </h3>
                      <p className="text-orange-500 font-semibold mb-2">{member.role}</p>
                      <p
                        className={`leading-relaxed mb-3 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {member.description}
                      </p>
                      <div className="flex gap-3">
                        <button
                          className={`flex items-center gap-2 text-sm hover:text-orange-400 transition-colors min-h-[32px] ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                          aria-label="Like this profile"
                        >
                          <Heart className="w-4 h-4" />
                          <span>3,847</span>
                        </button>
                        <button
                          className={`flex items-center gap-2 text-sm hover:text-orange-400 transition-colors min-h-[32px] ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                          aria-label="Send message"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Message</span>
                        </button>
                        <button
                          className={`flex items-center gap-2 text-sm hover:text-orange-400 transition-colors min-h-[32px] ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                          aria-label="Share profile"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>
                      <p className={`text-xs mt-2 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                        Click {member.name} again to close
                      </p>
                    </div>
                  </div>
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform Network CTA */}
      <PlatformCtaSection />

      {/* Bottom Navigation - Responsive */}
      <motion.div
        className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t ${
          theme === "dark" ? "bg-black/80 border-white/10" : "bg-white/90 border-gray-200"
        }`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <div className={`flex justify-around ${isMobile ? "py-3 px-4" : isTablet ? "py-4 px-6" : "py-3 px-4"}`}>
          {[
            { icon: Heart, label: "Home", active: true, href: "/" },
            { icon: Boxing, label: "Classes", href: "/classes" },
            { icon: Dumbbell, label: "Gym", href: "/gym" },
            { icon: MessageCircle, label: "Contact", href: "/contact" },
            { icon: Menu, label: "More", isButton: true },
          ].map((item) =>
            item.isButton ? (
              <motion.button
                key={item.label}
                onClick={toggleMoreMenu}
                className={`flex flex-col items-center gap-1 min-h-[48px] min-w-[48px] justify-center ${
                  item.active ? "text-orange-500" : theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Open more menu"
              >
                {React.createElement(item.icon, {
                  className: `${isMobile ? "w-5 h-5" : isTablet ? "w-6 h-6" : "w-5 h-5"}`,
                })}
                <span className={`${isMobile ? "text-xs" : isTablet ? "text-sm" : "text-xs"} font-medium`}>
                  {item.label}
                </span>
              </motion.button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center gap-1 min-h-[48px] min-w-[48px] justify-center ${
                  item.active ? "text-orange-500" : theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
                aria-label={`Go to ${item.label} page`}
              >
                {React.createElement(item.icon, {
                  className: `${isMobile ? "w-5 h-5" : isTablet ? "w-6 h-6" : "w-5 h-5"}`,
                })}
                <span className={`${isMobile ? "text-xs" : isTablet ? "text-sm" : "text-xs"} font-medium`}>
                  {item.label}
                </span>
              </Link>
            ),
          )}
        </div>
      </motion.div>

      <MoreMenu isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} />
    </div>
  )
}
