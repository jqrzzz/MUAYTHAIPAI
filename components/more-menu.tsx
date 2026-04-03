"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Calendar, Users, Award, Plane, Swords, Phone, HelpCircle, PenTool, User, Shield, Globe, Building2, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"

interface MoreMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const menuItems = [
    {
      icon: Calendar,
      label: "Train & Stay",
      href: "/train-and-stay",
      description: "Complete packages with accommodation",
    },
    {
      icon: Award,
      label: "Certificate Programs",
      href: "/certificate-programs",
      description: "Professional Muay Thai certifications",
    },
    {
      icon: GraduationCap,
      label: "Online Courses",
      href: "/courses",
      description: "Learn Muay Thai with video lessons",
    },
    {
      icon: Users,
      label: "Apprenticeship",
      href: "/apprenticeship",
      description: "Intensive training programs",
    },
    {
      icon: Plane,
      label: "Education Visas",
      href: "/education-visas",
      description: "Study visa assistance",
    },
    {
      icon: Swords,
      label: "Fighters",
      href: "/fighters",
      description: "Browse the OckOck fighter registry",
    },
    {
      icon: Phone,
      label: "Careers",
      href: "/careers",
      description: "Join our team",
    },
    {
      icon: PenTool,
      label: "Blog",
      href: "/blog",
      description: "Training tips and insights",
    },
    {
      icon: HelpCircle,
      label: "FAQ",
      href: "/faq",
      description: "Frequently asked questions",
    },
  ]

  const loginItems = [
    {
      icon: User,
      label: "Student Login",
      href: "/student/login",
      description: "Access your training dashboard",
    },
    {
      icon: Users,
      label: "Trainer Login",
      href: "/trainer/login",
      description: "Trainer dashboard (ครูมวย)",
    },
    {
      icon: Shield,
      label: "Gym Owner Login",
      href: "/admin/login",
      description: "Gym management dashboard",
    },
  ]

  const resolvedTheme = mounted ? theme : "dark"

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed inset-x-0 bottom-0 z-50 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto ${
              resolvedTheme === "dark" ? "bg-neutral-900" : "bg-white"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${resolvedTheme === "dark" ? "text-white" : "text-gray-800"}`}>
                More Options
              </h2>
              <button
                onClick={onClose}
                className={`rounded-full p-2 transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center ${
                  resolvedTheme === "dark"
                    ? "bg-white/10 text-gray-300 hover:bg-white/20"
                    : "bg-black/5 text-gray-600 hover:bg-black/10"
                }`}
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="grid gap-3">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 min-h-[72px] ${
                      resolvedTheme === "dark"
                        ? "bg-white/5 hover:bg-white/10 text-white"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div
                      className={`rounded-full p-3 ${
                        resolvedTheme === "dark" ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.label}</h3>
                      <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Network Section */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3
                className={`text-sm font-semibold mb-3 ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                Muay Thai Network
              </h3>
              <div className="grid gap-3">
                {[
                  {
                    icon: Globe,
                    label: "Browse Gyms",
                    href: "/gyms",
                    description: "Find Muay Thai gyms across Thailand",
                  },
                  {
                    icon: Building2,
                    label: "List Your Gym",
                    href: "/signup",
                    description: "Join the network — free 30-day trial",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (menuItems.length + index) * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 min-h-[72px] ${
                        resolvedTheme === "dark"
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-500/20"
                          : "bg-emerald-50 hover:bg-emerald-100 text-gray-800 border border-emerald-200"
                      }`}
                    >
                      <div
                        className={`rounded-full p-3 ${
                          resolvedTheme === "dark"
                            ? "bg-emerald-500/30 text-emerald-400"
                            : "bg-emerald-200 text-emerald-600"
                        }`}
                      >
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.label}</h3>
                        <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Login Section */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3
                className={`text-sm font-semibold mb-3 ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                Account Access
              </h3>
              <div className="grid gap-3">
                {loginItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (menuItems.length + index) * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 min-h-[72px] ${
                        resolvedTheme === "dark"
                          ? "bg-orange-500/10 hover:bg-orange-500/20 text-white border border-orange-500/20"
                          : "bg-orange-50 hover:bg-orange-100 text-gray-800 border border-orange-200"
                      }`}
                    >
                      <div
                        className={`rounded-full p-3 ${
                          resolvedTheme === "dark"
                            ? "bg-orange-500/30 text-orange-400"
                            : "bg-orange-200 text-orange-600"
                        }`}
                      >
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.label}</h3>
                        <p className={`text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className={`text-center text-sm ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Need help? Contact us directly via WhatsApp or visit our gym in Pai, Thailand.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
