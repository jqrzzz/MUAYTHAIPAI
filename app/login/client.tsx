"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

import { SacredBackground, DynamicGradient } from "@/components/sacred-background"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, CreditCard, CheckCircle } from "lucide-react"

// Admin login is now at /admin/login

export default function LoginClient() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [onlineSubscriptionSuccess, setOnlineSubscriptionSuccess] = useState<boolean>(false)
  const [onlinePaymentDetails, setOnlinePaymentDetails] = useState({
    email: "",
    cardNumber: "",
    expiryDate: "",
    cvc: "",
  })

  const [studentEmail, setStudentEmail] = useState("")
  const [studentPassword, setStudentPassword] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  const handleStudentSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    // Redirect to student login which handles auth, then they can access /courses
    window.location.href = `/student/login?redirect=/courses`
  }

  const handleOnlinePaymentSubmit = (e: React.FormEvent, paymentMethod: string) => {
    e.preventDefault()
    console.log(`Processing online subscription payment via ${paymentMethod}:`, onlinePaymentDetails)
    setTimeout(() => {
      setOnlineSubscriptionSuccess(true)
      console.log("Online subscription payment successful!")
    }, 1500)
  }

  if (!mounted) return null

  return (
    <div
      className={`min-h-screen overflow-hidden relative transition-all duration-500 ${
        theme === "dark"
          ? "bg-gradient-to-b from-black via-neutral-900 to-black"
          : "bg-gradient-to-b from-neutral-100 via-white to-neutral-50"
      }`}
    >
      <h1 className="sr-only">Online Courses Login</h1>

      <DynamicGradient />
      <SacredBackground />
      <SiteHeader hideSoundButton={true} />

      <main className="container relative z-10 flex flex-grow flex-col items-center justify-center py-12 text-center">
        <motion.h1
          className={`text-4xl md:text-5xl font-black mb-2 ${
            theme === "dark"
              ? "bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent"
              : "bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent"
          }`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Online Muay Thai Courses
        </motion.h1>
        <motion.p
          className={`mt-4 text-base sm:text-lg max-w-2xl mx-auto font-bold tracking-widest ${
            theme === "dark" ? "text-amber-200/90" : "text-amber-800/90"
          }`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Learn authentic Muay Thai from anywhere. Video lessons with Thai instructors.
        </motion.p>

        {/* Student Sign In Card */}
        <motion.div
          className={`mt-8 w-full max-w-md relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${
            theme === "dark" ? "bg-orange-950/30 border-orange-500/20" : "bg-orange-100/60 border-orange-600/30"
          }`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          whileHover={{ scale: 1.02 }}
          style={{
            boxShadow: `0 0 15px rgba(249, 115, 22, ${theme === "dark" ? "0.4" : "0.5"})`,
          }}
        >
          <Card className="bg-transparent border-none shadow-none text-left">
            <CardHeader className="space-y-1 p-6">
              <CardTitle
                className={`text-xl sm:text-2xl font-bold ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent"
                }`}
              >
                Student Sign In
              </CardTitle>
              <CardDescription className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Access your online courses and certifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
              <form onSubmit={handleStudentSignIn} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="student-email" className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Email
                  </Label>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="student@example.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    required
                    className={`${
                      theme === "dark"
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-neutral-50 border-neutral-200 text-black"
                    }`}
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="student-password"
                    className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Password
                  </Label>
                  <Input
                    id="student-password"
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    required
                    className={`${
                      theme === "dark"
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-neutral-50 border-neutral-200 text-black"
                    }`}
                  />
                </div>
                <Button
                  type="submit"
                  className={`w-full py-3 rounded-xl font-bold text-white mt-2 ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500"
                      : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  }`}
                >
                  Sign In
                </Button>
              </form>
              <p className={`text-xs text-center mt-4 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                Online courses launching soon. Subscribe below to get early access.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Online Subscription - Unchanged */}
        <motion.div
          className={`mt-8 w-full max-w-md relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${
            expandedSection === "online-subscription"
              ? "border-orange-700/50"
              : theme === "dark"
                ? "bg-orange-950/30 border-orange-500/20"
                : "bg-orange-100/60 border-orange-600/30"
          }`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          whileHover={{ scale: expandedSection === "online-subscription" ? 1 : 1.02 }}
          style={{
            boxShadow: `0 0 15px rgba(249, 115, 22, ${theme === "dark" ? "0.4" : "0.5"})`,
          }}
        >
          <Card className="bg-transparent border-none shadow-none text-left">
            <CardHeader className="space-y-1 p-6">
              <CardTitle
                className={`text-xl sm:text-2xl font-bold ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-amber-900 to-orange-900 bg-clip-text text-transparent"
                }`}
              >
                Online Subscription
              </CardTitle>
              <CardDescription className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Unlock all online courses and exclusive content.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
              <div className="flex flex-col items-center gap-4">
                <p
                  className={`text-4xl font-extrabold ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent"
                  }`}
                >
                  330 THB / month
                </p>
                <motion.div
                  onClick={() => {
                    toggleSection("online-subscription")
                    setOnlineSubscriptionSuccess(false)
                  }}
                  className={`flex justify-between items-center cursor-pointer rounded-xl p-4 transition-all duration-300 w-full ${
                    theme === "dark"
                      ? "bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700"
                      : "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600"
                  } text-white`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CreditCard className="w-6 h-6" /> Subscribe Now
                  </h2>
                  {expandedSection === "online-subscription" ? (
                    <ChevronUp className="w-6 h-6" />
                  ) : (
                    <ChevronDown className="w-6 h-6" />
                  )}
                </motion.div>
              </div>

              <AnimatePresence>
                {expandedSection === "online-subscription" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="mt-6 pt-6 border-t border-orange-500/20"
                  >
                    {onlineSubscriptionSuccess ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                        <p
                          className={`text-lg font-semibold text-center ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                        >
                          Subscription Confirmed!
                        </p>
                        <p className={`text-sm text-center ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          You now have access to all online courses.
                        </p>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOnlineSubscriptionSuccess(false)
                            setExpandedSection(null)
                          }}
                          className="mt-4"
                        >
                          Close
                        </Button>
                      </div>
                    ) : (
                      <form className="grid gap-4">
                        <h4
                          className={`text-lg font-bold mt-4 mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                        >
                          Enter your email for login code
                        </h4>
                        <div className="grid gap-2">
                          <Label htmlFor="online-email" className="sr-only">
                            Email
                          </Label>
                          <Input
                            id="online-email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={onlinePaymentDetails.email}
                            onChange={(e) =>
                              setOnlinePaymentDetails({ ...onlinePaymentDetails, email: e.target.value })
                            }
                            className={`${
                              theme === "dark"
                                ? "bg-black/20 border-white/20 text-white"
                                : "bg-white/50 border-gray-300 text-gray-800"
                            }`}
                            required
                          />
                        </div>
                        <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                          * This is a UI representation. Actual payment processing requires backend integration.
                        </p>
                        <Button
                          type="submit"
                          onClick={(e) => handleOnlinePaymentSubmit(e, "Credit Card")}
                          className={`w-full mt-4 ${
                            theme === "dark"
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                              : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                          }`}
                        >
                          <CreditCard className="mr-2 h-4 w-4" /> Pay with Card
                        </Button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </main>

    </div>
  )
}
