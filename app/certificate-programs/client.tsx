"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Moon,
  Sun,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  BoxIcon as Boxing,
  Dumbbell,
  Menu,
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { MoreMenu } from "@/components/more-menu"
import Image from "next/image"
import { ContinueLearning } from "@/components/blog/continue-learning"
import { SOCIAL_LINKS } from "@/lib/socials"

const certificates = [
  {
    id: "naga",
    level: 1,
    name: "NAGA",
    shortDescription:
      "A foundational 3-day certificate to begin your Muay Thai journey with core skills and discipline.",
    title: "3-Day Participation Certificate: 'The Journey of the Naga's Path'",
    image: "/images/naga-level1.png",
    alt: "Naga Level 1 certificate - 3-day foundational Muay Thai training program at Wisarut Family Gym",
    theme:
      "The Naga (serpent deity) is a symbol of protection and guidance in Thai culture. This program marks the beginning of a student's journey under the principles of Muay Thai, with introductory study materials and evaluations.",
    focus: ["Foundational techniques", "Basic stances & movements", "Discipline & respect", "Introductory evaluations"],
    symbolism: "Protection, guidance, new beginnings.",
    certificateTitle: "Certified in the Art of Muay Thai - Naga Path",
    recognition: "For the honor and respect of starting your Muay Thai journey.",
    price: "7,000 THB",
  },
  {
    id: "phayra-nak",
    level: 2,
    name: "PHAYRA NAK",
    shortDescription:
      "A 1-week course to deepen your skills with fluid movements, enhanced conditioning, and initial evaluations.",
    title: "1-Week Participation Certificate: 'The Flow of Phayra Nak'",
    image: "/images/phayra-nak-level2.png",
    alt: "Phayra Nak Level 2 certificate - 1-week intermediate Muay Thai training program in Pai, Thailand",
    theme:
      "Phayra Nak, a powerful serpent deity, represents adaptability and transformation. This program deepens foundational skills, focusing on fluid movements and rhythm, supported by structured study materials and evaluations.",
    focus: [
      "Intermediate footwork",
      "Combinations & counters",
      "Defensive strategies",
      "Enhanced conditioning",
      "Structured evaluations",
    ],
    symbolism: "Adaptability, transformation, deeper connection.",
    certificateTitle: "Certified in the Art of Muay Thai - Phayra Nak Flow",
    recognition: "In recognition of your growing adaptability and skill.",
    price: "10,000 THB",
  },
  {
    id: "singha",
    level: 3,
    name: "SINGHA",
    shortDescription:
      "A rigorous 10-day course to forge powerful techniques, cultivate a fearless spirit, and undergo comprehensive evaluations.",
    title: "10-Day Participation Certificate: 'The Roar of Singha'",
    image: "/images/ratchasi-level3.png",
    alt: "Singha Level 3 certificate - 10-day advanced Muay Thai warrior training at Wisarut Family Gym",
    theme:
      "Singha, the mythical Thai lion, embodies strength, courage, and leadership. This program is designed to forge powerful techniques and cultivate a fearless spirit, with comprehensive study materials and rigorous evaluations.",
    focus: [
      "Advanced striking power",
      "Clinch work & sweeps",
      "Mental fortitude & strategy",
      "Sparring fundamentals",
      "Rigorous evaluations",
    ],
    symbolism: "Strength, courage, leadership.",
    certificateTitle: "Certified in the Art of Muay Thai - Singha Roar",
    recognition: "For demonstrating the strength and courage of a true warrior.",
    price: "18,000 THB",
  },
  {
    id: "hanuman",
    level: 4,
    name: "HANUMAN",
    shortDescription:
      "A 2-week intensive certification to elevate your training with advanced techniques and competitive readiness.",
    title: "2-Week Participation Certificate: 'The Path of Hanuman'",
    image: "/images/hanuman-level4.png",
    alt: "Hanuman Level 4 certificate - 2-week intensive Muay Thai mastery program in Pai, Thailand",
    theme:
      "Hanuman, the divine monkey warrior, symbolizes perseverance, strength, and loyalty. This program elevates training beyond fundamentals, preparing students for advanced techniques and competitive environments through in-depth study and evaluations.",
    focus: [
      "Mastering advanced techniques",
      "Strategic fight planning",
      "High-intensity conditioning",
      "Competitive readiness",
      "In-depth evaluations",
    ],
    symbolism: "Perseverance, strength, loyalty.",
    certificateTitle: "Certified in the Art of Muay Thai - Path of Hanuman",
    recognition: "In recognition of the dedication and mastery of advanced Muay Thai.",
    price: "25,000 THB",
  },
  {
    id: "garuda",
    level: 5,
    name: "GARUDA",
    shortDescription:
      "A 1-month elite certification program to achieve the pinnacle of mastery and spiritual connection.",
    title: "1-Month Elite Certification: 'The Path of the Garuda'",
    image: "/images/garuda-level5.png",
    alt: "Garuda Level 5 certificate - 1-month elite Muay Thai master certification at Wisarut Family Gym",
    theme:
      "The Garuda (mythical bird) is known for its agility, strength, and loyalty. This elite program represents the pinnacle of mastery, focusing on spiritual connection and advanced application of Muay Thai principles, culminating in comprehensive study and final evaluations.",
    focus: [
      "Elite agility & speed",
      "Precision striking & defense",
      "Spiritual connection to Muay Thai",
      "Mentorship & leadership principles",
      "Comprehensive final evaluations",
    ],
    symbolism: "Agility, strength, loyalty, ultimate mastery.",
    certificateTitle: "Certified in the Art of Muay Thai - Path of Garuda",
    recognition: "For achieving the highest level of mastery and embodying the spirit of Muay Thai.",
    price: "42,000 THB",
  },
]

