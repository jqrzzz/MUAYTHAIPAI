"use client"

/**
 * Platform-admin Curriculum tab.
 *
 * Shows the full Naga–Garuda ladder as the cornerstone of the
 * MUAYTHAIPAI network. Click any level to drop into a per-level editor:
 *   - Skills (assessment criteria) — reword in place via CertSkillsEditor
 *     (/api/platform-admin/cert-skills). Code defaults seed the DB; reword is
 *     text-only, so skill_index and historical sign-offs stay aligned.
 *   - Course content (modules + lessons) — full CRUD via the existing
 *     CourseModulesView, scoped to /api/platform-admin/courses.
 *
 * Adding / removing / reordering skills is intentionally not yet supported —
 * that must migrate the issuance count + the sign-off UI together.
 */
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react"
import { CERTIFICATION_LEVELS, type CertificationLevel } from "@/lib/certification-levels"
import {
  Surface,
  SectionHeader,
  EmptyState,
  SaasButton,
} from "@/components/saas"
import CourseModulesView from "@/components/admin/course-modules-view"
import CertSkillsEditor from "@/components/platform-admin/cert-skills-editor"

interface PlatformCourse {
  id: string
  org_id: string | null
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

export default function CurriculumTab() {
  const [courses, setCourses] = useState<PlatformCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<CertificationLevel | null>(
    null,
  )
  const [openCourse, setOpenCourse] = useState<PlatformCourse | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/platform-admin/courses", {
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load")
      setCourses((data.courses ?? []) as PlatformCourse[])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  // Drilled into a course's modules editor — defer to existing component.
  if (openCourse) {
    return (
      <CourseModulesView
        course={openCourse}
        onBack={() => {
          setOpenCourse(null)
          refresh()
        }}
        apiBase="/api/platform-admin/courses"
      />
    )
  }

  // Drilled into a single level's detail.
  if (selectedLevel) {
    const course = courses.find(
      (c) => c.certificate_level === selectedLevel.id,
    )
    return (
      <LevelDetailView
        level={selectedLevel}
        course={course}
        loading={loading}
        onBack={() => setSelectedLevel(null)}
        onOpenCourse={(c) => setOpenCourse(c)}
        onRefresh={refresh}
      />
    )
  }

  // Ladder overview
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Network curriculum"
        eyebrowIcon={GraduationCap}
        size="lg"
        title="The Naga–Garuda ladder"
        subtitle="Five tiers of Muay Thai mastery, owned by MUAYTHAIPAI and shared read-only with every gym in the network. Skills are the assessment standard. Course content is the path."
      />

      {error && (
        <div className="rounded-xl ring-1 ring-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-300">
          {error}
        </div>
      )}

      {loading && courses.length === 0 ? (
        <Surface>
          <div className="text-center py-12">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-600" />
          </div>
        </Surface>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {CERTIFICATION_LEVELS.map((level) => {
            const course = courses.find(
              (c) => c.certificate_level === level.id,
            )
            return (
              <LevelTile
                key={level.id}
                level={level}
                hasCourse={!!course}
                modulesCount={course?.module_count ?? 0}
                lessonsCount={course?.lesson_count ?? 0}
                onClick={() => setSelectedLevel(level)}
              />
            )
          })}
        </div>
      )}

      {!loading && courses.length === 0 && (
        <EmptyState
          icon={BookOpen}
          tone="amber"
          title="No course content yet"
          description="Run scripts/018-022-seed-*-course.sql in Supabase to provision the canonical Muay Thai content for each level."
        />
      )}
    </div>
  )
}

/* ─── ladder tile ────────────────────────────────────────────────── */

