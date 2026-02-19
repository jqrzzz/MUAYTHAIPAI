"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

export function TermsConditionsClient() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  return (
    <div
      className={`min-h-screen ${resolvedTheme === "dark" ? "bg-gradient-to-b from-orange-900/20 to-black" : "bg-gradient-to-b from-orange-50 to-white"}`}
    >
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-4xl font-bold mb-8 ${resolvedTheme === "dark" ? "text-white" : "text-gray-900"}`}>
            Terms and Conditions
          </h1>
          {/* Additional content can be added here */}
        </div>
      </div>
    </div>
  )
}
