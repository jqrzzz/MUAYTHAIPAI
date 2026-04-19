"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Volume2, VolumeX, MapPin, Star } from "lucide-react"
import { motion } from "framer-motion"
import { SOCIAL_LINKS } from "@/lib/socials"
import { InstagramIcon, FacebookIcon } from "@/components/social-icons"

interface SiteHeaderProps {
  hideSoundButton?: boolean
}

export function SiteHeader({ hideSoundButton = false }: SiteHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [muted, setMuted] = useState(true) // Assuming default muted state
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const toggleMute = () => {
    setMuted(!muted)
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Top Navigation with Social Icons */}
      <motion.div
        className={`fixed ${isMobile ? "top-2 left-2" : "top-4 left-4"} z-50 flex gap-2`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <a
          href={SOCIAL_LINKS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center backdrop-blur-md rounded-full ${isMobile ? "p-2" : "p-3"} border transition-colors ${
            theme === "dark"
              ? "bg-white/10 border-white/20 hover:bg-white/20"
              : "bg-black/10 border-black/20 hover:bg-black/20"
          }`}
          aria-label="Instagram"
        >
          <InstagramIcon className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
        </a>
        <a
          href={SOCIAL_LINKS.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center backdrop-blur-md rounded-full ${isMobile ? "p-2" : "p-3"} border transition-colors ${
            theme === "dark"
              ? "bg-white/10 border-white/20 hover:bg-white/20"
              : "bg-black/10 border-black/20 hover:bg-black/20"
          }`}
          aria-label="Facebook"
        >
          <FacebookIcon className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
        </a>
        <a
          href={SOCIAL_LINKS.maps}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center backdrop-blur-md rounded-full ${isMobile ? "p-2" : "p-3"} border transition-colors ${
            theme === "dark"
              ? "bg-white/10 border-white/20 hover:bg-white/20"
              : "bg-black/10 border-black/20 hover:bg-black/20"
          }`}
          aria-label="Google Maps"
        >
          <MapPin className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
        </a>
        <a
          href={SOCIAL_LINKS.tripAdvisor}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center backdrop-blur-md rounded-full ${isMobile ? "p-2" : "p-3"} border transition-colors ${
            theme === "dark"
              ? "bg-white/10 border-white/20 hover:bg-white/20"
              : "bg-black/10 border-black/20 hover:bg-black/20"
          }`}
          aria-label="TripAdvisor"
        >
          <Star className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
        </a>
      </motion.div>

      {/* Top Navigation - Theme & Mute */}
      <motion.div
        className={`fixed ${isMobile ? "top-2 right-2" : "top-4 right-4"} z-50 flex gap-2`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={toggleTheme}
          className={`flex items-center justify-center backdrop-blur-md rounded-full ${isMobile ? "p-2" : "p-3"} border transition-colors ${
            theme === "dark"
              ? "bg-white/10 border-white/20 hover:bg-white/20"
              : "bg-black/10 border-black/20 hover:bg-black/20"
          }`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
          ) : (
            <Moon className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
          )}
        </button>
        {!hideSoundButton && (
          <button
            onClick={toggleMute}
            className={`flex items-center justify-center backdrop-blur-md rounded-full ${isMobile ? "p-2" : "p-3"} border transition-colors ${
              theme === "dark"
                ? "bg-white/10 border-white/20 hover:bg-white/20"
                : "bg-black/10 border-black/20 hover:bg-black/20"
            }`}
            aria-label="Toggle sound"
          >
            {muted ? (
              <VolumeX className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
            ) : (
              <Volume2 className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
            )}
          </button>
        )}
      </motion.div>
    </>
  )
}
