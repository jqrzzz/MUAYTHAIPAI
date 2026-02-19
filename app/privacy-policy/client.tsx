"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

export function PrivacyPolicyClient() {
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
            Privacy Policy
          </h1>

          <div className="prose prose-lg max-w-none space-y-8">
            <p className={`mb-6 ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>
            {/* rest of code here */}
          </div>
        </div>
      </div>
    </div>
  )
}
