"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Heart, MessageCircle, BoxIcon as Boxing, Dumbbell, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import { MoreMenu } from "@/components/more-menu"

export function SiteFooterMenu() {
  const { theme } = useTheme()
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu)
  }

  const resolvedTheme = mounted ? theme : "dark"

  return (
    <>
      <motion.div
        className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t ${
          resolvedTheme === "dark" ? "bg-black/80 border-white/10" : "bg-white/90 border-gray-200"
        }`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <div className="flex justify-around py-3 px-4">
          {[
            { icon: Heart, label: "Family", href: "/" },
            { icon: Boxing, label: "Classes", href: "/classes" },
            { icon: Dumbbell, label: "Gym", href: "/gym" },
            { icon: MessageCircle, label: "Contact", href: "/contact" },
            { icon: Menu, label: "More", isButton: true },
          ].map((item) =>
            item.isButton ? (
              <motion.button
                key={item.label}
                onClick={toggleMoreMenu}
                className={`flex flex-col items-center gap-1 ${
                  resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {React.createElement(item.icon, { className: "w-5 h-5" })}
                <span className="text-xs font-medium">{item.label}</span>
              </motion.button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center gap-1 ${
                  resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {React.createElement(item.icon, { className: "w-5 h-5" })}
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ),
          )}
        </div>
      </motion.div>
      <MoreMenu isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} />
    </>
  )
}