export default function CertificateProgramsClient() {
  const [showContent, setShowContent] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [bookingData, setBookingData] = useState({
    name: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  })
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")
  const toggleSection = (sectionId: string) => setExpandedSection(expandedSection === sectionId ? null : sectionId)
  const toggleMoreMenu = () => setShowMoreMenu(!showMoreMenu)

  const toggleBooking = (certId: string) => {
    setExpandedBooking(expandedBooking === certId ? null : certId)
    setPaymentSuccess(null)
  }

  const handleInputChange = (field: string, value: string) => {
    setBookingData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePayment = async (method: string, certId: string) => {
    setIsProcessingPayment(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsProcessingPayment(false)
    setPaymentSuccess(certId)
    setBookingData({
      name: "",
      email: "",
      cardNumber: "",
      expiry: "",
      cvc: "",
    })
  }

  if (!mounted) return null

  return (
    <div
      className={`min-h-screen overflow-hidden relative transition-all duration-500 ${
        resolvedTheme === "dark"
          ? "bg-gradient-to-b from-black via-neutral-900 to-black"
          : "bg-gradient-to-b from-neutral-100 via-white to-neutral-50"
      }`}
    >
      {/* Dynamic Gradient Overlay */}
      <div
        className={`absolute inset-0 z-10 ${
          resolvedTheme === "dark"
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
              resolvedTheme === "dark" ? "ffffff" : "000000"
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
              resolvedTheme === "dark"
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
            key="certs-splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-20 flex items-center justify-center min-h-screen"
          >
            <div className="text-center">
              <motion.h1
                className={`text-4xl md:text-5xl font-black mb-2 ${
                  resolvedTheme === "dark"
                    ? "bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent"
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Certificate Programs
              </motion.h1>
              <motion.p
                className={`text-lg font-bold tracking-widest ${
                  resolvedTheme === "dark" ? "text-amber-200/90" : "text-amber-800/90"
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                FORGE YOUR PATH
              </motion.p>
              <motion.p
                className={`text-sm font-semibold tracking-wider ${
                  resolvedTheme === "dark" ? "text-amber-300/70" : "text-amber-700/70"
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                MUAY THAI PAI - WISARUT FAMILY
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="certs-content"
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
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/"
                  className={`backdrop-blur-md rounded-full p-3 border transition-colors ${
                    resolvedTheme === "dark"
                      ? "bg-white/10 border-white/20 hover:bg-white/20"
                      : "bg-black/10 border-black/20 hover:bg-black/20"
                  }`}
                  aria-label="Back to home"
                >
                  <ArrowLeft className={`w-5 h-5 ${resolvedTheme === "dark" ? "text-amber-400" : "text-orange-600"}`} />
                </Link>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`backdrop-blur-md rounded-full p-3 border transition-colors ${
                    resolvedTheme === "dark"
                      ? "bg-white/10 border-white/20 hover:bg-white/20"
                      : "bg-black/10 border-black/20 hover:bg-black/20"
                  }`}
                  aria-label="Instagram"
                >
                  <svg
                    className={`w-5 h-5 ${resolvedTheme === "dark" ? "text-amber-400" : "text-orange-600"}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`backdrop-blur-md rounded-full p-3 border transition-colors ${
                    resolvedTheme === "dark"
                      ? "bg-white/10 border-white/20 hover:bg-white/20"
                      : "bg-black/10 border-black/20 hover:bg-black/20"
                  }`}
                  aria-label="Facebook"
                >
                  <svg
                    className={`w-5 h-5 ${resolvedTheme === "dark" ? "text-amber-400" : "text-orange-600"}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </motion.div>

              <motion.div
                className="absolute top-4 right-4 z-50"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={toggleTheme}
                  className={`backdrop-blur-md rounded-full p-3 border transition-colors ${
                    resolvedTheme === "dark"
                      ? "bg-white/10 border-white/20 hover:bg-white/20"
                      : "bg-black/10 border-black/20 hover:bg-black/20"
                  }`}
                  aria-label="Toggle theme"
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-orange-600" />
                  )}
                </button>
              </motion.div>
            </div>

            {/* Page Title */}
            <motion.h1 className={`sr-only`}>Certificate Programs - Muay Thai Pai</motion.h1>
            <motion.h2
              className={`text-3xl md:text-4xl font-black text-center pt-24 pb-4 ${
                resolvedTheme === "dark"
                  ? "bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              FORGE YOUR PATH
            </motion.h2>

            {/* Introductory Section */}
            <motion.section
              className="text-center px-4 max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <p
                className={`text-base md:text-lg leading-relaxed ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
              >
                Learn authentic Muay Thai in Thailand. Train with experienced fighters, earn recognized certifications,
                and take home skills that last a lifetime.
              </p>
            </motion.section>

            <motion.h3
              className={`text-2xl md:text-3xl font-bold text-center mb-8 ${
                resolvedTheme === "dark"
                  ? "bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              OUR CERTIFICATION LEVELS
            </motion.h3>

            {/* Certificates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 px-4 pb-24 justify-items-center">
              {certificates.map((cert) => (
                <motion.div
                  key={cert.id}
                  className={`w-full max-w-sm backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg cursor-pointer transition-all duration-300 ${
                    expandedSection === cert.id
                      ? "border-orange-700/50"
                      : resolvedTheme === "dark"
                        ? "bg-orange-950/30 border-orange-500/20"
                        : "bg-orange-100/60 border-orange-600/30"
                  }`}
                  onClick={() => toggleSection(cert.id)}
                  whileHover={{ scale: expandedSection === cert.id ? 1 : 1.02 }}
                >
                  <div className="relative w-full h-48 overflow-hidden rounded-t-2xl">
                    <Image
                      src={cert.image || "/placeholder.svg"}
                      alt={cert.alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-black/60 via-orange-900/20 to-black/60 backdrop-blur-[1px] ${
                        resolvedTheme === "dark" ? "bg-black/40" : "bg-black/20"
                      }`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h4 className="text-3xl font-black text-white drop-shadow-lg">{cert.name}</h4>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col items-center text-center">
                    <p
                      className={`text-center text-sm ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {cert.shortDescription}
                    </p>
                    <div
                      className={`rounded-full p-2 mt-4 ${
                        expandedSection === cert.id
                          ? resolvedTheme === "dark"
                            ? "bg-orange-500/20"
                            : "bg-orange-500/10"
                          : resolvedTheme === "dark"
                            ? "bg-white/10"
                            : "bg-black/5"
                      }`}
                    >
                      {expandedSection === cert.id ? (
                        <ChevronUp
                          className={`w-6 h-6 ${resolvedTheme === "dark" ? "text-amber-400" : "text-orange-600"}`}
                        />
                      ) : (
                        <ChevronDown
                          className={`w-6 h-6 ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedSection === cert.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.4 },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.2 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { duration: 0.3, delay: 0.1 },
                          }}
                          className="px-6 pb-6 pt-2"
                        >
                          <motion.div
                            initial={{ opacity: 0, width: "0%" }}
                            animate={{
                              opacity: 1,
                              width: "100%",
                              transition: { duration: 0.5 },
                            }}
                            className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6"
                          />
                          <div
                            className={`space-y-4 text-sm ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                          >
                            <div>
                              <p className="font-semibold text-base mb-1">Theme:</p>
                              <p className="ml-2">{cert.theme}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-base mb-1">Focus:</p>
                              <ul className="list-disc list-inside ml-2">
                                {cert.focus.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="font-semibold text-base mb-1">Symbolism:</p>
                              <p className="ml-2">{cert.symbolism}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-base mb-1">Certificate Title:</p>
                              <p className="ml-2">{cert.certificateTitle}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-base mb-1">Recognition:</p>
                              <p className="ml-2">{cert.recognition}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-base mb-1">Price:</p>
                              <p className="ml-2">{cert.price}</p>
                            </div>

                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleBooking(cert.id)
                              }}
                              className={`w-full py-3 rounded-xl font-bold text-white mt-6 ${
                                resolvedTheme === "dark"
                                  ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500"
                                  : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {expandedBooking === cert.id ? "Close Booking" : "Book Now"}
                            </motion.button>

                            <AnimatePresence>
                              {expandedBooking === cert.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="mt-6 p-4 rounded-xl bg-black/10 dark:bg-white/5"
                                  >
                                    {paymentSuccess === cert.id ? (
                                      <div className="text-center py-8">
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                                        >
                                          <svg
                                            className="w-8 h-8 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                        </motion.div>
                                        <h5
                                          className={`text-xl font-bold mb-2 ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}
                                        >
                                          Booking Confirmed!
                                        </h5>
                                        <p className={resolvedTheme === "dark" ? "text-gray-300" : "text-gray-600"}>
                                          Welcome to the Path of {cert.name}. We'll contact you within 24 hours.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        <h5
                                          className={`font-bold text-lg ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}
                                        >
                                          Book Your {cert.name} Certification
                                        </h5>

                                        <div className="grid grid-cols-1 gap-4">
                                          <input
                                            type="text"
                                            placeholder="Full Name"
                                            value={bookingData.name}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleInputChange("name", e.target.value)}
                                            className={`w-full p-3 rounded-lg border ${
                                              resolvedTheme === "dark"
                                                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                                            }`}
                                          />
                                          <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={bookingData.email}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                            className={`w-full p-3 rounded-lg border ${
                                              resolvedTheme === "dark"
                                                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                                            }`}
                                          />
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 mt-6">
                                          <motion.button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handlePayment("card", cert.id)
                                            }}
                                            disabled={isProcessingPayment}
                                            className={`w-full py-3 rounded-lg font-semibold text-white ${
                                              resolvedTheme === "dark"
                                                ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500"
                                                : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                                            } disabled:opacity-50`}
                                            whileHover={{ scale: isProcessingPayment ? 1 : 1.02 }}
                                            whileTap={{ scale: isProcessingPayment ? 1 : 0.98 }}
                                          >
                                            {isProcessingPayment
                                              ? "Processing..."
                                              : `Book ${cert.name} - ${cert.price}`}
                                          </motion.button>
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="flex justify-center mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedSection(null)
                                }}
                                className={`flex items-center gap-1 px-4 py-2 rounded-full text-xs ${
                                  resolvedTheme === "dark"
                                    ? "bg-white/10 text-gray-300 hover:bg-white/20"
                                    : "bg-black/5 text-gray-600 hover:bg-black/10"
                                }`}
                              >
                                <ChevronUp className="w-3 h-3" />
                                <span>Close</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Continue Learning Section */}
            <ContinueLearning currentPage="certificate-programs" />

            {/* Bottom Navigation */}
            <motion.div
              className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t ${
                resolvedTheme === "dark" ? "bg-black/80 border-white/10" : "bg-white/90 border-gray-200"
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
                      className={resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"}
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
                      href={item.href!}
                      className={`flex flex-col items-center gap-1 ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}
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

      {/* Floating Particles */}
      {showContent && (
        <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${
                i % 3 === 0 ? "bg-orange-500/20" : i % 3 === 1 ? "bg-amber-500/20" : "bg-orange-700/20"
              }`}
              style={{
                width: Math.random() * 6 + 2,
                height: Math.random() * 6 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      )}

      <MoreMenu isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} />
    </div>
  )
}
