"use client"

import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import Link from "next/link"
import { getBlogPostsByCategory } from "@/lib/blog-data"
import { ArrowRight } from "lucide-react"

interface RecommendedArticlesProps {
  currentPostId: string
  category: string
}

export function RecommendedArticles({ currentPostId, category }: RecommendedArticlesProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedTheme = mounted ? theme : "dark"

  // Get 3 posts from the same category, excluding the current post
  const recommendedPosts = getBlogPostsByCategory(category)
    .filter((post) => post.id !== currentPostId)
    .slice(0, 3)

  if (recommendedPosts.length === 0) return null

  return (
    <div className="mt-8 pt-6 border-t border-orange-500/20">
      <h4 className={`text-lg font-semibold mb-4 ${resolvedTheme === "dark" ? "text-amber-300" : "text-amber-700"}`}>
        Recommended Articles
      </h4>
      <div className="grid gap-3">
        {recommendedPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={`/blog#${post.id}`}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                resolvedTheme === "dark" ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  resolvedTheme === "dark" ? "bg-orange-500/20" : "bg-orange-200/60"
                }`}
              >
                <span className="text-2xl">📖</span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    resolvedTheme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {post.title}
                </p>
                <p className={`text-xs ${resolvedTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  {post.category}
                </p>
              </div>
              <ArrowRight
                className={`w-4 h-4 flex-shrink-0 ${resolvedTheme === "dark" ? "text-orange-400" : "text-orange-600"}`}
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
