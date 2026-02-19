"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { X, Calendar, Clock, User, Mail, CreditCard, Banknote, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { formatPrice, getPaymentSummary } from "@/lib/payment-config"
import { getTimeSlotsForService, shouldShowTimeSlots, SKILL_LEVELS } from "@/lib/booking-config"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { PAI_TIMEZONE_LABEL, formatDateInPaiTime, getTomorrowInPaiTimezone } from "@/lib/timezone"
import { createClient } from "@/lib/supabase/client"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type PaymentMethod = "card" | "cash"
type Step = "info" | "datetime" | "payment" | "success"

interface EnhancedPaymentFlowProps {
  serviceId: string
  serviceName: string
  servicePrice: number
  serviceDuration: string
  serviceDescription: string
  onClose: () => void
}

interface FormData {
  name: string
  email: string
  date: string
  time: string
  skillLevel: string
  paymentMethod: PaymentMethod
}

function StripePaymentForm({
  clientSecret,
  onSuccess,
  onError,
}: {
  clientSecret: string
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
}) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setError(null)

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking-success`,
      },
      redirect: "if_required",
    })

    if (submitError) {
      setError(submitError.message || "Payment failed")
      onError(submitError.message || "Payment failed")
      setIsProcessing(false)
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className={cn(
          "w-full",
          resolvedTheme === "dark" ? "bg-primary hover:bg-primary/90" : "bg-primary hover:bg-primary/90",
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Now
          </>
        )}
      </Button>
    </form>
  )
}

export function EnhancedPaymentFlow({
  serviceId,
  serviceName,
  servicePrice,
  serviceDuration,
  serviceDescription,
  onClose,
}: EnhancedPaymentFlowProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)

  useEffect(() => {
    setMounted(true)
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser({ id: user.id, email: user.email || "" })
      }
    }
    checkUser()
  }, [])

  const [step, setStep] = useState<Step>("info")
  const [formData, setFormData] = useState<FormData>({
    name: currentUser?.email || "",
    email: currentUser?.email || "",
    date: "",
    time: "",
    skillLevel: "",
    paymentMethod: "card",
  })
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isCreatingIntent, setIsCreatingIntent] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const timeSlots = getTimeSlotsForService(serviceName)
  const showTimeSlots = shouldShowTimeSlots(serviceName)
  const paymentSummary = getPaymentSummary(servicePrice)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateInfoStep = () => {
    if (!formData.name || !formData.email) {
      setError("Please fill in all required fields")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }
    setError(null)
    return true
  }

  const validateCalendarStep = () => {
    if (!formData.date) {
      setError("Please select a date")
      return false
    }

    const selectedDate = new Date(formData.date)
    const isSunday = selectedDate.getDay() === 0
    if (isSunday && serviceName.toLowerCase().includes("group session")) {
      setError("Group Sessions are not available on Sundays")
      return false
    }

    if (showTimeSlots && !formData.time) {
      setError("Please select a time")
      return false
    }
    setError(null)
    return true
  }

  const handleNextStep = () => {
    if (step === "info") {
      if (validateInfoStep()) {
        setStep(showTimeSlots ? "datetime" : "payment")
      }
    } else if (step === "datetime") {
      if (validateCalendarStep()) {
        setStep("payment")
      }
    }
  }

  const createPaymentIntent = async () => {
    if (servicePrice === 0 || formData.paymentMethod === "cash") return

    setIsCreatingIntent(true)
    setError(null)

    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thbAmount: servicePrice,
          metadata: {
            customer_name: formData.name,
            customer_email: formData.email,
            service_name: serviceName,
            booking_date: formData.date,
            booking_time: formData.time,
            user_id: currentUser?.id || "",
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment")
      }

      setClientSecret(data.clientSecret)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment setup failed")
    } finally {
      setIsCreatingIntent(false)
    }
  }

  useEffect(() => {
    if (step === "payment" && formData.paymentMethod === "card" && !clientSecret) {
      createPaymentIntent()
    }
  }, [step, formData.paymentMethod])

  const handlePaymentSuccess = (id: string) => {
    setPaymentId(id)
    setStep("success")
  }

  const handleCashPayment = async () => {
    try {
      await fetch("/api/send-booking-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          serviceType: serviceName,
          bookingDate: formData.date,
          bookingTime: formData.time,
          amount: servicePrice,
          paymentMethod: "cash",
          userId: currentUser?.id || null,
        }),
      })
    } catch (err) {
      console.error("Failed to send confirmation emails:", err)
    }
    setStep("success")
  }

  const getTomorrowDate = () => {
    return getTomorrowInPaiTimezone()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl",
          mounted
            ? theme === "dark"
              ? "bg-gray-900 border border-white/10"
              : "bg-white"
            : "bg-gray-900 border border-white/10",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className={cn(
                "text-xl font-bold",
                mounted ? (theme === "dark" ? "text-white" : "text-gray-900") : "text-white",
              )}
            >
              {step === "success" ? "Booking Confirmed!" : "Complete Your Booking"}
            </h2>
            <p
              className={cn(
                "text-sm",
                mounted ? (theme === "dark" ? "text-gray-400" : "text-gray-600") : "text-gray-400",
              )}
            >
              {serviceName} - {formatPrice(servicePrice)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Indicator */}
        {step !== "success" && (
          <div className="flex items-center gap-2 mb-6">
            {["info", showTimeSlots ? "datetime" : null, "payment"].filter(Boolean).map((s, i, arr) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step === s || arr.indexOf(step as string) > i
                      ? "bg-primary text-white"
                      : mounted
                        ? theme === "dark"
                          ? "bg-gray-700 text-gray-400"
                          : "bg-gray-200 text-gray-500"
                        : "bg-gray-700 text-gray-400",
                  )}
                >
                  {i + 1}
                </div>
                {i < arr.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 mx-2",
                      arr.indexOf(step as string) > i
                        ? "bg-primary"
                        : mounted
                          ? theme === "dark"
                            ? "bg-gray-700"
                            : "bg-gray-200"
                          : "bg-gray-700",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Customer Info */}
          {step === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name" className={mounted ? (theme === "dark" ? "text-gray-300" : "") : "text-gray-300"}>
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="John Doe"
                  className={
                    mounted ? (theme === "dark" ? "bg-gray-800 border-gray-700" : "") : "bg-gray-800 border-gray-700"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={mounted ? (theme === "dark" ? "text-gray-300" : "") : "text-gray-300"}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="you@example.com"
                  className={
                    mounted ? (theme === "dark" ? "bg-gray-800 border-gray-700" : "") : "bg-gray-800 border-gray-700"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="skillLevel"
                  className={mounted ? (theme === "dark" ? "text-gray-300" : "") : "text-gray-300"}
                >
                  Skill Level
                </Label>
                <Select value={formData.skillLevel} onValueChange={(v) => handleInputChange("skillLevel", v)}>
                  <SelectTrigger
                    className={
                      mounted ? (theme === "dark" ? "bg-gray-800 border-gray-700" : "") : "bg-gray-800 border-gray-700"
                    }
                  >
                    <SelectValue placeholder="Select your skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {/* Step 2: Date & Time */}
          {step === "datetime" && (
            <motion.div
              key="datetime"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="date" className={mounted ? (theme === "dark" ? "text-gray-300" : "") : "text-gray-300"}>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Select Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={getTomorrowDate()}
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={
                    mounted ? (theme === "dark" ? "bg-gray-800 border-gray-700" : "") : "bg-gray-800 border-gray-700"
                  }
                />
                <p
                  className={cn(
                    "text-xs",
                    mounted ? (theme === "dark" ? "text-gray-400" : "text-gray-500") : "text-gray-400",
                  )}
                >
                  All times are in {PAI_TIMEZONE_LABEL}
                </p>
              </div>
              <div className="space-y-2">
                <Label className={mounted ? (theme === "dark" ? "text-gray-300" : "") : "text-gray-300"}>
                  <Clock className="w-4 h-4 inline mr-2" />
                  Select Time * <span className="text-xs font-normal">({PAI_TIMEZONE_LABEL})</span>
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={formData.time === slot ? "default" : "outline"}
                      onClick={() => handleInputChange("time", slot)}
                      className={cn(
                        formData.time === slot
                          ? "bg-primary text-white"
                          : mounted
                            ? theme === "dark"
                              ? "border-gray-700 hover:bg-gray-800"
                              : ""
                            : "",
                      )}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div
                className={cn(
                  "p-4 rounded-lg",
                  mounted ? (theme === "dark" ? "bg-gray-800" : "bg-gray-100") : "bg-gray-800",
                )}
              >
                <h3
                  className={cn("font-semibold mb-2", mounted ? (theme === "dark" ? "text-white" : "") : "text-white")}
                >
                  Booking Summary
                </h3>
                <div
                  className={cn(
                    "text-sm space-y-1",
                    mounted ? (theme === "dark" ? "text-gray-300" : "text-gray-600") : "text-gray-300",
                  )}
                >
                  <p>Service: {serviceName}</p>
                  <p>Duration: {serviceDuration}</p>
                  {formData.date && <p>Date: {formatDateInPaiTime(formData.date)}</p>}
                  {formData.time && (
                    <p>
                      Time: {formData.time} <span className="text-xs">({PAI_TIMEZONE_LABEL})</span>
                    </p>
                  )}
                  <p className="font-semibold text-lg mt-2">Total: {formatPrice(servicePrice)}</p>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label className={mounted ? (theme === "dark" ? "text-gray-300" : "") : "text-gray-300"}>
                  Payment Method
                </Label>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(v: PaymentMethod) => {
                    handleInputChange("paymentMethod", v)
                    setClientSecret(null)
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="card" id="card" className="peer sr-only" />
                    <Label
                      htmlFor="card"
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                        formData.paymentMethod === "card"
                          ? "border-primary bg-primary/10"
                          : mounted
                            ? theme === "dark"
                              ? "border-gray-700 hover:border-gray-600"
                              : "border-gray-200 hover:border-gray-300"
                            : "border-gray-700 hover:border-gray-600",
                      )}
                    >
                      <CreditCard className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Card</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                    <Label
                      htmlFor="cash"
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all",
                        formData.paymentMethod === "cash"
                          ? "border-primary bg-primary/10"
                          : mounted
                            ? theme === "dark"
                              ? "border-gray-700 hover:border-gray-600"
                              : "border-gray-200 hover:border-gray-300"
                            : "border-gray-700 hover:border-gray-600",
                      )}
                    >
                      <Banknote className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">Cash</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Card Payment Form */}
              {formData.paymentMethod === "card" && (
                <div className="mt-4">
                  {isCreatingIntent && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                  {clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripePaymentForm
                        clientSecret={clientSecret}
                        onSuccess={handlePaymentSuccess}
                        onError={setError}
                        theme={mounted ? theme : "dark"}
                      />
                    </Elements>
                  )}
                </div>
              )}

              {/* Cash Payment */}
              {formData.paymentMethod === "cash" && (
                <div className="space-y-4">
                  <div
                    className={cn(
                      "p-4 rounded-lg",
                      mounted
                        ? theme === "dark"
                          ? "bg-yellow-900/20 border border-yellow-700"
                          : "bg-yellow-50 border border-yellow-200"
                        : "bg-yellow-900/20 border border-yellow-700",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm",
                        mounted ? (theme === "dark" ? "text-yellow-300" : "text-yellow-800") : "text-yellow-300",
                      )}
                    >
                      Pay in cash when you arrive at our gym. Please arrive 10 minutes early.
                    </p>
                  </div>
                  <Button onClick={handleCashPayment} className="w-full bg-primary hover:bg-primary/90">
                    <Banknote className="mr-2 h-4 w-4" />
                    Confirm Booking (Pay at Gym)
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3
                className={cn(
                  "text-xl font-bold mb-2",
                  mounted ? (theme === "dark" ? "text-white" : "") : "text-white",
                )}
              >
                Booking Confirmed!
              </h3>
              <p
                className={cn(
                  "mb-4",
                  mounted ? (theme === "dark" ? "text-gray-300" : "text-gray-600") : "text-gray-300",
                )}
              >
                {formData.paymentMethod === "card"
                  ? "Your payment was successful. A confirmation email has been sent."
                  : "Your booking is confirmed. Please pay in cash when you arrive."}
              </p>
              {paymentId && (
                <p
                  className={cn(
                    "text-sm mb-4",
                    mounted ? (theme === "dark" ? "text-gray-400" : "text-gray-500") : "text-gray-400",
                  )}
                >
                  Payment ID: {paymentId}
                </p>
              )}
              <div
                className={cn(
                  "p-4 rounded-lg mb-4 text-left",
                  mounted ? (theme === "dark" ? "bg-gray-800" : "bg-gray-100") : "bg-gray-800",
                )}
              >
                <p
                  className={cn(
                    "text-sm",
                    mounted ? (theme === "dark" ? "text-gray-300" : "text-gray-600") : "text-gray-300",
                  )}
                >
                  <strong>Service:</strong> {serviceName}
                </p>
                {formData.date && (
                  <p
                    className={cn(
                      "text-sm",
                      mounted ? (theme === "dark" ? "text-gray-300" : "text-gray-600") : "text-gray-300",
                    )}
                  >
                    <strong>Date:</strong> {formatDateInPaiTime(formData.date)}
                  </p>
                )}
                {formData.time && (
                  <p
                    className={cn(
                      "text-sm",
                      mounted ? (theme === "dark" ? "text-gray-300" : "text-gray-600") : "text-gray-300",
                    )}
                  >
                    <strong>Time:</strong> {formData.time} <span className="text-xs">({PAI_TIMEZONE_LABEL})</span>
                  </p>
                )}
                <p
                  className={cn(
                    "text-sm",
                    mounted ? (theme === "dark" ? "text-gray-300" : "text-gray-600") : "text-gray-300",
                  )}
                >
                  <strong>Total:</strong> {formatPrice(servicePrice)}
                </p>
              </div>
              <Button onClick={onClose} className="bg-primary hover:bg-primary/90">
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        {step !== "success" && step !== "payment" && (
          <div className="mt-6 flex gap-3">
            {step !== "info" && (
              <Button
                variant="outline"
                onClick={() => setStep(step === "datetime" ? "info" : "datetime")}
                className={mounted ? (theme === "dark" ? "border-gray-700" : "") : "border-gray-700"}
              >
                Back
              </Button>
            )}
            <Button onClick={handleNextStep} className="flex-1 bg-primary hover:bg-primary/90">
              Continue
            </Button>
          </div>
        )}

        {step === "payment" && formData.paymentMethod !== "cash" && !clientSecret && !isCreatingIntent && (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => setStep(showTimeSlots ? "datetime" : "info")}
              className={mounted ? (theme === "dark" ? "border-gray-700" : "") : "border-gray-700"}
            >
              Back
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default EnhancedPaymentFlow
