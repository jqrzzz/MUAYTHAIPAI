"use client"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, MapPin, Clock, DollarSign, Users, Award, Plane } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { ContinueLearning } from "@/components/blog/continue-learning"

const faqData = [
  {
    category: "Getting Started",
    icon: Users,
    questions: [
      {
        question: "Do I need experience to train at Muay Thai Pai?",
        answer:
          "Not at all! We welcome complete beginners. The Wisarut Family has been teaching traditional Muay Thai for generations and specializes in helping newcomers learn proper technique from the ground up.",
      },
      {
        question: "What should I bring for my first class?",
        answer:
          "Just bring comfortable workout clothes, a water bottle, and an open mind! We provide all equipment including gloves, pads, and protective gear.",
      },
      {
        question: "How do I book classes or training sessions?",
        answer:
          "You can book directly through our website, visit us in person at our gym in Pai, or contact us via WhatsApp or Facebook.",
      },
    ],
  },
  {
    category: "Training Programs",
    icon: Award,
    questions: [
      {
        question: "What types of training do you offer?",
        answer:
          "We offer group classes, private lessons, intensive training camps, certificate programs, and long-term apprenticeships.",
      },
      {
        question: "How long are the certificate programs?",
        answer:
          "Our certificate programs range from 1-month intensive courses to 6-month comprehensive programs. Each level builds upon the previous.",
      },
      {
        question: "Can I train if I'm only visiting Pai for a short time?",
        answer:
          "We offer drop-in classes and short-term packages perfect for travelers. Even a few sessions will give you authentic insight into traditional Muay Thai.",
      },
    ],
  },
  {
    category: "Location & Logistics",
    icon: MapPin,
    questions: [
      {
        question: "Where exactly is Muay Thai Pai located?",
        answer:
          "We're located in the heart of Pai, Mae Hong Son Province, Northern Thailand. Pai is a beautiful mountain town about 3 hours from Chiang Mai.",
      },
      {
        question: "How do I get to Pai from Bangkok or Chiang Mai?",
        answer:
          "From Bangkok: Fly to Chiang Mai (1.5 hours), then take a bus or private transport to Pai (3 hours). From Chiang Mai: Direct bus service runs multiple times daily.",
      },
      {
        question: "Do you offer accommodation recommendations?",
        answer:
          "Yes! We partner with several local guesthouses and hostels. We can recommend budget-friendly options or private accommodations.",
      },
    ],
  },
  {
    category: "Pricing & Packages",
    icon: DollarSign,
    questions: [
      {
        question: "How much do classes cost?",
        answer:
          "Group classes start from 300 THB per session. Private lessons are 800-1,200 THB depending on duration. We offer package deals for multiple sessions.",
      },
      {
        question: "Do you offer student discounts or long-term rates?",
        answer:
          "Yes! We offer significant discounts for monthly packages, certificate program enrollments, and students staying longer than 2 weeks.",
      },
      {
        question: "What's included in the training packages?",
        answer:
          "All packages include equipment use, traditional Muay Thai instruction, cultural education, and access to our gym facilities.",
      },
    ],
  },
  {
    category: "Visas & Legal",
    icon: Plane,
    questions: [
      {
        question: "Can I get an education visa to train Muay Thai?",
        answer:
          "Yes! We're authorized to provide education visas (ED visa) for our certificate programs. This allows you to stay in Thailand legally for extended training periods.",
      },
      {
        question: "What visa do I need for short-term training?",
        answer:
          "For training under 30 days, most nationalities can use a tourist visa or visa exemption. For longer stays, we recommend our education visa program.",
      },
      {
        question: "Do you help with visa applications and renewals?",
        answer:
          "We have experience helping international students with visa applications, renewals, and extensions. Our team can guide you through the requirements.",
      },
    ],
  },
  {
    category: "Training Schedule",
    icon: Clock,
    questions: [
      {
        question: "What are your training hours?",
        answer:
          "We typically train Monday-Saturday, 7:00 AM - 6:00 PM. Morning sessions (7-9 AM) focus on technique and conditioning. Afternoon sessions (4-6 PM) include pad work and sparring.",
      },
      {
        question: "How many times per week should I train?",
        answer:
          "For beginners, we recommend 3-4 sessions per week. Intermediate students often train 4-5 times weekly. Advanced students may train daily.",
      },
      {
        question: "Do you train during Thai holidays?",
        answer:
          "We observe major Thai holidays like Songkran (April) and New Year, but generally maintain regular schedules. We'll always inform students of any schedule changes.",
      },
    ],
  },
]

