"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { CreditCard, Smartphone, Building, Banknote, Check } from "lucide-react"
import { PaymentAPI } from "@/lib/payment-api"
import type { PRICING } from "@/lib/payment-config"

interface PaymentOptionsProps {
  serviceType: keyof typeof PRICING
  amount: number
  onPaymentSelect: (method: string) => void
}

export function PaymentOptions({ serviceType, amount, onPaymentSelect }: PaymentOptionsProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [promptPayQR, setPromptPayQR] = useState<string>("")

  const paymentMethods = PaymentAPI.getPaymentMethods(serviceType)

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId)
    onPaymentSelect(methodId)

    // Generate PromptPay QR if selected
    if (methodId === "promptpay") {
      const qrUrl = PaymentAPI.generatePromptPayQR(amount)
      setPromptPayQR(qrUrl)
    }
  }

  const getMethodIcon = (methodId: string) => {
    switch (methodId) {
      case "promptpay":
        return <Smartphone className="w-6 h-6" />
      case "stripe":
        return <CreditCard className="w-6 h-6" />
      case "bank_transfer":
        return <Building className="w-6 h-6" />
      case "cash":
        return <Banknote className="w-6 h-6" />
      default:
        return <CreditCard className="w-6 h-6" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className={`text-2xl font-bold mb-2 ${resolvedTheme === "dark" ? "text-white" : "text-gray-800"}`}>
          Choose Payment Method
        </h3>
        <p className={`text-lg ${resolvedTheme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Total: ฿{amount.toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4">
        {paymentMethods.map((method) => (
          <motion.div
            key={method.id}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
              selectedMethod === method.id
                ? resolvedTheme === "dark"
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-orange-500 bg-orange-50"
                : resolvedTheme === "dark"
                  ? "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                  : "border-gray-200 bg-white hover:border-gray-300"
            }`}
            onClick={() => handleMethodSelect(method.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {method.recommended && (
              <div className="absolute -top-2 left-4 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                Recommended
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${resolvedTheme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                  {getMethodIcon(method.id)}
                </div>
                <div>
                  <h4 className={`font-semibold ${resolvedTheme === "dark" ? "text-white" : "text-gray-800"}`}>
                    {method.name}
                  </h4>
                  <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {method.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-medium ${method.fee === "Free" ? "text-green-500" : resolvedTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                >
                  {method.fee}
                </p>
                {selectedMethod === method.id && <Check className="w-5 h-5 text-orange-500 mt-1" />}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* PromptPay QR Code */}
      {selectedMethod === "promptpay" && promptPayQR && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center p-6 rounded-xl ${resolvedTheme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
        >
          <h4 className={`font-semibold mb-4 ${resolvedTheme === "dark" ? "text-white" : "text-gray-800"}`}>
            Scan QR Code with Your Banking App
          </h4>
          <img
            src={promptPayQR || "/placeholder.svg"}
            alt="PromptPay QR Code"
            className="mx-auto mb-4 rounded-lg shadow-lg"
          />
          <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Amount: ฿{amount.toLocaleString()} • Instant confirmation
          </p>
        </motion.div>
      )}

      {/* Bank Transfer Details */}
      {selectedMethod === "bank_transfer" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl ${resolvedTheme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
        >
          <h4 className={`font-semibold mb-4 ${resolvedTheme === "dark" ? "text-white" : "text-gray-800"}`}>
            Bank Transfer Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}>Bank:</span>
              <span className={resolvedTheme === "dark" ? "text-white" : "text-gray-800"}>Kasikorn Bank</span>
            </div>
            <div className="flex justify-between">
              <span className={resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}>Account Name:</span>
              <span className={resolvedTheme === "dark" ? "text-white" : "text-gray-800"}>Wisarut Family Gym</span>
            </div>
            <div className="flex justify-between">
              <span className={resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}>Account Number:</span>
              <span className="text-gray-800">xxx-x-xxxxx-x</span>
            </div>
            <div className="flex justify-between">
              <span className={resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}>Amount:</span>
              <span className="font-semibold text-orange-500">฿{amount.toLocaleString()}</span>
            </div>
          </div>
          <p className={`text-xs mt-4 ${resolvedTheme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
            Please send us the transfer receipt via WhatsApp or email
          </p>
        </motion.div>
      )}

      {/* Cash Payment Info */}
      {selectedMethod === "cash" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl ${resolvedTheme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
        >
          <h4 className={`font-semibold mb-4 ${resolvedTheme === "dark" ? "text-white" : "text-gray-800"}`}>
            Pay at the Gym
          </h4>
          <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            You can pay ฿{amount.toLocaleString()} in cash when you arrive for your training session. Please arrive 15
            minutes early for payment and preparation.
          </p>
        </motion.div>
      )}
    </div>
  )
}
