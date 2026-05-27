"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
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
      // /courses on muaythaipai.com is the MTP gym's course catalog.
      // /api/public/courses requires an explicit `gym` so it never
      // silently returns cross-gym data.
      const params = new URLSearchParams()
      params.set("gym", "wisarut-family-gym")
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
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-display text-[11px] uppercase tracking-[0.24em] text-neutral-500 mb-2">
                The Curriculum
              </p>
              <h1 className="font-display text-[34px] sm:text-[44px] leading-tight text-white">
                Learn Muay Thai
              </h1>
              <p className="font-serif italic text-[16px] sm:text-[18px] text-neutral-400 mt-2">
                Structured courses from fundamentals to fight-ready
              </p>
            </div>
            <Link
              href="/certificate-programs"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-400 hover:text-white hover:border-white/20 transition-colors shrink-0"
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

const CERT_ICON: Record<string, string> = {
  naga: "🐍",
  "phayra-nak": "🐉",
  singha: "🦁",
  hanuman: "🐒",
  garuda: "🦅",
}

function CourseCard({ course, featured }: { course: Course; featured?: boolean }) {
  const certKey = course.certificate_level?.toLowerCase().replace(/\s+/g, "-")
  const certIcon = certKey ? CERT_ICON[certKey] : null
  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <article
        className={`relative rounded-2xl overflow-hidden ring-1 transition-all duration-200 hover:-translate-y-0.5 ${
          featured
            ? "ring-orange-500/20 bg-orange-500/[0.04] hover:ring-orange-500/40"
            : "ring-white/10 bg-white/[0.02] hover:ring-white/20 hover:bg-white/[0.04]"
        }`}
      >
        {/* Cinematic cover with gradient overlay */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {course.cover_image_url ? (
            <>
              <Image
                src={course.cover_image_url}
                alt={course.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900">
              <Dumbbell className="h-10 w-10 text-neutral-700" />
            </div>
          )}

          {/* Top-corner badges over the image */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            {course.certificate_level && (
              <span className="font-display text-[10px] uppercase tracking-[0.18em] text-white bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 ring-1 ring-white/20 inline-flex items-center gap-1.5">
                {certIcon && <span aria-hidden="true">{certIcon}</span>}
                {course.certificate_level}
              </span>
            )}
            {course.is_free && (
              <span className="text-[10px] font-medium text-emerald-100 bg-emerald-500/30 backdrop-blur-sm rounded-full px-2.5 py-1 ring-1 ring-emerald-300/40 uppercase tracking-wider">
                Free
              </span>
            )}
          </div>

          {/* Bottom-corner title over the image */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-display text-[18px] sm:text-[20px] leading-tight text-white drop-shadow-md line-clamp-2">
              {course.title}
            </h3>
            {course.organizations && (
              <p className="text-[11px] text-white/70 mt-1">
                {course.organizations.name}
              </p>
            )}
          </div>
        </div>

        {/* Info strip below */}
        <div className="px-4 pt-3 pb-4">
          {course.short_description && (
            <p className="font-serif italic text-[14px] text-neutral-300 leading-relaxed line-clamp-2">
              {course.short_description}
            </p>
          )}

          <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-500">
            <span
              className={`rounded-full px-2 py-0.5 font-medium uppercase tracking-wider ring-1 ${
                course.difficulty === "beginner"
                  ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                  : course.difficulty === "intermediate"
                    ? "bg-amber-500/10 text-amber-300 ring-amber-500/20"
                    : course.difficulty === "advanced"
                      ? "bg-red-500/10 text-red-300 ring-red-500/20"
                      : "bg-blue-500/10 text-blue-300 ring-blue-500/20"
              }`}
            >
              {course.difficulty}
            </span>
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.total_lessons}
            </span>
            {course.estimated_hours > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.estimated_hours}h
              </span>
            )}
            {!course.is_free && course.price_thb > 0 && (
              <span className="ml-auto font-display text-[12px] text-orange-300 tabular-nums">
                ฿{course.price_thb.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
