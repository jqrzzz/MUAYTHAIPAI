"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { ContinueLearning } from "@/components/blog/continue-learning"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SplashScreen,
  useSplash,
} from "@/components/marketing"

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
  const showContent = useSplash()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

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
  }, [])

  const resolvedTheme = mounted ? theme : "dark"
  const toggleSection = (sectionId: string) => setExpandedSection(expandedSection === sectionId ? null : sectionId)

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
    <PageBackground>
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
            className="absolute top-0 w-20 h-screen bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-500/5 dark:via-orange-500/3"
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
          <SplashScreen key="certs-splash" title="Certificate Programs" subtitle="FORGE YOUR PATH" />
        ) : (
          <motion.div
            key="certs-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20 min-h-screen"
          >
            <MarketingTopNav />

            {/* Page Title */}
            <motion.h1 className={`sr-only`}>Certificate Programs - Muay Thai Pai</motion.h1>
            <motion.h2
              className="text-3xl md:text-4xl font-black text-center pt-24 pb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
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
                className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300"
              >
                Learn authentic Muay Thai in Thailand. Train with experienced fighters, earn recognized certifications,
                and take home skills that last a lifetime.
              </p>
            </motion.section>

            <motion.h3
              className="text-2xl md:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
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
                      : "bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
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
                      className="absolute inset-0 bg-gradient-to-t from-black/60 via-orange-900/20 to-black/60 backdrop-blur-[1px] bg-black/20 dark:bg-black/40"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h4 className="text-3xl font-black text-white drop-shadow-lg">{cert.name}</h4>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col items-center text-center">
                    <p
                      className="text-center text-sm text-gray-700 dark:text-gray-300"
                    >
                      {cert.shortDescription}
                    </p>
                    <div
                      className={`rounded-full p-2 mt-4 ${
                        expandedSection === cert.id
                          ? "bg-orange-500/10 dark:bg-orange-500/20"
                          : "bg-black/5 dark:bg-white/10"
                      }`}
                    >
                      {expandedSection === cert.id ? (
                        <ChevronUp
                          className="w-6 h-6 text-orange-600 dark:text-amber-400"
                        />
                      ) : (
                        <ChevronDown
                          className="w-6 h-6 text-gray-600 dark:text-gray-400"
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
                            className="space-y-4 text-sm text-gray-700 dark:text-gray-300"
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
                              className="w-full py-3 rounded-xl font-bold text-white mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-orange-600 dark:to-amber-600 dark:hover:from-orange-500 dark:hover:to-amber-500"
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
                                          className="text-xl font-bold mb-2 text-gray-900 dark:text-white"
                                        >
                                          Booking Confirmed!
                                        </h5>
                                        <p className="text-gray-600 dark:text-gray-300">
                                          Welcome to the Path of {cert.name}. We'll contact you within 24 hours.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        <h5
                                          className="font-bold text-lg text-gray-900 dark:text-white"
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
                                            className="w-full p-3 rounded-lg border bg-white border-gray-300 text-gray-900 placeholder-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                          />
                                          <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={bookingData.email}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                            className="w-full p-3 rounded-lg border bg-white border-gray-300 text-gray-900 placeholder-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                          />
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 mt-6">
                                          <motion.button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handlePayment("card", cert.id)
                                            }}
                                            disabled={isProcessingPayment}
                                            className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-orange-600 dark:to-amber-600 dark:hover:from-orange-500 dark:hover:to-amber-500 disabled:opacity-50"
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
                                className="flex items-center gap-1 px-4 py-2 rounded-full text-xs bg-black/5 text-gray-600 hover:bg-black/10 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
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

            <MarketingBottomNav />
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
    </PageBackground>
  )
}
