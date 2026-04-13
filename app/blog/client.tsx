"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Moon, Sun, ArrowLeft, Heart, MessageCircle, BoxIcon as Boxing, Dumbbell, Menu, Search, X } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MoreMenu } from "@/components/more-menu"
import { blogPosts, type BlogCategory, getBlogPostsByCategory } from "@/lib/blog-data"
import { CategoryFilter } from "@/components/blog/category-filter"
import { RecommendedArticles } from "@/components/blog/recommended-articles"
import { InternalLinks } from "@/components/blog/internal-links"
import { ContinueLearning } from "@/components/blog/continue-learning"

export default function BlogClient() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [muted, setMuted] = useState(true)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredPosts, setFilteredPosts] = useState(blogPosts)
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory>("All")

  useEffect(() => {
    setMounted(true)

    const splashTimer = setTimeout(() => {
      setShowContent(true)
    }, 2000)

    return () => {
      clearTimeout(splashTimer)
    }
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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const toggleMute = () => {
    setMuted(!muted)
  }

  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu)
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
          className={`${theme === "dark" ? "bg-orange-500/30 text-orange-200" : "bg-orange-200/60 text-orange-800"} px-1 rounded`}
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
    <div
      className={`min-h-screen overflow-hidden relative transition-all duration-500 ${
        theme === "dark"
          ? "bg-gradient-to-b from-black via-neutral-900 to-black"
          : "bg-gradient-to-b from-neutral-100 via-white to-neutral-50"
      }`}
    >
      <div
        className={`absolute inset-0 z-10 ${
          theme === "dark"
            ? "bg-gradient-to-br from-orange-600/25 via-transparent to-amber-600/20"
            : "bg-gradient-to-br from-orange-500/20 via-transparent to-orange-400/15"
        }`}
      />

      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div
            key="blog-splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-20 flex items-center justify-center min-h-screen"
          >
            <div className="text-center">
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
                Wisdom & Stories
              </motion.h1>
              <motion.p
                className={`text-lg font-bold tracking-widest ${
                  theme === "dark" ? "text-amber-200/90" : "text-amber-800/90"
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                MUAY THAI PAI BLOG
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="blog-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20 min-h-screen"
          >
            {/* Top Navigation */}
            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
              <motion.div
                className="flex gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/"
                  className={`backdrop-blur-md rounded-full p-3 border transition-colors ${
                    theme === "dark"
                      ? "bg-white/10 border-white/20 hover:bg-white/20"
                      : "bg-black/10 border-black/20 hover:bg-black/20"
                  }`}
                  aria-label="Back to home"
                >
                  <ArrowLeft className={`w-5 h-5 ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`} />
                </Link>
              </motion.div>

              <motion.div
                className="absolute top-4 right-4 z-50"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={toggleTheme}
                  className={`backdrop-blur-md rounded-full p-3 border transition-colors ${
                    theme === "dark"
                      ? "bg-white/10 border-white/20 hover:bg-white/20"
                      : "bg-black/10 border-black/20 hover:bg-black/20"
                  }`}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-orange-600" />
                  )}
                </button>
              </motion.div>
            </div>

            {/* Page Title */}
            <motion.h2
              className={`text-3xl md:text-4xl font-black text-center pt-24 pb-4 ${
                theme === "dark"
                  ? "bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-500 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent"
              }`}
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
              <p
                className={`text-base md:text-lg leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
              >
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
                    className={`backdrop-blur-md rounded-full p-3 border transition-colors ${
                      theme === "dark"
                        ? "bg-white/10 border-white/20 hover:bg-white/20"
                        : "bg-black/10 border-black/20 hover:bg-black/20"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Search blog posts"
                  >
                    <Search className={`w-5 h-5 ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`} />
                  </motion.button>
                ) : (
                  <motion.div
                    key="search-bar"
                    initial={{ width: 48, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 48, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`backdrop-blur-md rounded-full border flex items-center px-4 py-3 ${
                      theme === "dark" ? "bg-white/10 border-white/20" : "bg-black/10 border-black/20"
                    }`}
                  >
                    <Search className={`w-5 h-5 mr-3 ${theme === "dark" ? "text-amber-400" : "text-orange-600"}`} />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`flex-1 bg-transparent outline-none text-sm ${
                        theme === "dark" ? "text-white placeholder-gray-400" : "text-gray-800 placeholder-gray-500"
                      }`}
                      autoFocus
                    />
                    <button onClick={toggleSearch} className="ml-2 p-1 rounded-full">
                      <X className={`w-4 h-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Blog Posts */}
            <div className="flex flex-col items-center justify-center px-4 py-8 gap-6 pb-32">
              {filteredPosts.length === 0 ? (
                <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className={`text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
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
                          className={`relative backdrop-blur-xl rounded-2xl overflow-hidden border shadow-lg transition-all duration-300 ${
                            theme === "dark"
                              ? "bg-orange-950/30 border-orange-500/20"
                              : "bg-orange-100/60 border-orange-600/30"
                          }`}
                        >
                          <AccordionTrigger
                            className={`px-6 py-4 text-left hover:no-underline transition-colors ${
                              theme === "dark"
                                ? "text-amber-700 data-[state=open]:bg-orange-500/20"
                                : "text-amber-900 data-[state=open]:bg-orange-500/10"
                            }`}
                          >
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center justify-between w-full mb-2">
                                <span
                                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    theme === "dark"
                                      ? "bg-orange-500/20 text-orange-300"
                                      : "bg-orange-200/60 text-orange-700"
                                  }`}
                                >
                                  {post.category}
                                </span>
                                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                  {new Date(post.date).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-xl md:text-2xl font-semibold mb-2">
                                {highlightText(post.title, searchQuery)}
                              </h3>
                              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                {highlightText(post.excerpt, searchQuery)}
                              </p>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6 pt-2">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-6" />
                            <div className={`space-y-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                              <p>{highlightText(post.content, searchQuery)}</p>
                              <div className="flex flex-wrap gap-2 mt-4">
                                {post.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      theme === "dark" ? "bg-white/10 text-gray-300" : "bg-black/5 text-gray-600"
                                    }`}
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

            {/* Bottom Navigation */}
            <motion.div
              className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t ${
                theme === "dark" ? "bg-black/80 border-white/10" : "bg-white/90 border-gray-200"
              }`}
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
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
                      className={theme === "dark" ? "text-gray-400" : "text-gray-500"}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <item.icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                    </motion.button>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex flex-col items-center gap-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  ),
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MoreMenu isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} />
    </div>
  )
}
