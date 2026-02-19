"use client"

import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/blog-data"

interface CategoryFilterProps {
  selectedCategory: BlogCategory
  onCategoryChange: (category: BlogCategory) => void
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-2">
      <div className="flex gap-2 px-4 min-w-max">
        {BLOG_CATEGORIES.map((category) => (
          <motion.button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category
                ? resolvedTheme === "dark"
                  ? "bg-orange-500 text-white"
                  : "bg-orange-600 text-white"
                : resolvedTheme === "dark"
                  ? "bg-white/10 text-gray-300 hover:bg-white/20"
                  : "bg-black/5 text-gray-700 hover:bg-black/10"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {category}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
