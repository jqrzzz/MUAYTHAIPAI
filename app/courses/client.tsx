"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Loader2,
  Clock,
  BookOpen,
  Award,
  Dumbbell,
  Filter,
  ChevronRight,
} from "lucide-react"

interface Course {
  id: string
  title: string
  slug: string
  short_description: string | null
  cover_image_url: string | null
  difficulty: string
  category: string
  certificate_level: string | null
  is_free: boolean
  price_thb: number
  total_modules: number
  total_lessons: number
  estimated_hours: number
  is_featured: boolean
  organizations: { name: string; slug: string; logo_url: string | null } | null
}

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "technique", label: "Technique" },
  { key: "conditioning", label: "Conditioning" },
  { key: "certification", label: "Certification" },
  { key: "sparring", label: "Sparring" },
  { key: "clinch", label: "Clinch" },
  { key: "culture", label: "Culture" },
]

const DIFFICULTIES = [
  { key: "", label: "All Levels" },
  { key: "beginner", label: "Beginner" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced", label: "Advanced" },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-500/15 text-emerald-400",
  intermediate: "bg-amber-500/15 text-amber-400",
  advanced: "bg-red-500/15 text-red-400",
  "all-levels": "bg-blue-500/15 text-blue-400",
}

export default function CoursesClient() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState("")

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = new URLSearchParams()
      if (category) params.set("category", category)
      if (difficulty) params.set("difficulty", difficulty)

      const res = await fetch(`/api/public/courses?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
      }
      setLoading(false)
    }
    load()
  }, [category, difficulty])

  const filtered = search
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.short_description?.toLowerCase().includes(search.toLowerCase())
      )
    : courses

  const featured = filtered.filter((c) => c.is_featured)
  const regular = filtered.filter((c) => !c.is_featured)

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Learn Muay Thai</h1>
              <p className="mt-1 text-sm text-neutral-400">
                Structured courses from fundamentals to fight-ready
              </p>
            </div>
            <Link
              href="/certificate-programs"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <Award className="h-3.5 w-3.5" />
              Certification Path
            </Link>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Filters */}
          <div className="mt-3 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-neutral-500" />
              <div className="flex gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      category === cat.key
                        ? "bg-orange-500/15 text-orange-400"
                        : "bg-white/5 text-neutral-500 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-1">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    difficulty === d.key
                      ? "bg-orange-500/15 text-orange-400"
                      : "bg-white/5 text-neutral-500 hover:text-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-neutral-700" />
            <p className="text-neutral-400">No courses found</p>
            <p className="mt-1 text-sm text-neutral-600">
              {search ? "Try a different search" : "Courses coming soon — check back!"}
            </p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
                  Featured
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {featured.map((course) => (
                    <CourseCard key={course.id} course={course} featured />
                  ))}
                </div>
              </section>
            )}

            {/* All courses */}
            <section>
              {featured.length > 0 && (
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-neutral-500">
                  All Courses
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regular.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function CourseCard({ course, featured }: { course: Course; featured?: boolean }) {
  return (
    <Link href={`/courses/${course.slug}`}>
      <div
        className={`group rounded-xl border transition-colors ${
          featured
            ? "border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40"
            : "border-white/10 bg-white/[0.03] hover:border-white/20"
        }`}
      >
        {/* Cover */}
        {course.cover_image_url ? (
          <div className="aspect-video overflow-hidden rounded-t-xl">
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-t-xl bg-gradient-to-br from-neutral-800 to-neutral-900">
            <Dumbbell className="h-10 w-10 text-neutral-700" />
          </div>
        )}

        {/* Info */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS["all-levels"]}`}>
              {course.difficulty}
            </span>
            {course.certificate_level && (
              <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                {course.certificate_level} cert
              </span>
            )}
            {course.is_free && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                Free
              </span>
            )}
          </div>

          <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
            {course.title}
          </h3>

          {course.short_description && (
            <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
              {course.short_description}
            </p>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-neutral-600">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.total_lessons} lessons
            </span>
            {course.estimated_hours > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.estimated_hours}h
              </span>
            )}
            {!course.is_free && course.price_thb > 0 && (
              <span className="ml-auto font-medium text-orange-400">
                ฿{course.price_thb.toLocaleString()}
              </span>
            )}
          </div>

          {course.organizations && (
            <p className="mt-2 text-[10px] text-neutral-600">
              by {course.organizations.name}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
