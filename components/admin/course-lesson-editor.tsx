"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Save,
  Video,
  FileText,
  HelpCircle,
  Dumbbell,
  Eye,
  CheckCircle,
  XCircle,
  Sparkles,
  Wand2,
  Check,
  Languages,
} from "lucide-react"

interface Lesson {
  id: string
  module_id: string
  course_id: string
  title: string
  description: string | null
  content_type: string
  video_url: string | null
  video_duration_seconds: number | null
  text_content: string | null
  drill_instructions: string | null
  drill_duration_minutes: number | null
  lesson_order: number
  is_preview: boolean
  estimated_minutes: number
}

interface QuizOption {
  id: string
  text: string
  is_correct: boolean
}

interface QuizQuestion {
  id: string
  lesson_id: string
  question_text: string
  question_type: string
  options: QuizOption[] | null
  correct_answer: string | null
  explanation: string | null
  question_order: number
}

const CONTENT_TYPES = [
  { value: "video", label: "Video", icon: Video },
  { value: "text", label: "Text", icon: FileText },
  { value: "quiz", label: "Quiz", icon: HelpCircle },
  { value: "drill", label: "Drill", icon: Dumbbell },
]

export default function CourseLessonEditor({
  lessonId,
  courseId,
  moduleId,
  onBack,
  apiBase = "/api/admin/courses",
}: {
  lessonId: string
  courseId: string
  moduleId: string
  onBack: () => void
  apiBase?: string
}) {
  void courseId

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    content_type: "video",
    video_url: "",
    video_duration_seconds: 0,
    text_content: "",
    drill_instructions: "",
    drill_duration_minutes: 15,
    is_preview: false,
    estimated_minutes: 10,
  })

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)

  // AI authoring state
  const [improving, setImproving] = useState<null | "polish" | "expand" | "shorten" | "translate-th">(null)
  const [improveError, setImproveError] = useState<string | null>(null)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [quizSuggestions, setQuizSuggestions] = useState<
    Array<{
      question_text: string
      options: { id: string; text: string; is_correct: boolean }[]
      correct_answer: string
      explanation: string
    }>
  >([])
  const [quizPicked, setQuizPicked] = useState<Set<number>>(new Set())
  const [quizSuggestOpen, setQuizSuggestOpen] = useState(false)
  const [quizSaving, setQuizSaving] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    question_type: "multiple_choice" as string,
    options: [
      { id: "a", text: "", is_correct: true },
      { id: "b", text: "", is_correct: false },
      { id: "c", text: "", is_correct: false },
      { id: "d", text: "", is_correct: false },
    ] as QuizOption[],
    correct_answer: "",
    explanation: "",
  })

  const runImprove = async (mode: "polish" | "expand" | "shorten" | "translate-th") => {
    const text = form.text_content?.trim()
    if (!text) {
      setImproveError("Text content is empty.")
      return
    }
    setImproving(mode)
    setImproveError(null)
    try {
      const res = await fetch("/api/admin/courses/ai/improve-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode, context: form.title }),
      })
      const data = await res.json()
      if (!res.ok) {
        setImproveError(data.error || "AI improve failed")
      } else {
        setForm((p) => ({ ...p, text_content: data.text }))
      }
    } catch (err) {
      setImproveError(err instanceof Error ? err.message : "Failed")
    } finally {
      setImproving(null)
    }
  }

  const generateQuiz = async () => {
    setGeneratingQuiz(true)
    setQuizError(null)
    setQuizSuggestions([])
    setQuizPicked(new Set())
    setQuizSuggestOpen(true)
    try {
      const res = await fetch("/api/admin/courses/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_title: form.title,
          lesson_text: form.text_content || form.drill_instructions || form.description,
          count: 4,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setQuizError(data.error || "Quiz generation failed")
      } else {
        setQuizSuggestions(data.questions || [])
        setQuizPicked(new Set((data.questions || []).map((_: unknown, i: number) => i)))
      }
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "Failed")
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const acceptQuizSuggestions = async () => {
    if (quizPicked.size === 0) return
    setQuizSaving(true)
    try {
      const startOrder = questions.length
      const picked = quizSuggestions.filter((_, i) => quizPicked.has(i))
      for (let i = 0; i < picked.length; i++) {
        const q = picked[i]
        await fetch(`${apiBase}/quiz-questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lesson_id: lessonId,
            question_text: q.question_text,
            question_type: "multiple_choice",
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            question_order: startOrder + i,
          }),
        })
      }
      setQuizSuggestOpen(false)
      fetchQuestions()
    } finally {
      setQuizSaving(false)
    }
  }

  const fetchLesson = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/lessons?module_id=${moduleId}`)
      if (res.ok) {
        const data = await res.json()
        const found = (data.lessons || []).find((l: Lesson) => l.id === lessonId)
        if (found) {
          setLesson(found)
          setForm({
            title: found.title,
            description: found.description || "",
            content_type: found.content_type,
            video_url: found.video_url || "",
            video_duration_seconds: found.video_duration_seconds || 0,
            text_content: found.text_content || "",
            drill_instructions: found.drill_instructions || "",
            drill_duration_minutes: found.drill_duration_minutes || 15,
            is_preview: found.is_preview,
            estimated_minutes: found.estimated_minutes,
          })
        }
      }
    } catch { /* */ }
    setLoading(false)
  }, [lessonId, moduleId, apiBase])

  const fetchQuestions = useCallback(async () => {
    setLoadingQuestions(true)
    try {
      const res = await fetch(`${apiBase}/quiz-questions?lesson_id=${lessonId}`)
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions || [])
      }
    } catch { /* */ }
    setLoadingQuestions(false)
  }, [lessonId, apiBase])

  useEffect(() => { fetchLesson() }, [fetchLesson])
  useEffect(() => {
    if (form.content_type === "quiz") fetchQuestions()
  }, [form.content_type, fetchQuestions])

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    setSaved(false)
    try {
      const payload: Record<string, unknown> = {
        id: lessonId,
        title: form.title,
        description: form.description || null,
        content_type: form.content_type,
        is_preview: form.is_preview,
        estimated_minutes: form.estimated_minutes,
      }

      if (form.content_type === "video") {
        payload.video_url = form.video_url || null
        payload.video_duration_seconds = form.video_duration_seconds || null
      }
      if (form.content_type === "text") {
        payload.text_content = form.text_content || null
      }
      if (form.content_type === "drill") {
        payload.drill_instructions = form.drill_instructions || null
        payload.drill_duration_minutes = form.drill_duration_minutes || null
      }

      const res = await fetch(`${apiBase}/lessons`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save")
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* */ }
    setSaving(false)
  }

  const openAddQuestion = () => {
    setEditingQuestion(null)
    setQuestionForm({
      question_text: "",
      question_type: "multiple_choice",
      options: [
        { id: "a", text: "", is_correct: true },
        { id: "b", text: "", is_correct: false },
        { id: "c", text: "", is_correct: false },
        { id: "d", text: "", is_correct: false },
      ],
      correct_answer: "",
      explanation: "",
    })
    setQuestionDialogOpen(true)
  }

  const openEditQuestion = (q: QuizQuestion) => {
    setEditingQuestion(q)
    setQuestionForm({
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options || [
        { id: "a", text: "", is_correct: true },
        { id: "b", text: "", is_correct: false },
        { id: "c", text: "", is_correct: false },
        { id: "d", text: "", is_correct: false },
      ],
      correct_answer: q.correct_answer || "",
      explanation: q.explanation || "",
    })
    setQuestionDialogOpen(true)
  }

  const handleSaveQuestion = async () => {
    if (!questionForm.question_text.trim()) return
    setSavingQuestion(true)
    try {
      const payload: Record<string, unknown> = {
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        explanation: questionForm.explanation || null,
      }

      if (questionForm.question_type === "multiple_choice") {
        payload.options = questionForm.options
        const correct = questionForm.options.find((o: QuizOption) => o.is_correct)
        payload.correct_answer = correct?.id || "a"
      } else if (questionForm.question_type === "true_false") {
        payload.options = [
          { id: "true", text: "True", is_correct: questionForm.correct_answer === "true" },
          { id: "false", text: "False", is_correct: questionForm.correct_answer === "false" },
        ]
        payload.correct_answer = questionForm.correct_answer || "true"
      } else {
        payload.correct_answer = questionForm.correct_answer
      }

      if (editingQuestion) {
        payload.id = editingQuestion.id
        const res = await fetch(`${apiBase}/quiz-questions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update")
      } else {
        payload.lesson_id = lessonId
        payload.question_order = questions.length
        const res = await fetch(`${apiBase}/quiz-questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to create")
      }
      setQuestionDialogOpen(false)
      fetchQuestions()
    } catch { /* */ }
    setSavingQuestion(false)
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return
    await fetch(`${apiBase}/quiz-questions?id=${id}`, { method: "DELETE" })
    fetchQuestions()
  }

  const updateOption = (idx: number, field: "text" | "is_correct", value: string | boolean) => {
    setQuestionForm((prev: typeof questionForm) => {
      const options = [...prev.options]
      if (field === "is_correct" && value === true) {
        options.forEach((o, i) => { o.is_correct = i === idx })
      } else {
        options[idx] = { ...options[idx], [field]: value }
      }
      return { ...prev, options }
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-400" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <p>Lesson not found</p>
        <Button size="sm" variant="ghost" onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    )
  }

  const TypeIcon = CONTENT_TYPES.find((t) => t.value === form.content_type)?.icon || FileText

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button size="sm" variant="ghost" onClick={onBack} className="text-neutral-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Modules
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-neutral-400" />
            <h2 className="text-lg font-semibold text-white">{form.title || "Untitled Lesson"}</h2>
          </div>
        </div>
        <Button
          size="sm"
          className={saved ? "bg-green-600" : "bg-orange-600 hover:bg-orange-700"}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : saved ? <CheckCircle className="h-4 w-4 mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-neutral-200">Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-200">Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Brief lesson description..."
                  className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content type specific fields */}
          {form.content_type === "video" && (
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Video className="h-4 w-4" /> Video Content
                </h3>
                <div className="space-y-2">
                  <Label className="text-neutral-200">Video URL</Label>
                  <Input
                    value={form.video_url}
                    onChange={(e) => setForm((p) => ({ ...p, video_url: e.target.value }))}
                    placeholder="YouTube, Vimeo, or direct video URL"
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                  <p className="text-xs text-neutral-500">Supports YouTube, Vimeo, Mux, Cloudflare Stream</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-200">Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={form.video_duration_seconds}
                    onChange={(e) => setForm((p) => ({ ...p, video_duration_seconds: parseInt(e.target.value) || 0 }))}
                    className="bg-neutral-800 border-neutral-700 text-white w-32"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {form.content_type === "text" && (
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Text Content
                  </h3>
                  <div className="flex items-center gap-1 flex-wrap">
                    {([
                      { mode: "polish" as const, label: "Polish", icon: Wand2 },
                      { mode: "expand" as const, label: "Expand", icon: Sparkles },
                      { mode: "shorten" as const, label: "Shorten", icon: Sparkles },
                      { mode: "translate-th" as const, label: "→ ไทย", icon: Languages },
                    ]).map(({ mode, label, icon: Icon }) => (
                      <Button
                        key={mode}
                        size="sm"
                        variant="ghost"
                        onClick={() => runImprove(mode)}
                        disabled={improving !== null || !form.text_content?.trim()}
                        className="text-orange-400 hover:text-orange-300 h-7 text-xs"
                      >
                        {improving === mode ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Icon className="h-3 w-3 mr-1" />
                        )}
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                {improveError && (
                  <p className="text-xs text-red-400">{improveError}</p>
                )}
                <div className="space-y-2">
                  <Label className="text-neutral-200">Content (Markdown)</Label>
                  <textarea
                    value={form.text_content}
                    onChange={(e) => setForm((p) => ({ ...p, text_content: e.target.value }))}
                    rows={12}
                    placeholder="Write your lesson content in Markdown..."
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 text-sm font-mono"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {form.content_type === "drill" && (
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" /> Drill Instructions
                </h3>
                <div className="space-y-2">
                  <Label className="text-neutral-200">Instructions</Label>
                  <textarea
                    value={form.drill_instructions}
                    onChange={(e) => setForm((p) => ({ ...p, drill_instructions: e.target.value }))}
                    rows={8}
                    placeholder="Describe the drill, rounds, rest periods..."
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-200">Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={form.drill_duration_minutes}
                    onChange={(e) => setForm((p) => ({ ...p, drill_duration_minutes: parseInt(e.target.value) || 0 }))}
                    className="bg-neutral-800 border-neutral-700 text-white w-32"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {form.content_type === "quiz" && (
            <Card className="bg-neutral-900/50 border-neutral-800">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" /> Quiz Questions
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                      onClick={generateQuiz}
                      disabled={generatingQuiz}
                    >
                      {generatingQuiz ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      AI generate
                    </Button>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={openAddQuestion}>
                      <Plus className="h-4 w-4 mr-1" /> Add Question
                    </Button>
                  </div>
                </div>

                {loadingQuestions ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-neutral-400" />
                  </div>
                ) : questions.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-6">No questions yet</p>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q, qi) => (
                      <div key={q.id} className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm text-white">
                              <span className="text-neutral-500 font-mono mr-2">Q{qi + 1}.</span>
                              {q.question_text}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="outline" className="text-neutral-400 border-neutral-600 text-xs">
                                {q.question_type === "multiple_choice" ? "Multiple Choice" : q.question_type === "true_false" ? "True/False" : "Text"}
                              </Badge>
                              {q.correct_answer && (
                                <span className="text-xs text-green-400">Answer: {q.correct_answer}</span>
                              )}
                            </div>
                            {q.options && (
                              <div className="mt-2 space-y-1">
                                {(q.options as QuizOption[]).map((opt) => (
                                  <div key={opt.id} className="flex items-center gap-2 text-xs">
                                    {opt.is_correct ? (
                                      <CheckCircle className="h-3 w-3 text-green-400" />
                                    ) : (
                                      <XCircle className="h-3 w-3 text-neutral-600" />
                                    )}
                                    <span className={opt.is_correct ? "text-green-300" : "text-neutral-400"}>
                                      {opt.id.toUpperCase()}) {opt.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button size="sm" variant="ghost" onClick={() => openEditQuestion(q)} className="text-neutral-400 hover:text-white h-7 w-7 p-0">
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(q.id)} className="text-red-400 hover:text-red-300 h-7 w-7 p-0">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — right col */}
        <div className="space-y-4">
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-4 space-y-4">
              <h3 className="text-sm font-medium text-neutral-300">Settings</h3>
              <div className="space-y-2">
                <Label className="text-neutral-200">Content Type</Label>
                <Select value={form.content_type} onValueChange={(v) => setForm((p) => ({ ...p, content_type: v }))}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-neutral-200">Estimated Minutes</Label>
                <Input
                  type="number"
                  value={form.estimated_minutes}
                  onChange={(e) => setForm((p) => ({ ...p, estimated_minutes: parseInt(e.target.value) || 0 }))}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-neutral-200">Free Preview</Label>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.is_preview ? "bg-orange-600" : "bg-neutral-700"
                  }`}
                  onClick={() => setForm((p) => ({ ...p, is_preview: !p.is_preview }))}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.is_preview ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
              {form.is_preview && (
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Visible without enrollment
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quiz question dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editingQuestion ? "Edit Question" : "New Question"}</DialogTitle>
            <DialogDescription>{editingQuestion ? "Update this quiz question" : "Add a question to this quiz"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-neutral-200">Question *</Label>
              <textarea
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm((p) => ({ ...p, question_text: e.target.value }))}
                rows={2}
                placeholder="e.g. What is the correct stance for a teep?"
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-200">Type</Label>
              <Select value={questionForm.question_type} onValueChange={(v) => setQuestionForm((p) => ({ ...p, question_type: v }))}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  <SelectItem value="multiple_choice" className="text-white">Multiple Choice</SelectItem>
                  <SelectItem value="true_false" className="text-white">True / False</SelectItem>
                  <SelectItem value="text" className="text-white">Text Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {questionForm.question_type === "multiple_choice" && (
              <div className="space-y-3">
                <Label className="text-neutral-200">Options</Label>
                {questionForm.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                        opt.is_correct
                          ? "border-green-500 bg-green-500/20 text-green-400"
                          : "border-neutral-600 text-neutral-500 hover:border-neutral-500"
                      }`}
                      onClick={() => updateOption(i, "is_correct", true)}
                    >
                      {opt.id.toUpperCase()}
                    </button>
                    <Input
                      value={opt.text}
                      onChange={(e) => updateOption(i, "text", e.target.value)}
                      placeholder={`Option ${opt.id.toUpperCase()}`}
                      className="bg-neutral-800 border-neutral-700 text-white"
                    />
                  </div>
                ))}
                <p className="text-xs text-neutral-500">Click a letter to mark the correct answer</p>
              </div>
            )}

            {questionForm.question_type === "true_false" && (
              <div className="space-y-2">
                <Label className="text-neutral-200">Correct Answer</Label>
                <div className="flex gap-3">
                  {["true", "false"].map((val) => (
                    <button
                      key={val}
                      className={`flex-1 py-2 rounded-md border text-sm transition-colors ${
                        questionForm.correct_answer === val
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
                      }`}
                      onClick={() => setQuestionForm((p) => ({ ...p, correct_answer: val }))}
                    >
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {questionForm.question_type === "text" && (
              <div className="space-y-2">
                <Label className="text-neutral-200">Expected Answer</Label>
                <Input
                  value={questionForm.correct_answer}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, correct_answer: e.target.value }))}
                  placeholder="The expected answer text"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-neutral-200">Explanation (shown after answering)</Label>
              <textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm((p) => ({ ...p, explanation: e.target.value }))}
                rows={2}
                placeholder="Why this is the correct answer..."
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-2 text-sm"
              />
            </div>

            <Button
              onClick={handleSaveQuestion}
              disabled={savingQuestion || !questionForm.question_text.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {savingQuestion ? "Saving..." : editingQuestion ? "Update Question" : "Add Question"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI generated quiz suggestions */}
      <Dialog open={quizSuggestOpen} onOpenChange={setQuizSuggestOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-700 max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-400" />
              AI-generated quiz
            </DialogTitle>
            <DialogDescription>
              Pick the questions to keep. Each will be saved as a separate question.
            </DialogDescription>
          </DialogHeader>
          {generatingQuiz ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-400" />
              <p className="text-sm text-neutral-400 mt-3">Drafting questions…</p>
            </div>
          ) : quizError ? (
            <div className="rounded bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
              {quizError}
            </div>
          ) : (
            <div className="space-y-2">
              {quizSuggestions.map((q, i) => {
                const picked = quizPicked.has(i)
                const correct = q.options.find((o) => o.is_correct)
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setQuizPicked((prev) => {
                        const next = new Set(prev)
                        if (next.has(i)) next.delete(i)
                        else next.add(i)
                        return next
                      })
                    }}
                    className={`w-full text-left rounded border p-3 transition ${
                      picked
                        ? "border-orange-500/60 bg-orange-500/5"
                        : "border-neutral-700 bg-neutral-950 hover:bg-neutral-900"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`h-4 w-4 rounded border shrink-0 mt-0.5 flex items-center justify-center ${
                          picked ? "border-orange-500 bg-orange-500" : "border-neutral-600"
                        }`}
                      >
                        {picked && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-medium">
                          <span className="text-neutral-500 font-mono mr-2">Q{i + 1}.</span>
                          {q.question_text}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {q.options.map((o) => (
                            <li
                              key={o.id}
                              className={`text-xs flex items-start gap-1.5 ${
                                o.is_correct ? "text-emerald-400" : "text-neutral-400"
                              }`}
                            >
                              <span className="font-mono">{o.id}.</span>
                              <span>{o.text}</span>
                              {o.is_correct && <CheckCircle className="h-3 w-3 mt-0.5" />}
                            </li>
                          ))}
                        </ul>
                        {q.explanation && (
                          <p className="text-xs text-neutral-500 mt-2 italic">
                            {q.explanation}
                          </p>
                        )}
                        {!correct && (
                          <p className="text-xs text-red-400 mt-1">
                            Warning: no correct answer flagged
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={acceptQuizSuggestions}
                  disabled={quizSaving || quizPicked.size === 0}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {quizSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  Add {quizPicked.size} question{quizPicked.size === 1 ? "" : "s"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setQuizSuggestOpen(false)}
                  disabled={quizSaving}
                  className="text-neutral-400"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
