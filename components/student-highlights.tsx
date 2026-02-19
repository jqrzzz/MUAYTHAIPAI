"use client"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

interface StudentStory {
  id: number
  name: string
  country: string
  story: string
  image: string
}

const studentStories: StudentStory[] = [
  {
    id: 1,
    name: "Effie",
    country: "United Kingdom",
    story:
      "This makes my heart so happy. National Geographic has recognized this amazing human being and everything he gives back to the people he comes into contact with. This amazing man became a father to me when I was very lost during my three years in Thailand. He helped me build my dream bamboo home, took me into his family, and gave me something to focus on. We had one of the deepest connections I've ever felt with another person.",
    image: "/images/effie-fire-torch.png",
  },
  {
    id: 3,
    name: "Lotta",
    country: "Switzerland",
    story:
      "Seeking a change from my routine and embarking on my first international trip, I found more than just a gym in Pai – I found a family. After a month of immersive training, I returned to Switzerland and won my first Muay Thai fight! This gym became my home away from home, a place for wellness, training, and happiness.",
    image: "/images/lotta-fight-win-new.jpeg", // Updated image path
  },
  {
    id: 2,
    name: "Eliska",
    country: "Czech Republic",
    story:
      "Pai quickly evolved into one of the most memorable travels I've had. From cultural immersion to feeling that I have a Thai family and a home away from home. I went from beginner to in the ring on fight night and was guided the entire way. Feeling confident and part of something more.",
    image: "/images/eliska-m.jpeg",
  },
  {
    id: 4,
    name: "Andy",
    country: "Australia",
    story:
      "As a firefighter, I came to Pai to fully immerse myself in Muay Thai, training and eventually fighting. I loved the gym's serene, natural setting, yet appreciated being less than 2km from all the vibrant activities Pai has to offer.",
    image: "/images/andy-australia.png",
  },
  {
    id: 5,
    name: "Carmen",
    country: "Mexico",
    story:
      "While backpacking, I unexpectedly discovered Muay Thai in Pai and fell in love with it. Becoming part of a Thai family at the gym, I gained immense confidence, honed my skills, and left with invaluable experiences – and an awesome hoodie!",
    image: "/images/carmen-mexico.png",
  },
  {
    id: 6,
    name: "Justin",
    country: "United Kingdom",
    story:
      "During a gap year filled with adventure, I chose to ground my final month in Pai, focusing on Muay Thai and meditation. This experience allowed me to center myself and deeply connect with Thai culture and customs, preparing me for my return home to begin school.",
    image: "/images/justin-uk.jpeg",
  },
]

export function StudentHighlights() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % studentStories.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + studentStories.length) % studentStories.length)
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
          <div className="space-y-2">
            <h2
              className={`text-3xl font-bold tracking-tighter sm:text-5xl ${
                resolvedTheme === "dark" ? "text-white" : "text-primary"
              }`}
            >
              Student Highlights
            </h2>
            <p
              className={`max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed ${
                resolvedTheme === "dark" ? "text-primary/80" : "text-primary/70"
              }`}
            >
              Transforamtive Journeys and Unforgettable Experiences.
            </p>
          </div>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="w-full flex justify-center"
            >
              <Card
                className={`w-full max-w-md mx-auto flex flex-col overflow-hidden rounded-lg shadow-lg ${
                  resolvedTheme === "dark" ? "bg-black/20 border-primary/20" : "bg-white/40 border-primary/20"
                }`}
                style={{
                  boxShadow:
                    resolvedTheme === "dark" ? "0 0 30px rgba(255, 165, 0, 0.3)" : "0 0 30px rgba(255, 165, 0, 0.4)",
                }}
              >
                <div className="relative w-full h-60 sm:h-72 md:h-80 overflow-hidden">
                  <Image
                    src={studentStories[currentSlide].image || "/placeholder.svg"}
                    alt={studentStories[currentSlide].name}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle
                    className={`text-xl font-semibold ${resolvedTheme === "dark" ? "text-primary/90" : "text-primary"}`}
                  >
                    <span>{studentStories[currentSlide].name}</span>
                    {studentStories[currentSlide].country && (
                      <span
                        className={`block text-sm font-normal ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                      >
                        - {studentStories[currentSlide].country}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-sm leading-relaxed ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {studentStories[currentSlide].story}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full backdrop-blur-md border transition-colors ${
              resolvedTheme === "dark"
                ? "bg-white/10 border-white/20 hover:bg-white/20 text-white"
                : "bg-black/10 border-black/20 hover:bg-black/20 text-black"
            }`}
            aria-label="Previous student story"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full backdrop-blur-md border transition-colors ${
              resolvedTheme === "dark"
                ? "bg-white/10 border-white/20 hover:bg-white/20 text-white"
                : "bg-black/10 border-black/20 hover:bg-black/20 text-black"
            }`}
            aria-label="Next student story"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {studentStories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide
                    ? "bg-primary"
                    : resolvedTheme === "dark"
                      ? "bg-gray-600 hover:bg-gray-500"
                      : "bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