function LevelTile({
  level,
  hasCourse,
  modulesCount,
  lessonsCount,
  onClick,
}: {
  level: CertificationLevel
  hasCourse: boolean
  modulesCount: number
  lessonsCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-xl ring-1 ring-zinc-900 bg-zinc-900/40 backdrop-blur-sm overflow-hidden text-left transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:ring-zinc-800 hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
    >
      {/* Creature gradient header — keeps the cert identity colors */}
      <div
        className={`bg-gradient-to-br ${level.bgGradient} p-4 relative`}
      >
        <div className="absolute top-2 right-2 text-[10px] uppercase tracking-[0.18em] text-white/70 font-medium">
          Level {level.number}
        </div>
        <div className="text-4xl mb-1 leading-none">{level.icon}</div>
        <p className="text-[15px] font-semibold tracking-tight text-white">
          {level.name}
        </p>
        <p className="text-[10px] uppercase tracking-[0.14em] text-white/70">
          {level.creature}
        </p>
      </div>
      {/* Stats footer */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {level.duration}
          </span>
          <span className="text-zinc-300 font-medium tabular-nums">
            ฿{level.priceTHB.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">{level.skills.length} skills</span>
          {hasCourse ? (
            <span className="text-indigo-300 inline-flex items-center gap-1">
              {modulesCount}m · {lessonsCount}L
              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          ) : (
            <span className="text-amber-400 inline-flex items-center gap-1">
              No course
              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ─── level detail (skills + course) ─────────────────────────────── */

function LevelDetailView({
  level,
  course,
  loading,
  onBack,
  onOpenCourse,
  onRefresh,
}: {
  level: CertificationLevel
  course: PlatformCourse | undefined
  loading: boolean
  onBack: () => void
  onOpenCourse: (c: PlatformCourse) => void
  onRefresh: () => void
}) {
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function createCourse() {
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/platform-admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${level.name} certification`,
          slug: `${level.id}-certification`,
          description: `Course content preparing students for the ${level.name} (Level ${level.number}) assessment.`,
          short_description: `Master the ${level.skills.length} skills of ${level.name}.`,
          difficulty:
            level.number === 1
              ? "beginner"
              : level.number >= 4
                ? "advanced"
                : "intermediate",
          category: "certification",
          certificate_level: level.id,
          is_free: false,
          price_thb: level.priceTHB,
          status: "draft",
          display_order: level.number,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      onRefresh()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  // Course management — publish/unpublish, edit details, delete. The
  // platform courses API supports all of this; it just wasn't surfaced.
  const [publishing, setPublishing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", short_description: "", price_thb: 0, is_free: false })

  async function patchCourse(updates: Record<string, unknown>) {
    if (!course) return
    const res = await fetch("/api/platform-admin/courses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: course.id, ...updates }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d?.error || "Save failed")
    }
  }

  async function togglePublish() {
    if (!course) return
    setPublishing(true)
    setActionError(null)
    try {
      const next = course.status === "published" ? "draft" : "published"
      await patchCourse({
        status: next,
        published_at: next === "published" ? new Date().toISOString() : null,
      })
      onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setPublishing(false)
    }
  }

  async function saveDetails() {
    setSaving(true)
    setActionError(null)
    try {
      await patchCourse({
        title: form.title.trim() || course?.title,
        short_description: form.short_description.trim() || null,
        is_free: form.is_free,
        price_thb: form.is_free ? 0 : Math.max(0, Math.round(form.price_thb) || 0),
      })
      setEditing(false)
      onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function deleteCourse() {
    if (!course) return
    setDeleting(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/platform-admin/courses?id=${course.id}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || "Delete failed")
      }
      setConfirmDelete(false)
      onRefresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to ladder
      </button>

      {/* Hero — creature gradient + level meta */}
      <Surface>
        <div className={`bg-gradient-to-br ${level.bgGradient} p-6`}>
          <div className="flex items-start gap-4">
            <div className="text-6xl leading-none">{level.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/70 font-medium">
                Level {level.number} · {level.creature}
              </p>
              <h2 className="text-[26px] font-semibold tracking-tight text-white mt-0.5">
                {level.name}
              </h2>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-[12px] text-white/85">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {level.duration}
                </span>
                <span className="tabular-nums">
                  ฿{level.priceTHB.toLocaleString()}
                </span>
                {level.minDaysAfterPrevious > 0 && (
                  <span>
                    {level.minDaysAfterPrevious}d wait after previous level
                  </span>
                )}
                <span>{level.skills.length} skills to verify</span>
              </div>
            </div>
          </div>
        </div>
      </Surface>

      {/* Skills checklist — read-only, sourced from code */}
      <div className="space-y-3">
        <SectionHeader
          eyebrow="Assessment standard"
          eyebrowIcon={CheckCircle2}
          title="Skills to verify"
          subtitle={`The ${level.skills.length} criteria a trainer signs off before a student earns the ${level.name} certificate.`}
          action={
            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
              <Pencil className="h-3 w-3" />
              Reword network-wide
            </span>
          }
        />
        <CertSkillsEditor levelId={level.id} />
      </div>

      {/* Course content — full CRUD if it exists */}
      <div className="space-y-3">
        <SectionHeader
          eyebrow="Course content"
          eyebrowIcon={BookOpen}
          title={
            course ? "Path to certification" : "No course yet"
          }
          subtitle={
            course
              ? "Modules and lessons students go through before assessment. Edit the path here."
              : `Create the course that prepares students for ${level.name}. You can add modules and lessons after.`
          }
        />
        {loading ? (
          <Surface>
            <div className="text-center py-8 text-[12px] text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin inline mr-1.5" />
              Loading
            </div>
          </Surface>
        ) : course ? (
          <Surface>
            <button
              onClick={() => onOpenCourse(course)}
              className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-zinc-900/40 transition-colors group"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20 shrink-0">
                <BookOpen className="h-4 w-4 text-indigo-300" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-medium text-white truncate">
                    {course.title}
                  </p>
                  <span
                    className={`text-[10px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded ${
                      course.status === "published"
                        ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20"
                        : "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20"
                    }`}
                  >
                    {course.status}
                  </span>
                </div>
                {course.short_description && (
                  <p className="text-[12px] text-zinc-500 truncate mt-0.5">
                    {course.short_description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-600">
                  <span>{course.module_count} modules</span>
                  <span>·</span>
                  <span>{course.lesson_count} lessons</span>
                  {course.estimated_hours > 0 && (
                    <>
                      <span>·</span>
                      <span>~{course.estimated_hours}h</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Manage — publish, edit details, delete */}
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-900/80 px-4 py-2.5">
              <SaasButton size="sm" onClick={togglePublish} loading={publishing}>
                {course.status === "published" ? "Unpublish" : "Publish"}
              </SaasButton>
              <button
                onClick={() => {
                  setActionError(null)
                  setForm({
                    title: course.title,
                    short_description: course.short_description ?? "",
                    price_thb: course.price_thb,
                    is_free: course.is_free,
                  })
                  setEditing((v) => !v)
                }}
                className="rounded-lg px-3 py-1.5 text-[12px] text-zinc-300 ring-1 ring-zinc-800 transition-colors hover:bg-zinc-900/60 hover:text-white"
              >
                {editing ? "Close" : "Edit details"}
              </button>
              <div className="flex-1" />
              {confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={deleteCourse}
                    disabled={deleting}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                  >
                    {deleting ? "Deleting…" : "Confirm delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 text-[12px] text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-lg px-3 py-1.5 text-[12px] text-zinc-500 ring-1 ring-zinc-800 transition-colors hover:text-red-300 hover:ring-red-900/60"
                >
                  Delete
                </button>
              )}
            </div>
            {actionError && (
              <p className="px-4 pb-2.5 text-[11px] text-red-400">{actionError}</p>
            )}
            {editing && (
              <div className="space-y-2.5 border-t border-zinc-900/80 px-4 py-3">
                <div>
                  <label className="text-[11px] text-zinc-500">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="mt-1 w-full rounded-lg bg-zinc-950 px-3 py-2 text-[13px] text-zinc-100 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500">Short description</label>
                  <input
                    value={form.short_description}
                    onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
                    className="mt-1 w-full rounded-lg bg-zinc-950 px-3 py-2 text-[13px] text-zinc-100 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40"
                  />
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="text-[11px] text-zinc-500">Price (฿)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.price_thb}
                      disabled={form.is_free}
                      onChange={(e) => setForm((p) => ({ ...p, price_thb: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-lg bg-zinc-950 px-3 py-2 text-[13px] text-zinc-100 ring-1 ring-zinc-800 focus:outline-none focus:ring-indigo-500/40 disabled:opacity-50"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 pb-2 text-[13px] text-zinc-300">
                    <input
                      type="checkbox"
                      checked={form.is_free}
                      onChange={(e) => setForm((p) => ({ ...p, is_free: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    Free
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 text-[12px] text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <SaasButton size="sm" onClick={saveDetails} loading={saving}>
                    Save
                  </SaasButton>
                </div>
              </div>
            )}
          </Surface>
        ) : (
          <Surface>
            <div className="px-4 py-6 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20 shrink-0">
                <BookOpen className="h-4 w-4 text-amber-300" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white">
                  No course content yet for {level.name}
                </p>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  Either run the seed migration{" "}
                  <code className="text-zinc-400">
                    scripts/{
                      level.id === "naga"
                        ? "018"
                        : level.id === "phayra-nak"
                          ? "019"
                          : level.id === "singha"
                            ? "020"
                            : level.id === "hanuman"
                              ? "021"
                              : "022"
                    }-seed-{level.id}-course.sql
                  </code>{" "}
                  in Supabase, or create a blank one here.
                </p>
                {createError && (
                  <p className="text-[11px] text-red-400 mt-1">{createError}</p>
                )}
              </div>
              <SaasButton
                size="sm"
                onClick={createCourse}
                loading={creating}
              >
                <Plus className="h-3 w-3" />
                Create course
              </SaasButton>
            </div>
          </Surface>
        )}
      </div>
    </div>
  )
}
