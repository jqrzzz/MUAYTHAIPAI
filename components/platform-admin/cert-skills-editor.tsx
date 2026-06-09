"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, X, Pencil, RotateCcw, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Surface } from "@/components/saas"

interface SkillRow {
  position: number
  text: string
  default: string
  edited: boolean
}

/**
 * Inline reword editor for one level's assessment skills.
 *
 * Reword only — text changes in place, so counts, ordering, and every
 * historical sign-off (keyed by skill_index = position) stay valid. Talks to
 * /api/platform-admin/cert-skills.
 */
export default function CertSkillsEditor({ levelId }: { levelId: string }) {
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editingPos, setEditingPos] = useState<number | null>(null)
  const [draft, setDraft] = useState("")
  const [savingPos, setSavingPos] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/platform-admin/cert-skills", { cache: "no-store" })
      if (!res.ok) throw new Error("failed")
      const d = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const level = (d.levels ?? []).find((l: any) => l.id === levelId)
      setSkills(level?.skills ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [levelId])

  useEffect(() => {
    load()
  }, [load])

  const save = async (position: number, text: string) => {
    const value = text.trim()
    if (!value) {
      setActionError("Skill can't be empty.")
      return
    }
    setSavingPos(position)
    setActionError(null)
    try {
      const res = await fetch("/api/platform-admin/cert-skills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level_id: levelId, position, skill: value }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Couldn't save")
      }
      setSkills((prev) =>
        prev.map((s) => (s.position === position ? { ...s, text: value, edited: value !== s.default } : s)),
      )
      setEditingPos(null)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Couldn't save")
    } finally {
      setSavingPos(null)
    }
  }

  if (loading) {
    return (
      <Surface>
        <div className="flex h-24 items-center justify-center text-[13px] text-zinc-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading skills…
        </div>
      </Surface>
    )
  }
  if (error) {
    return (
      <Surface>
        <div className="px-4 py-6 text-center text-[13px] text-zinc-400">
          Couldn&apos;t load skills.{" "}
          <button onClick={load} className="text-indigo-300 underline">
            Try again
          </button>
        </div>
      </Surface>
    )
  }

  return (
    <>
      <Surface>
        <ul className="divide-y divide-zinc-900/80">
          {skills.map((s) => {
            const isEditing = editingPos === s.position
            const isSaving = savingPos === s.position
            return (
              <li key={s.position} className="flex items-start gap-3 px-4 py-2.5 text-[13px]">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[10px] font-semibold tabular-nums text-zinc-500 ring-1 ring-zinc-700/60">
                  {s.position + 1}
                </span>

                {isEditing ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") save(s.position, draft)
                        if (e.key === "Escape") setEditingPos(null)
                      }}
                      maxLength={300}
                      className="h-8 flex-1 border-zinc-700 bg-zinc-950 text-[13px] text-white"
                    />
                    <button
                      onClick={() => save(s.position, draft)}
                      disabled={isSaving}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60"
                      aria-label="Save"
                    >
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => setEditingPos(null)}
                      disabled={isSaving}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-200"
                      aria-label="Cancel"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-1 items-start justify-between gap-3">
                    <span className="text-zinc-200">
                      {s.text}
                      {s.edited && (
                        <span className="ml-2 rounded bg-indigo-500/15 px-1.5 py-0.5 align-middle text-[10px] font-medium text-indigo-300">
                          reworded
                        </span>
                      )}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      {s.edited && (
                        <button
                          onClick={() => save(s.position, s.default)}
                          disabled={isSaving}
                          title="Reset to default wording"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 disabled:opacity-60"
                          aria-label="Reset to default"
                        >
                          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setActionError(null)
                          setDraft(s.text)
                          setEditingPos(s.position)
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-200"
                        aria-label="Edit skill"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Surface>
      {actionError && <p className="px-1 text-[12px] text-red-400">{actionError}</p>}
      <p className="px-1 text-[11px] text-zinc-600">
        Reword changes the wording network-wide for new sign-offs — it never reorders or removes a
        criterion, so existing sign-offs stay valid. Adding or removing skills is a separate change.
      </p>
    </>
  )
}
