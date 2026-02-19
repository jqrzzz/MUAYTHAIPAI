"use client"

import { Check } from "lucide-react"

interface BookingProgressIndicatorProps {
  currentStep: number
  steps: string[]
  className?: string
}

export function BookingProgressIndicator({ currentStep, steps, className = "" }: BookingProgressIndicatorProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index < currentStep
                    ? "bg-green-600 text-white"
                    : index === currentStep
                      ? "bg-orange-600 text-white"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${index <= currentStep ? "text-orange-600" : "text-gray-400"}`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-colors ${
                  index < currentStep ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
