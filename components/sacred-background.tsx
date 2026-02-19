"use client"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export function SacredBackground() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  return (
    <div className="absolute inset-0 z-5 opacity-10">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L60 30 L90 30 L65 50 L75 80 L50 65 L25 80 L35 50 L10 30 L40 30 Z' fill='none' stroke='%23${
            resolvedTheme === "dark" ? "ffffff" : "000000"
          }' strokeWidth='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
          backgroundPosition: "center",
          opacity: 0.05,
        }}
      />
    </div>
  )
}

export function DynamicGradient() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  return (
    <div
      className={`absolute inset-0 z-10 ${
        resolvedTheme === "dark"
          ? "bg-gradient-to-br from-orange-600/25 via-transparent to-amber-600/20"
          : "bg-gradient-to-br from-orange-500/20 via-transparent to-orange-400/15"
      }`}
    />
  )
}
