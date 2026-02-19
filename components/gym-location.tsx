"use client"

import { MapPin } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

type GymLocationProps = {}

export function GymLocation() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  const paiImages = [
    "/images/pai-slideshow/rainbow-field.jpeg",
    "/images/pai-slideshow/hut-mountains-sunset.jpeg",
    "/images/pai-slideshow/pink-sky-field.jpeg",
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="relative">
        {/* Animated glow border */}
        <motion.div
          className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 opacity-30 blur-xl"
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        {/* Main container with glassmorphic effect */}
        <div
          className={`relative rounded-3xl overflow-hidden border ${
            resolvedTheme === "dark"
              ? "bg-neutral-900/40 border-orange-500/20 backdrop-blur-xl"
              : "bg-white/40 border-orange-400/30 backdrop-blur-xl"
          }`}
        >
          {/* Header */}
          <div className="p-6 md:p-8 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <MapPin className="w-6 h-6 text-orange-500" />
              <h2
                className={`text-2xl md:text-3xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                Visit Our Gym
              </h2>
            </motion.div>
            <p className={`text-sm md:text-base ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              259 1, Mae Hi, Pai District, Mae Hong Son 58130, Thailand
            </p>
            <p className={`text-sm mt-2 ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              Open Daily: 8:00 AM - 8:00 PM
            </p>
          </div>

          {/* Pai Images Grid */}
          <div className="grid grid-cols-3 gap-2 px-6 pb-6">
            {paiImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative aspect-square rounded-xl overflow-hidden group"
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`Pai, Thailand - View ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div
                  className={`absolute inset-0 ${
                    resolvedTheme === "dark"
                      ? "bg-gradient-to-t from-black/60 to-transparent"
                      : "bg-gradient-to-t from-black/40 to-transparent"
                  }`}
                />
              </motion.div>
            ))}
          </div>

          {/* Gym Training Photos Grid */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  src: "/images/group-training-pads.jpeg",
                  alt: "Muay Thai pad training - Students practicing authentic Thai boxing techniques at Wisarut Family Gym in Pai, Thailand",
                },
                {
                  src: "/images/membership-fighters-smiling.jpeg",
                  alt: "Happy Muay Thai fighters - Welcoming community at traditional Thai boxing gym in Pai, Thailand",
                },
                {
                  src: "/images/membership-punching-bags.jpeg",
                  alt: "Muay Thai bag training - Heavy bag workout at authentic Thai boxing gym in Pai, Thailand",
                },
              ].map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative aspect-square rounded-xl overflow-hidden group border-2 border-orange-500/30"
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 768px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div
                    className={`absolute inset-0 ${
                      resolvedTheme === "dark"
                        ? "bg-gradient-to-t from-black/60 to-transparent"
                        : "bg-gradient-to-t from-black/40 to-transparent"
                    }`}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Get Directions Button */}
          <div className="px-6 pb-8 flex justify-end mb-4">
            <motion.a
              href="https://maps.app.goo.gl/5xw8gd3SYNkWmUGm8"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`inline-flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-base text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-orange-500/50 ${
                resolvedTheme === "dark" ? "shadow-orange-500/30" : "shadow-orange-500/40"
              }`}
            >
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
              Find Us on Google Maps
            </motion.a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
