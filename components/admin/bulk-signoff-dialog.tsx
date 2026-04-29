"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Check, Users, Sparkles, AlertCircle } from "lucide-react"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

interface Enrollment {
  id: string
  level: string
  status: string
  users: { id: string; full_name: string | null; email: string } | null
}

export default function BulkSignoffDialog({
  open,
  onOpenChange,
  enrollments,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrollments: Enrollment[]
  onSuccess: () => void
}) {
  const activeByLevel = useMemo(() => {
    const map = new Map<string, Enrollment[]>()
    for (const e of enrollments) {
      if (e.status !== "active" || !e.users) continue
      const arr = map.get(e.level) || []
      arr.push(e)
      map.set(e.level, arr)
    }
    return map
  }, [enrollments])

  const defaultLevel = useMemo(() => {
    // Pick the level with the most active enrollments
    let pick: string | null = null
    let max = 0
    for (const [lvl, list] of activeByLevel.entries()) {
      if (list.length > max) {
        max = list.length
        pick = lvl
      }
    }
    return pick || CERTIFICATION_LEVELS[0].id
  }, [activeByLevel])

  const [level, setLevel] = useState(defaultLevel)
  const [skillIndex, setSkillIndex] = useState<number>(0)
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    succeeded: number
    skipped: number
    completed_now: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setLevel(defaultLevel)
      setSkillIndex(0)
      setPickedIds(new Set())
      setNotes("")
      setResult(null)
      setError(null)
    }
  }, [open, defaultLevel])

  const levelConfig =
    CERTIFICATION_LEVELS.find((l) => l.id === level) || CERTIFICATION_LEVELS[0]
  const studentsForLevel = activeByLevel.get(level) || []

  const togglePick = (userId: string) => {
    setPickedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const pickAll = () => {
    setPickedIds(new Set(studentsForLevel.map((e) => e.users!.id)))
  }
  const pickNone = () => setPickedIds(new Set())

  const submit = async () => {
    if (pickedIds.size === 0) return
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/admin/certificates/skills/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          skill_index: skillIndex,
          student_ids: [...pickedIds],
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed")
      } else {
        setResult({
          succeeded: data.succeeded ?? 0,
          skipped: (data.skipped || []).length,
          completed_now: (data.completed_now || []).length,
        })
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-400" />
            Bulk skill signoff
          </DialogTitle>
          <DialogDescription>
            Sign off the same skill for everyone who attended class today.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="rounded border border-emerald-700/40 bg-emerald-900/20 p-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-medium text-white">
                  Signed off {result.succeeded} student
                  {result.succeeded === 1 ? "" : "s"}
                </p>
              </div>
              {result.completed_now > 0 && (
                <p className="text-xs text-emerald-200 mt-1">
                  🎉 {result.completed_now} student
                  {result.completed_now === 1 ? "" : "s"} completed all skills
                  for {levelConfig.name} — ready to issue certificates.
                </p>
              )}
              {result.skipped > 0 && (
                <p className="text-xs text-zinc-400 mt-1">
                  {result.skipped} skipped (already signed off or error).
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setResult(null)
                  setPickedIds(new Set())
                  setNotes("")
                  // advance to next skill if there is one
                  if (skillIndex < levelConfig.skills.length - 1) {
                    setSkillIndex(skillIndex + 1)
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Sign off another skill
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-zinc-400"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Level */}
            <div>
              <label className="text-xs text-zinc-400">Level</label>
              <Select value={level} onValueChange={(v) => { setLevel(v); setSkillIndex(0); setPickedIds(new Set()) }}>
                <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                  {CERTIFICATION_LEVELS.map((l) => {
                    const count = activeByLevel.get(l.id)?.length ?? 0
                    return (
                      <SelectItem key={l.id} value={l.id}>
                        {l.icon} {l.name}{" "}
                        <span className="text-zinc-500 ml-1 text-xs">
                          ({count} active)
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Skill picker */}
            <div>
              <label className="text-xs text-zinc-400">Skill</label>
              <div className="mt-1 space-y-1 max-h-44 overflow-y-auto rounded border border-zinc-800 bg-zinc-950 p-1">
                {levelConfig.skills.map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSkillIndex(idx)}
                    className={`w-full text-left rounded px-2 py-1 text-sm flex items-center gap-2 ${
                      idx === skillIndex
                        ? "bg-orange-500/15 text-orange-200"
                        : "text-zinc-300 hover:bg-zinc-900"
                    }`}
                  >
                    <span className="text-xs font-mono text-zinc-500 w-5">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 truncate">{label}</span>
                    {idx === skillIndex && (
                      <Check className="h-3 w-3 text-orange-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Student picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-400 inline-flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  Students enrolled in {levelConfig.name} ({studentsForLevel.length})
                </label>
                {studentsForLevel.length > 0 && (
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={pickAll}
                      className="text-orange-400 hover:underline"
                    >
                      All
                    </button>
                    <button
                      onClick={pickNone}
                      className="text-zinc-500 hover:underline"
                    >
                      None
                    </button>
                  </div>
                )}
              </div>
              {studentsForLevel.length === 0 ? (
                <div className="rounded border border-dashed border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-500 inline-flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  No active enrollments for {levelConfig.name}. Enroll
                  students from the Certificates tab first.
                </div>
              ) : (
                <div className="space-y-1 max-h-56 overflow-y-auto rounded border border-zinc-800 bg-zinc-950 p-1">
                  {studentsForLevel.map((e) => {
                    const u = e.users!
                    const picked = pickedIds.has(u.id)
                    return (
                      <button
                        key={e.id}
                        onClick={() => togglePick(u.id)}
                        className={`w-full text-left rounded px-2 py-1.5 text-sm flex items-center gap-2 ${
                          picked
                            ? "bg-emerald-500/10 text-emerald-100"
                            : "text-zinc-300 hover:bg-zinc-900"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center ${
                            picked
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-zinc-600"
                          }`}
                        >
                          {picked && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="flex-1 truncate">
                          {u.full_name || u.email}
                        </span>
                        {!u.full_name && (
                          <span className="text-xs text-zinc-500 truncate">
                            {u.email}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-zinc-400">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Today's drill — knee strikes from clinch"
                className="bg-zinc-950 border-zinc-700 text-white text-sm mt-1"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={submit}
                disabled={submitting || pickedIds.size === 0}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {submitting ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Sign off for {pickedIds.size} student
                {pickedIds.size === 1 ? "" : "s"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="text-zinc-400"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