export default function FAQClient() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [openItems, setOpenItems] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  const toggleItem = (id: string) => {
    setOpenItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === "dark" ? "bg-black text-white" : "bg-white text-gray-900"}`}>
      <SiteHeader />

      {/* Hero Section */}
      <div
        className={`py-20 ${resolvedTheme === "dark" ? "bg-gradient-to-b from-orange-900/20 to-black" : "bg-gradient-to-b from-orange-50 to-white"}`}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.h1
            className={`text-4xl md:text-6xl font-bold mb-6 ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            className={`text-xl mb-8 ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-600"}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Everything you need to know about training authentic Muay Thai with the Wisarut Family in Pai, Thailand
          </motion.p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          className={`mb-12 p-6 rounded-xl ${
            resolvedTheme === "dark" ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50 border border-gray-200"
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className={`text-sm mb-3 ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Quick Links:</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/classes" className="text-primary underline-offset-4 hover:underline">
              View Classes
            </Link>
            <Link href="/gym" className="text-primary underline-offset-4 hover:underline">
              Our Gym
            </Link>
            <Link href="/train-and-stay" className="text-primary underline-offset-4 hover:underline">
              Accommodation
            </Link>
            <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
              Contact Us
            </Link>
          </div>
        </motion.div>

        {faqData.map((category, categoryIndex) => (
          <motion.div
            key={category.category}
            className="mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-full ${resolvedTheme === "dark" ? "bg-orange-500/20" : "bg-orange-100"}`}>
                <category.icon
                  className={`w-6 h-6 ${resolvedTheme === "dark" ? "text-orange-400" : "text-orange-600"}`}
                />
              </div>
              <h2 className={`text-2xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                {category.category}
              </h2>
            </div>

            <div className="space-y-4">
              {category.questions.map((item, index) => {
                const itemId = `${category.category}-${index}`
                const isOpen = openItems.includes(itemId)

                return (
                  <motion.div
                    key={itemId}
                    className={`border rounded-lg overflow-hidden ${
                      resolvedTheme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
                    }`}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => toggleItem(itemId)}
                      className={`w-full px-6 py-4 text-left flex items-center justify-between hover:bg-opacity-80 transition-colors ${
                        resolvedTheme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}
                      aria-expanded={isOpen}
                    >
                      <h3
                        className={`font-semibold text-lg ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {item.question}
                      </h3>
                      {isOpen ? (
                        <ChevronUp
                          className={`w-5 h-5 ${resolvedTheme === "dark" ? "text-orange-400" : "text-orange-600"}`}
                        />
                      ) : (
                        <ChevronDown
                          className={`w-5 h-5 ${resolvedTheme === "dark" ? "text-orange-400" : "text-orange-600"}`}
                        />
                      )}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className={`px-6 pb-4 ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            <p className="leading-relaxed">{item.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ))}

        {/* Contact CTA */}
        <motion.div
          className={`mt-16 p-8 rounded-2xl text-center ${
            resolvedTheme === "dark"
              ? "bg-gradient-to-r from-orange-900/30 to-amber-900/30 border border-orange-500/20"
              : "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200"
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h3 className={`text-2xl font-bold mb-4 ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
            Still Have Questions?
          </h3>
          <p className={`mb-6 ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            {"Don't hesitate to reach out! The Wisarut Family is always happy to help answer any questions."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className={`px-6 py-3 rounded-full font-semibold transition-colors ${
                resolvedTheme === "dark"
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
            >
              Contact Us
            </Link>
          </div>
        </motion.div>

        {/* Continue Learning Section */}
        <div className="mt-16">
          <ContinueLearning currentPage="faq" />
        </div>
      </div>

    </div>
  )
}
