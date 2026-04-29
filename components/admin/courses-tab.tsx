"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react"
import CourseModulesView from "./course-modules-view"

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  difficulty: string
  category: string
  certificate_level: string | null
  is_free: boolean
  price_thb: number
  status: string
  total_modules: number
  total_lessons: number
  estimated_hours: number
  module_count: number
  lesson_count: number
  cover_image_url: string | null
}

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all-levels", label: "All Levels" },
]

const CATEGORIES = [
  { value: "technique", label: "Technique" },
  { value: "conditioning", label: "Conditioning" },
  { value: "culture", label: "Culture" },
  { value: "certification", label: "Certification" },
  { value: "sparring", label: "Sparring" },
  { value: "clinch", label: "Clinch" },
]

const CERT_LEVELS = [
  { value: "none", label: "None" },
  { value: "naga", label: "Naga (Level 1)" },
  { value: "phayra-nak", label: "Phayra Nak (Level 2)" },
  { value: "singha", label: "Singha (Level 3)" },
  { value: "hanuman", label: "Hanuman (Level 4)" },
  { value: "garuda", label: "Garuda (Level 5)" },
]

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function CoursesTab({
  orgId,
  apiBase = "/api/admin/courses",
  scopeLabel,
}: {
  orgId?: string
  apiBase?: string
  scopeLabel?: string
}) {
  void orgId

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "", slug: "", description: "", short_description: "",
    difficulty: "beginner", category: "technique", certificate_level: "none",
    is_free: true, price_thb: 0, status: "draft",
  })

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiBase)
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
      }
    } catch { /* */ }
    setLoading(false)
  }, [apiBase])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const openAdd = () => {
    setEditing(null)
    setForm({
      title: "", slug: "", description: "", short_description: "",
      difficulty: "beginner", category: "technique", certificate_level: "none",
      is_free: true, price_thb: 0, status: "draft",
    })
    setError("")
    setDialogOpen(true)
  }

  const openEdit = (course: Course) => {
    setEditing(course)
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description || "",
      short_description: course.short_description || "",
      difficulty: course.difficulty,
      category: course.category,
      certificate_level: course.certificate_level || "none",
      is_free: course.is_free,
      price_thb: course.price_thb,
      status: course.status,
    })
    setError("")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError("")
    if (!form.title.trim()) { setError("Title is required"); return }
    const slug = form.slug.trim() || slugify(form.title)
    if (!slug) { setError("Slug is required"); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        slug,
        certificate_level: form.certificate_level === "none" ? null : form.certificate_level,
        description: form.description || null,
        short_description: form.short_description || null,
      }

      const url = apiBase
      const method = editing ? "PATCH" : "POST"
      const body = editing ? { id: editing.id, ...payload } : payload

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save")
      }
      setDialogOpen(false)
      fetchCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course and all its content?")) return
    await fetch(`${apiBase}?id=${id}`, { method: "DELETE" })
    fetchCourses()
  }

  const togglePublish = async (course: Course) => {
    const newStatus = course.status === "published" ? "draft" : "published"
    await fetch(apiBase, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: course.id, status: newStatus }),
    })
    fetchCourses()
  }

  if (selectedCourse) {
    return (
      <CourseModulesView
        course={selectedCourse}
        apiBase={apiBase}
        onBack={() => { setSelectedCourse(null); fetchCourses() }}
      />
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Courses</h2>
          <p className="text-sm text-neutral-400">{scopeLabel || "Manage your training curriculum"}</p>
        </div>
        <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Course
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-400" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="text-center py-12 text-neutral-400">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No courses yet</p>
            <p className="text-sm mt-2">Create your first course to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="bg-neutral-900/50 border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
              onClick={() => setSelectedCourse(course)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-white">{course.title}</h3>
                      <Badge className={course.status === "published"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-neutral-500/20 text-neutral-400 border-neutral-500/30"
                      }>
                        {course.status}
                      </Badge>
                      {course.certificate_level && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          {course.certificate_level}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-neutral-400 border-neutral-600">
                        {course.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-400 mt-1">
                      {course.module_count} modules • {course.lesson_count} lessons
                      {course.is_free ? " • Free" : ` • ฿${course.price_thb.toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => togglePublish(course)}
                      className={course.status === "published"
                        ? "border-green-700 text-green-400 hover:bg-green-900/30"
                        : "border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                      }
                    >
                      {course.status === "published" ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(course)} className="border-neutral-700 hover:bg-neutral-800">
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(course.id)} className="border-red-700 text-red-400 hover:bg-red-900/30">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? "Edit Course" : "New Course"}</DialogTitle>
            <DialogDescription>{editing ? "Update course details" : "Create a new course"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-neutral-200">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                    slug: editing ? prev.slug : slugify(e.target.value),
                  }))
                }}
                placeholder="e.g. Naga Certification Course"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="naga-certification-course"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Short Description</Label>
              <Input
                value={form.short_description}
                onChange={(e) => setForm((prev) => ({ ...prev, short_description: e.target.value }))}
                placeholder="One-line summary"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Full course description..."
                rows={3}
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-neutral-200">Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm((p) => ({ ...p, difficulty: v }))}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value} className="text-white">{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-200">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value} className="text-white">{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Certification Level</Label>
              <Select value={form.certificate_level} onValueChange={(v) => setForm((p) => ({ ...p, certificate_level: v }))}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  {CERT_LEVELS.map((l) => <SelectItem key={l.value} value={l.value} className="text-white">{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-neutral-200">Pricing</Label>
                <Select value={form.is_free ? "free" : "paid"} onValueChange={(v) => setForm((p) => ({ ...p, is_free: v === "free" }))}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    <SelectItem value="free" className="text-white">Free</SelectItem>
                    <SelectItem value="paid" className="text-white">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!form.is_free && (
                <div className="space-y-2">
                  <Label className="text-neutral-200">Price (THB)</Label>
                  <Input
                    type="number"
                    value={form.price_thb}
                    onChange={(e) => setForm((p) => ({ ...p, price_thb: parseInt(e.target.value) || 0 }))}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
              )}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button onClick={handleSave} disabled={saving} className="w-full bg-orange-600 hover:bg-orange-700">
              {saving ? "Saving..." : editing ? "Update Course" : "Create Course"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
