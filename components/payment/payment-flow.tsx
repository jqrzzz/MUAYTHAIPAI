"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTimeSlotsForService, shouldShowTimeSlots } from "@/lib/booking-config"
import { StepCustomerInfo } from "./step-customer-info"
import { StepDateTime } from "./step-date-time"
import { PaymentSummary } from "./payment-summary"
import { PaymentMethodSelector, CashPaymentForm, OnlinePaymentForm } from "./step-payment"
import { StepSuccess } from "./step-success"
import type { PaymentFlowProps, BookingDetails, PaymentResult, PaymentStep, PaymentMethod } from "./types"
import { useTheme } from "next-themes"

export function PaymentFlow({
  serviceId,
  serviceName,
  servicePrice,
  serviceDuration,
  serviceDescription,
  onClose,
}: PaymentFlowProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  const [currentStep, setCurrentStep] = useState<PaymentStep>("details")
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    name: "",
    email: "",
    date: "",
    time: "",
    skillLevel: "",
    referralSource: "",
  })
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLegallyCompliant, setIsLegallyCompliant] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null)

  useEffect(() => {
    if (bookingDetails.date) {
      if (!shouldShowTimeSlots(serviceName)) {
        setAvailableSlots([])
        return
      }
      const slots = getTimeSlotsForService(serviceName)
      setAvailableSlots(slots)
    }
  }, [bookingDetails.date, serviceName])

  const handleDetailsSubmit = () => {
    setCurrentStep("calendar")
  }

  const handleCalendarSubmit = () => {
    setCurrentStep("payment")
  }

  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentResult(result)
    setCurrentStep("success")
  }

  const handlePaymentError = (error: string) => {
    setPaymentResult({ success: false, error })
  }

  const handleCashPayment = async () => {
    try {
      const response = await fetch("/api/send-booking-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: bookingDetails.name,
          customerEmail: bookingDetails.email,
          serviceType: serviceName,
          bookingDate: bookingDetails.date,
          bookingTime: bookingDetails.time,
          amount: servicePrice,
          paymentMethod: "cash",
        }),
      })

      if (response.ok) {
        setPaymentResult({
          success: true,
          paymentId: "CASH-" + Date.now(),
        })
        setCurrentStep("success")
      } else {
        throw new Error("Failed to send confirmation emails")
      }
    } catch (error) {
      console.error("Error processing cash booking:", error)
      setPaymentResult({
        success: false,
        error: "Failed to confirm booking. Please try again.",
      })
    }
  }

  const serviceDetails = {
    id: serviceId,
    name: serviceName,
    price: servicePrice,
    duration: serviceDuration,
    description: serviceDescription,
  }

  const steps: PaymentStep[] = ["details", "calendar", "payment", "success"]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl ${
          resolvedTheme === "dark" ? "bg-gray-900" : "bg-white"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-inherit">
          <div className="flex items-center gap-4">
            {currentStep !== "details" && currentStep !== "success" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentStep === "calendar") setCurrentStep("details")
                  else if (currentStep === "payment") {
                    setSelectedPaymentMethod(null)
                    setCurrentStep("calendar")
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h2 className={`text-xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
                Book {serviceName}
              </h2>
              <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                ฿{servicePrice.toLocaleString()} • {serviceDuration}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-4 md:p-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-6 md:mb-8">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium ${
                    currentStep === step
                      ? "bg-orange-600 text-white"
                      : index < steps.indexOf(currentStep)
                        ? "bg-green-600 text-white"
                        : resolvedTheme === "dark"
                          ? "bg-gray-700 text-gray-400"
                          : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index < steps.indexOf(currentStep) ? <CheckCircle className="h-3 w-3 md:h-4 md:w-4" /> : index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`w-8 md:w-12 h-0.5 mx-1 md:mx-2 ${
                      index < steps.indexOf(currentStep)
                        ? "bg-green-600"
                        : resolvedTheme === "dark"
                          ? "bg-gray-700"
                          : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {currentStep === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepCustomerInfo
                  bookingDetails={bookingDetails}
                  onBookingDetailsChange={setBookingDetails}
                  onSubmit={handleDetailsSubmit}
                />
              </motion.div>
            )}

            {currentStep === "calendar" && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepDateTime
                  serviceName={serviceName}
                  bookingDetails={bookingDetails}
                  onBookingDetailsChange={setBookingDetails}
                  availableSlots={availableSlots}
                  onSubmit={handleCalendarSubmit}
                />
              </motion.div>
            )}

            {currentStep === "payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="space-y-4 md:space-y-6">
                  <PaymentSummary
                    serviceName={serviceName}
                    servicePrice={servicePrice}
                    serviceDuration={serviceDuration}
                    bookingDetails={bookingDetails}
                  />

                  {!selectedPaymentMethod && <PaymentMethodSelector onSelect={setSelectedPaymentMethod} />}

                  {selectedPaymentMethod === "cash" && (
                    <CashPaymentForm
                      servicePrice={servicePrice}
                      isLegallyCompliant={isLegallyCompliant}
                      onComplianceChange={setIsLegallyCompliant}
                      onSubmit={handleCashPayment}
                    />
                  )}

                  {selectedPaymentMethod && selectedPaymentMethod !== "cash" && (
                    <OnlinePaymentForm
                      selectedPaymentMethod={selectedPaymentMethod}
                      bookingDetails={bookingDetails}
                      serviceDetails={serviceDetails}
                      isLegallyCompliant={isLegallyCompliant}
                      onComplianceChange={setIsLegallyCompliant}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === "success" && paymentResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <StepSuccess
                  paymentResult={paymentResult}
                  serviceName={serviceName}
                  servicePrice={servicePrice}
                  bookingDetails={bookingDetails}
                  onClose={onClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
