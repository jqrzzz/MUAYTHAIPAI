"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Zap, ChevronUp, ChevronDown, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { formatPrice } from "@/lib/payment-config"
import { EnhancedPaymentFlow } from "./enhanced-payment-flow"
import { useTheme } from "next-themes"

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: string
  category: string
  hasCalendly?: boolean
  requiresTimeSlot: boolean
  metadata?: Record<string, unknown>
}

interface TimeSlots {
  byService: Record<string, string[]>
  default: string[]
}

interface ServicesData {
  gym: { id: string; name: string; timezone: string }
  services: Service[]
  timeSlots: TimeSlots
}

const DEFAULT_PRIVATE_LESSON_TYPES = [
  {
    id: "beginner" as const,
    name: "Fundamentals & Technique",
    basePrice: 700,
    description: "Sharpen your form, footwork, and combos in an engaging, skill-focused session.",
  },
  {
    id: "advanced" as const,
    name: "Power & Advanced Technique",
    basePrice: 1000,
    description: "Intense pad work, clinching, and endurance drills designed to push strength and skill.",
  },
]

interface BookingSectionProps {
  initialBookingItemId?: string
  gymSlug?: string
}

export function BookingSection({ initialBookingItemId, gymSlug = "wisarut-family-gym" }: BookingSectionProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [services, setServices] = useState<Service[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlots>({ byService: {}, default: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedBookingItem, setSelectedBookingItem] = useState<Service | null>(null)
  const [showBookingOptions, setShowBookingOptions] = useState(false)
  const [showPaymentFlow, setShowPaymentFlow] = useState(false)
  const [selectedPrivateLessonType, setSelectedPrivateLessonType] = useState<"beginner" | "advanced" | "">("")
  const [selectedDuration, setSelectedDuration] = useState<"1hr" | "2hr">("1hr")
  const [selectedDate, setSelectedDate] = useState<string>("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchServices() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/public/services?gym=${gymSlug}`)

        if (!response.ok) {
          throw new Error("Failed to load services")
        }

        const data: ServicesData = await response.json()

        setServices(data.services || [])
        setTimeSlots(data.timeSlots || { byService: {}, default: [] })

        // If there's an initial booking item, find it with flexible matching
        if (initialBookingItemId && data.services) {
          // Normalize the ID: "group-session" -> "groupsession" or "group session"
          const normalizedId = initialBookingItemId.toLowerCase().replace(/-/g, " ")
          const normalizedIdNoSpaces = initialBookingItemId.toLowerCase().replace(/-/g, "")

          const item = data.services.find((s) => {
            const normalizedName = s.name.toLowerCase()
            const normalizedNameNoSpaces = s.name.toLowerCase().replace(/\s/g, "")

            return (
              s.id === initialBookingItemId ||
              normalizedName === normalizedId ||
              normalizedName.includes(normalizedId) ||
              normalizedNameNoSpaces === normalizedIdNoSpaces ||
              normalizedNameNoSpaces.includes(normalizedIdNoSpaces)
            )
          })

          if (item) {
            setSelectedBookingItem(item)
          }
        }
      } catch (err) {
        console.error("Error fetching services:", err)
        setError("Failed to load booking options")
      } finally {
        setIsLoading(false)
      }
    }
    fetchServices()
  }, [gymSlug, initialBookingItemId])

  useEffect(() => {
    setSelectedPrivateLessonType("")
    setSelectedDuration("1hr")
  }, [selectedBookingItem])

  const resolvedTheme = mounted ? theme : "dark"

  const isSunday = (dateString: string): boolean => {
    if (!dateString) return false
    const date = new Date(dateString)
    return date.getDay() === 0
  }

  const isGroupSessionDisabled = (): boolean => {
    return selectedBookingItem?.name.toLowerCase().includes("group") && isSunday(selectedDate)
  }

  const handleBookingSelect = (itemId: string) => {
    const item = services.find((s) => s.id === itemId)
    setSelectedBookingItem(item || null)
    setShowBookingOptions(false)
    setSelectedDate("")
  }

  const handleBookNow = () => {
    if (!selectedBookingItem) return

    if (selectedBookingItem.name.toLowerCase().includes("private") && !selectedPrivateLessonType) {
      alert("Please select a private lesson type first.")
      return
    }

    setShowPaymentFlow(true)
  }

  const getPrivateLessonTypes = () => {
    const privateService = services.find((s) => s.name.toLowerCase().includes("private"))
    if (privateService?.metadata?.lessonTypes) {
      return privateService.metadata.lessonTypes as typeof DEFAULT_PRIVATE_LESSON_TYPES
    }
    return DEFAULT_PRIVATE_LESSON_TYPES
  }

  const getDisplayInfo = () => {
    if (!selectedBookingItem) return { name: "", price: 0, description: "", duration: "" }

    if (selectedBookingItem.name.toLowerCase().includes("private") && selectedPrivateLessonType) {
      const types = getPrivateLessonTypes()
      const type = types.find((t) => t.id === selectedPrivateLessonType)
      let calculatedPrice = type?.basePrice || 0
      let calculatedDuration = "1 Hour"

      if (selectedDuration === "2hr") {
        calculatedPrice *= 2
        calculatedDuration = "2 Hours"
      }

      return {
        name: type?.name || "Private Lesson",
        price: calculatedPrice,
        description: type?.description || "",
        duration: calculatedDuration,
      }
    }

    return {
      name: selectedBookingItem.name,
      price: selectedBookingItem.price,
      description: selectedBookingItem.description,
      duration: selectedBookingItem.duration || "",
    }
  }

  const {
    name: displayName,
    price: displayPrice,
    description: displayDescription,
    duration: displayDuration,
  } = getDisplayInfo()

  const trainingServices = services.filter((s) => s.category === "training")
  const certificateServices = services.filter((s) => s.category === "certificate")

  if (isLoading) {
    return (
      <div
        className={`backdrop-blur-xl rounded-2xl p-6 border ${
          resolvedTheme === "dark" ? "bg-black/30 border-primary/20" : "bg-white/30 border-primary/20"
        }`}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-400">Loading booking options...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`backdrop-blur-xl rounded-2xl p-6 border ${
          resolvedTheme === "dark" ? "bg-black/30 border-primary/20" : "bg-white/30 border-primary/20"
        }`}
      >
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
          <Button variant="outline" className="mt-4 bg-transparent" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        className={`backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 ${
          resolvedTheme === "dark" ? "bg-black/30 border-primary/20" : "bg-white/30 border-primary/20"
        }`}
      >
        {!initialBookingItemId && (
          <motion.div
            onClick={(e) => {
              e.stopPropagation()
              setShowBookingOptions(!showBookingOptions)
              setSelectedBookingItem(null)
            }}
            className={cn(
              `flex justify-between items-center cursor-pointer rounded-xl p-4 transition-all duration-300`,
              resolvedTheme === "dark"
                ? "bg-gradient-to-r from-primary/80 via-primary/70 to-primary/80 border-primary/50 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50"
                : "bg-gradient-to-r from-primary via-primary/90 to-primary border-primary/50 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50",
              `text-white bg-[length:200%_auto]`,
              !showBookingOptions && !selectedBookingItem && `animate-gradient-move`,
            )}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6" /> Book Now
            </h2>
            {showBookingOptions ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </motion.div>
        )}

        {!initialBookingItemId && showBookingOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-6 pt-6 border-t border-primary/20"
          >
            {trainingServices.length > 0 && (
              <div className="mb-4">
                <h3
                  className={`text-lg font-semibold mb-2 ${resolvedTheme === "dark" ? "text-primary/90" : "text-primary"}`}
                >
                  Classes & Training
                </h3>
                <div className="grid gap-2">
                  {trainingServices.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      disabled={item.name.toLowerCase().includes("group") && isSunday(selectedDate) && !!selectedDate}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBookingSelect(item.id)
                      }}
                      className={`w-full justify-start ${
                        resolvedTheme === "dark"
                          ? "text-white hover:bg-primary/20"
                          : "text-gray-800 hover:bg-primary/10"
                      } ${item.name.toLowerCase().includes("group") && isSunday(selectedDate) && selectedDate ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {item.name} - {formatPrice(item.price)}
                      {item.name.toLowerCase().includes("group") && isSunday(selectedDate) && selectedDate && (
                        <span className="ml-2 text-xs">(Not available on Sundays)</span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {certificateServices.length > 0 && (
              <div className="mb-4">
                <h3
                  className={`text-lg font-semibold mb-2 ${resolvedTheme === "dark" ? "text-primary/90" : "text-primary"}`}
                >
                  Certificate Programs
                </h3>
                <div className="grid gap-2">
                  {certificateServices.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBookingSelect(item.id)
                      }}
                      className={`w-full justify-start ${
                        resolvedTheme === "dark"
                          ? "text-white hover:bg-primary/20"
                          : "text-gray-800 hover:bg-primary/10"
                      }`}
                    >
                      {item.name} - {formatPrice(item.price)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {(selectedBookingItem || initialBookingItemId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-6 pt-6 border-t border-primary/20"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className={`text-lg font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-800"}`}>
                  {displayName}
                  {displayPrice > 0 && (
                    <span
                      className={`${resolvedTheme === "dark" ? "text-primary/90" : "text-primary"} font-semibold ml-2`}
                    >
                      | {formatPrice(displayPrice)}
                    </span>
                  )}
                  {displayDuration && (
                    <span className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"} ml-2`}>
                      ({displayDuration})
                    </span>
                  )}
                </h4>
              </div>

              {displayDescription && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`mt-2 p-4 rounded-lg ${
                    resolvedTheme === "dark" ? "bg-black/20 text-gray-300" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <p>{displayDescription}</p>
                </motion.div>
              )}

              {selectedBookingItem?.name.toLowerCase().includes("private") && (
                <div className="grid gap-2">
                  <Label
                    htmlFor="private-lesson-type"
                    className={`${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Choose Private Lesson Type *
                  </Label>
                  <div className="grid gap-2">
                    {getPrivateLessonTypes().map((type) => (
                      <Button
                        key={type.id}
                        variant={selectedPrivateLessonType === type.id ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPrivateLessonType(type.id)
                        }}
                        className={cn(
                          "w-full justify-start h-auto py-2.5 px-2.5 text-left overflow-hidden",
                          selectedPrivateLessonType === type.id
                            ? resolvedTheme === "dark"
                              ? "bg-primary text-white hover:bg-primary/90"
                              : "bg-primary text-white hover:bg-primary/90"
                            : resolvedTheme === "dark"
                              ? "border-white/20 text-white hover:bg-primary/20"
                              : "border-gray-300 text-gray-800 hover:bg-primary/10",
                        )}
                      >
                        <div className="flex flex-col items-start w-full overflow-hidden">
                          <span className="text-xs sm:text-sm font-semibold leading-tight w-full break-words">
                            {type.name}
                          </span>
                          <span className="text-[10px] sm:text-xs opacity-80 mt-0.5 whitespace-nowrap">
                            {formatPrice(type.basePrice)}/hr
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedBookingItem?.name.toLowerCase().includes("private") && selectedPrivateLessonType && (
                <div className="grid gap-2">
                  <Label
                    htmlFor="private-lesson-duration"
                    className={`${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Choose Duration *
                  </Label>
                  <RadioGroup
                    id="private-lesson-duration"
                    value={selectedDuration}
                    onValueChange={(value: "1hr" | "2hr") => setSelectedDuration(value)}
                    className="flex space-x-4"
                    required
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1hr" id="duration-1hr" />
                      <Label
                        htmlFor="duration-1hr"
                        className={`${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                      >
                        1 Hour
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2hr" id="duration-2hr" />
                      <Label
                        htmlFor="duration-2hr"
                        className={`${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                      >
                        2 Hours
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <Button
                onClick={handleBookNow}
                disabled={isGroupSessionDisabled()}
                className={`w-full ${
                  resolvedTheme === "dark"
                    ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                }`}
              >
                <Zap className="mr-2 h-4 w-4" />
                {isGroupSessionDisabled()
                  ? "Group Sessions not available on Sundays"
                  : `Book Now ${displayPrice > 0 ? formatPrice(displayPrice) : "Free"}`}
              </Button>

              {!initialBookingItemId && selectedBookingItem && (
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedBookingItem(null)
                    setShowBookingOptions(true)
                  }}
                  className={`w-full ${
                    resolvedTheme === "dark"
                      ? "border-white/20 text-white hover:bg-primary/20"
                      : "border-gray-300 text-gray-800 hover:bg-primary/10"
                  }`}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Options
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {showPaymentFlow && selectedBookingItem && (
        <EnhancedPaymentFlow
          serviceId={selectedBookingItem.id}
          serviceName={displayName}
          servicePrice={displayPrice}
          serviceDuration={displayDuration}
          serviceDescription={displayDescription}
          onClose={() => setShowPaymentFlow(false)}
        />
      )}
    </div>
  )
}
