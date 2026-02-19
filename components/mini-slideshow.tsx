"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"

interface MiniSlideshowProps {
  images: Array<{ src: string; alt: string } | string>
  autoPlay?: boolean
  interval?: number
}

export function MiniSlideshow({ images, autoPlay = true, interval = 4000 }: MiniSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  // Normalize images to always have src and alt
  const normalizedImages = images.map((img) => (typeof img === "string" ? { src: img, alt: "Slideshow image" } : img))

  useEffect(() => {
    if (!autoPlay) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % normalizedImages.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, normalizedImages.length])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? normalizedImages.length - 1 : prevIndex - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % normalizedImages.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden flex items-center justify-center">
      {/* Main Image Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Image
              src={normalizedImages[currentIndex].src || "/placeholder.svg"}
              alt={normalizedImages[currentIndex].alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              loading="lazy"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full backdrop-blur-md transition-all duration-200 touch-manipulation ${
          resolvedTheme === "dark"
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-black/20 hover:bg-black/30 text-white"
        }`}
        aria-label="Previous image"
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <button
        onClick={goToNext}
        className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full backdrop-blur-md transition-all duration-200 touch-manipulation ${
          resolvedTheme === "dark"
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-black/20 hover:bg-black/30 text-white"
        }`}
        aria-label="Next image"
      >
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 md:gap-2 z-10">
        {normalizedImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-200 touch-manipulation ${
              index === currentIndex
                ? resolvedTheme === "dark"
                  ? "bg-white"
                  : "bg-white"
                : resolvedTheme === "dark"
                  ? "bg-white/40 hover:bg-white/60"
                  : "bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
