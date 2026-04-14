"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { blogPosts, type BlogCategory, getBlogPostsByCategory } from "@/lib/blog-data"
import { CategoryFilter } from "@/components/blog/category-filter"
import { RecommendedArticles } from "@/components/blog/recommended-articles"
import { InternalLinks } from "@/components/blog/internal-links"
import { ContinueLearning } from "@/components/blog/continue-learning"
import {
  PageBackground,
  MarketingTopNav,
  MarketingBottomNav,
  SplashScreen,
  useSplash,
  CONTENT_FADE_IN,
  EXPAND_COLLAPSE,
} from "@/components/marketing"

export default function BlogClient() {
  const [mounted, setMounted] = useState(false)
  const showContent = useSplash()
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredPosts, setFilteredPosts] = useState(blogPosts)
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory>("All")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let posts = selectedCategory === "All" ? blogPosts : getBlogPostsByCategory(selectedCategory)

    if (searchQuery.trim()) {
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredPosts(posts)
  }, [searchQuery, selectedCategory])

  const handleCategoryChange = (category: BlogCategory) => {
    setSelectedCategory(category)
  }

  const toggleSearch = () => {
    setShowSearch(!showSearch)
    if (showSearch) {
      setSearchQuery("")
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-orange-200/60 text-orange-800 dark:bg-orange-500/30 dark:text-orange-200 px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  if (!mounted) {
    return null
  }

  return (
    <PageBackground>
      <h1 className="sr-only">Muay Thai Pai Blog</h1>

      <AnimatePresence mode="wait">
        {!showContent ? (
          <SplashScreen key="blog-splash" title="Wisdom & Stories" subtitle="MUAY THAI PAI BLOG" />
        ) : (
          <motion.div
            key="blog-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={CONTENT_FADE_IN}
            className="relative z-20 min-h-screen"
          >
            <MarketingTopNav />

            <motion.h2
              className="text-3xl md:text-4xl font-black text-center pt-24 pb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              WISDOM & STORIES
            </motion.h2>

            <motion.section
              className="text-center px-4 max-w-3xl mx-auto mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <p className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                Insights from our Muay Thai family, sharing knowledge and experiences from the heart of Thailand.
              </p>
            </motion.section>

            <motion.div
              className="max-w-2xl mx-auto mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
            </motion.div>

            {/* Search */}
            <motion.div
              className="fixed top-20 right-4 z-40"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <AnimatePresence>
                {!showSearch ? (
                  <motion.button
                    key="search-button"
                    onClick={toggleSearch}
                    className="backdrop-blur-md rounded-full p-3 border transition-colors bg-black/10 border-black/20 hover:bg-black/20 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Search blog posts"
                  >
                    <Search className="w-5 h-5 text-orange-600 dark:text-amber-400" />
                  </motion.button>
                ) : (
                  <motion.div
                    key="search-bar"
                    initial={{ width: 48, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 48, opacity: 0 }}
                    transition={EXPAND_COLLAPSE}
                    className="backdrop-blur-md rounded-full border flex items-center px-4 py-3 bg-black/10 border-black/20 dark:bg-white/10 dark:border-white/20"
                  >
                    <Search className="w-5 h-5 mr-3 text-orange-600 dark:text-amber-400" />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-500 dark:text-white dark:placeholder-gray-400"
                      autoFocus
                    />
                    <button onClick={toggleSearch} className="ml-2 p-1 rounded-full">
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Blog Posts */}
            <div className="flex flex-col items-center justify-center px-4 py-8 gap-6 pb-32">
              {filteredPosts.length === 0 ? (
                <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    No articles found in this category.
                  </p>
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className="mt-4 text-primary hover:underline underline-offset-4"
                  >
                    View all articles
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      id={post.id}
                      className="w-full max-w-md"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
                      layout
                    >
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem
                          value={post.id}
                          className="relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 bg-orange-100/60 border-orange-600/30 dark:bg-orange-950/30 dark:border-orange-500/20"
                        >
                          <AccordionTrigger className="px-6 py-4 text-left hover:no-underline transition-colors text-amber-900 data-[state=open]:bg-orange-500/10 dark:text-amber-700 dark:data-[state=open]:bg-orange-500/20">
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center justify-between w-full mb-2">
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-200/60 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                                  {post.category}
                                </span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {new Date(post.date).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-xl md:text-2xl font-semibold mb-2">
                                {highlightText(post.title, searchQuery)}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {highlightText(post.excerpt, searchQuery)}
                              </p>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6 pt-2">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                            <div className="space-y-4 text-gray-700 dark:text-gray-300">
                              <p>{highlightText(post.content, searchQuery)}</p>
                              <div className="flex flex-wrap gap-2 mt-4">
                                {post.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-2 py-1 rounded-full bg-black/5 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                                  >
                                    #{highlightText(tag, searchQuery)}
                                  </span>
                                ))}
                              </div>

                              <InternalLinks />

                              <RecommendedArticles currentPostId={post.id} category={post.category} />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              <div className="w-full max-w-md">
                <ContinueLearning excludeLinks={["/blog"]} />
              </div>
            </div>

            <MarketingBottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </PageBackground>
  )
}
