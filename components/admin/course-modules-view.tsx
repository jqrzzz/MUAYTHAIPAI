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
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Video,
  FileText,
  HelpCircle,
  Dumbbell,
  Eye,
} from "lucide-react"
import CourseLessonEditor from "./course-lesson-editor"

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

interface LessonSummary {
  id: string
  title: string
  content_type: string
  lesson_order: number
  is_preview: boolean
  estimated_minutes: number
}

interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  module_order: number
  lessons: LessonSummary[]
}

const CONTENT_TYPE_ICONS: Record<string, typeof Video> = {
  video: Video,
  text: FileText,
  quiz: HelpCircle,
  drill: Dumbbell,
}

export default function CourseModulesView({
  course,
  onBack,
}: {
  course: Course
  onBack: () => void
}) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [lessonModuleId, setLessonModuleId] = useState<string | null>(null)
  const [lessonForm, setLessonForm] = useState({ title: "", content_type: "video" })
  const [savingLesson, setSavingLesson] = useState(false)

  const [editingLesson, setEditingLesson] = useState<{ id: string; moduleId: string } | null>(null)

  const fetchModules = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/modules?course_id=${course.id}`)
      if (res.ok) {
        const data = await res.json()
        setModules(data.modules || [])
      }
    } catch { /* */ }
    setLoading(false)
  }, [course.id])

  useEffect(() => { fetchModules() }, [fetchModules])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const openAddModule = () => {
    setEditingModule(null)
    setModuleForm({ title: "", description: "" })
    setError("")
    setDialogOpen(true)
  }

  const openEditModule = (mod: Module) => {
    setEditingModule(mod)
    setModuleForm({ title: mod.title, description: mod.description || "" })
    setError("")
    setDialogOpen(true)
  }

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) { setError("Title is required"); return }
    setSaving(true)
    setError("")
    try {
      const url = "/api/admin/courses/modules"
      if (editingModule) {
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingModule.id,
            title: moduleForm.title,
            description: moduleForm.description || null,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error || "Failed to update")
      } else {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: course.id,
            title: moduleForm.title,
            description: moduleForm.description || null,
            module_order: modules.length,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create")
      }
      setDialogOpen(false)
      fetchModules()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteModule = async (id: string) => {
    if (!confirm("Delete this module and all its lessons?")) return
    await fetch(`/api/admin/courses/modules?id=${id}`, { method: "DELETE" })
    fetchModules()
  }

  const openAddLesson = (moduleId: string) => {
    setLessonModuleId(moduleId)
    setLessonForm({ title: "", content_type: "video" })
    setLessonDialogOpen(true)
  }

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim() || !lessonModuleId) return
    setSavingLesson(true)
    try {
      const mod = modules.find((m) => m.id === lessonModuleId)
      const res = await fetch("/api/admin/courses/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module_id: lessonModuleId,
          course_id: course.id,
          title: lessonForm.title,
          content_type: lessonForm.content_type,
          lesson_order: mod?.lessons.length ?? 0,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create")
      setLessonDialogOpen(false)
      setExpanded((prev) => new Set(prev).add(lessonModuleId))
      fetchModules()
    } catch { /* */ }
    setSavingLesson(false)
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return
    await fetch(`/api/admin/courses/lessons?id=${lessonId}`, { method: "DELETE" })
    fetchModules()
  }

  if (editingLesson) {
    return (
      <CourseLessonEditor
        lessonId={editingLesson.id}
        courseId={course.id}
        moduleId={editingLesson.moduleId}
        onBack={() => { setEditingLesson(null); fetchModules() }}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button size="sm" variant="ghost" onClick={onBack} className="text-neutral-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">{course.title}</h2>
          <p className="text-sm text-neutral-400">
            {modules.length} modules • {modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons
          </p>
        </div>
        <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={openAddModule}>
          <Plus className="h-4 w-4 mr-1" /> Add Module
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-400" />
        </div>
      ) : modules.length === 0 ? (
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardContent className="text-center py-12 text-neutral-400">
            <p>No modules yet</p>
            <p className="text-sm mt-2">Add modules to organize your course content</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {modules.map((mod, idx) => (
            <Card key={mod.id} className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-0">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-neutral-800/50 transition-colors"
                  onClick={() => toggleExpand(mod.id)}
                >
                  <GripVertical className="h-4 w-4 text-neutral-600 flex-shrink-0" />
                  {expanded.has(mod.id) ? (
                    <ChevronDown className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-neutral-500">M{idx + 1}</span>
                      <h3 className="font-medium text-white truncate">{mod.title}</h3>
                      <Badge variant="outline" className="text-neutral-400 border-neutral-600 text-xs">
                        {mod.lessons.length} lessons
                      </Badge>
                    </div>
                    {mod.description && (
                      <p className="text-sm text-neutral-500 mt-0.5 truncate">{mod.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => openAddLesson(mod.id)} className="text-neutral-400 hover:text-white h-8 w-8 p-0">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditModule(mod)} className="text-neutral-400 hover:text-white h-8 w-8 p-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteModule(mod.id)} className="text-red-400 hover:text-red-300 h-8 w-8 p-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {expanded.has(mod.id) && (
                  <div className="border-t border-neutral-800">
                    {mod.lessons.length === 0 ? (
                      <div className="px-4 py-6 text-center text-neutral-500 text-sm">
                        No lessons yet.{" "}
                        <button className="text-orange-400 hover:underline" onClick={() => openAddLesson(mod.id)}>
                          Add one
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-800/50">
                        {mod.lessons
                          .sort((a, b) => a.lesson_order - b.lesson_order)
                          .map((lesson, li) => {
                            const Icon = CONTENT_TYPE_ICONS[lesson.content_type] || FileText
                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 px-4 py-2.5 pl-14 hover:bg-neutral-800/30 transition-colors cursor-pointer group"
                                onClick={() => setEditingLesson({ id: lesson.id, moduleId: mod.id })}
                              >
                                <Icon className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                                <span className="text-xs font-mono text-neutral-600">{li + 1}.</span>
                                <span className="flex-1 text-sm text-neutral-200 truncate">{lesson.title}</span>
                                {lesson.is_preview && (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                    <Eye className="h-3 w-3 mr-1" /> Preview
                                  </Badge>
                                )}
                                <span className="text-xs text-neutral-500">{lesson.estimated_minutes}m</span>
                                <Button
                                  size="sm" variant="ghost"
                                  className="text-red-400 hover:text-red-300 h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id) }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Module dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-white">{editingModule ? "Edit Module" : "New Module"}</DialogTitle>
            <DialogDescription>{editingModule ? "Update module details" : "Add a new module to this course"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-neutral-200">Title *</Label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Fundamentals of Stance"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Description</Label>
              <textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief module description..."
                rows={2}
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button onClick={handleSaveModule} disabled={saving} className="w-full bg-orange-600 hover:bg-orange-700">
              {saving ? "Saving..." : editingModule ? "Update Module" : "Create Module"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick-add lesson dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-white">Add Lesson</DialogTitle>
            <DialogDescription>Create a new lesson — you can edit content after.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-neutral-200">Title *</Label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Introduction to Wai Kru"
                className="bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "video", label: "Video", icon: Video },
                  { value: "text", label: "Text", icon: FileText },
                  { value: "quiz", label: "Quiz", icon: HelpCircle },
                  { value: "drill", label: "Drill", icon: Dumbbell },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    className={`flex flex-col items-center gap-1 p-3 rounded-md border text-sm transition-colors ${
                      lessonForm.content_type === value
                        ? "border-orange-500 bg-orange-500/10 text-orange-400"
                        : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
                    }`}
                    onClick={() => setLessonForm((p) => ({ ...p, content_type: value }))}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSaveLesson} disabled={savingLesson || !lessonForm.title.trim()} className="w-full bg-orange-600 hover:bg-orange-700">
              {savingLesson ? "Creating..." : "Create Lesson"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
