"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Loader2,
  PlayCircle,
  CheckCircle,
  ChevronRight,
  Trophy,
} from "lucide-react"

interface EnrolledCourse {
  id: string
  title: string
  slug: string
  cover_image_url: string | null
  certificate_level: string | null
  difficulty: string
  category: string
  total_lessons: number
  estimated_hours: number
  enrollment: {
    id: string
    status: string
    progress_pct: number
    completed_lessons: number
    total_lessons: number
    last_accessed_at: string
    completed_at: string | null
  }
  next_lesson: {
    id: string
    title: string
    content_type: string
  } | null
}

export default function StudentCoursesView() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/student/courses")
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
      }
    } catch { /* */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const activeCourses = courses.filter((c: EnrolledCourse) => c.enrollment.status === "active")
  const completedCourses = courses.filter((c: EnrolledCourse) => c.enrollment.status === "completed")

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-400" />
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="py-6">
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-neutral-600" />
            <p className="text-neutral-400 mb-2">No courses yet</p>
            <p className="text-sm text-neutral-500 mb-4">
              Start your Muay Thai certification journey
            </p>
            <Link href="/courses">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Browse Courses
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      {activeCourses.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-neutral-400 mb-3">In Progress</h2>
          <div className="space-y-3">
            {activeCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {completedCourses.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-neutral-400 mb-3">Completed</h2>
          <div className="space-y-3">
            {completedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <Link href="/courses">
          <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            Browse More Courses
          </Button>
        </Link>
      </div>
    </div>
  )
}

function CourseCard({ course }: { course: EnrolledCourse }) {
  const isCompleted = course.enrollment.status === "completed"
  const progress = Math.round(course.enrollment.progress_pct)
  const resumeUrl = course.next_lesson
    ? `/courses/${course.slug}/${course.next_lesson.id}`
    : `/courses/${course.slug}`

  return (
    <Link href={resumeUrl}>
      <Card className={`border transition-colors hover:border-neutral-600 ${
        isCompleted
          ? "bg-gradient-to-br from-green-900/20 to-emerald-800/10 border-green-500/30"
          : "bg-neutral-900/50 border-neutral-800"
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isCompleted
                ? "bg-green-500/20"
                : "bg-orange-500/20"
            }`}>
              {isCompleted ? (
                <Trophy className="w-6 h-6 text-green-400" />
              ) : (
                <PlayCircle className="w-6 h-6 text-orange-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-white text-sm truncate">{course.title}</h3>
                {course.certificate_level && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] flex-shrink-0">
                    {course.certificate_level}
                  </Badge>
                )}
              </div>

              {isCompleted ? (
                <div className="flex items-center gap-1 text-green-400 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  <span>Completed</span>
                  {course.enrollment.completed_at && (
                    <span className="text-neutral-500 ml-1">
                      — {new Date(course.enrollment.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-400 flex-shrink-0">{progress}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-neutral-500">
                      {course.enrollment.completed_lessons}/{course.enrollment.total_lessons} lessons
                    </span>
                    {course.next_lesson && (
                      <span className="text-xs text-orange-400 flex items-center gap-1">
                        Continue <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
