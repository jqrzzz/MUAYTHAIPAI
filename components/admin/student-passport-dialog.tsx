"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Award,
  CheckCircle2,
  Lock,
  Globe,
  ChevronRight,
} from "lucide-react"

interface PassportLadder {
  id: string
  name: string
  number: number
  icon: string
  skills: Array<{
    index: number
    label: string
    signed_off_here: boolean
    signed_off_anywhere: boolean
  }>
  total_skills: number
  signed_off_here: number
  signed_off_anywhere: number
  earned_here: boolean
  certificate_number: string | null
  issued_at: string | null
  enrolled_here: boolean
  enrolled_at: string | null
}

interface Passport {
  student: {
    id: string
    email: string
    full_name: string | null
    display_name: string | null
    phone: string | null
    created_at: string
  }
  ladder: PassportLadder[]
  recent_signoffs: Array<{
    id: string
    level: string
    skill_index: number
    skill_label: string
    notes: string | null
    signed_off_at: string
    signed_off_by: string | null
  }>
  cross_network: {
    total_signoffs_anywhere: number
    gyms_visited: number
  }
  enrollments: Array<{
    id: string
    level: string
    status: string
    enrolled_at: string
  }>
}

export default function StudentPassportDialog({
  studentId,
  open,
  onOpenChange,
}: {
  studentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [passport, setPassport] = useState<Passport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !studentId) {
      setPassport(null)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/admin/students/${studentId}/passport`)
      .then(async (r) => {
        const d = await r.json()
        if (!cancelled) setPassport(r.ok ? d : null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, studentId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Cert ladder passport</DialogTitle>
        </DialogHeader>

        {loading || !passport ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-500" />
          </div>
        ) : (
          <PassportBody passport={passport} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PassportBody({ passport }: { passport: Passport }) {
  const s = passport.student
  const name = s.display_name || s.full_name || s.email
  const cn = passport.cross_network

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white">{name}</h3>
        <p className="text-xs text-zinc-500">{s.email}</p>
        {cn.gyms_visited > 1 && (
          <p className="text-xs text-orange-400 mt-1 inline-flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {cn.total_signoffs_anywhere} signoffs across {cn.gyms_visited} gyms
          </p>
        )}
      </div>

      <div className="space-y-2">
        {passport.ladder.map((lvl) => (
          <LadderRow key={lvl.id} lvl={lvl} />
        ))}
      </div>

      {passport.recent_signoffs.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Recent signoffs at this gym
          </p>
          <div className="space-y-1">
            {passport.recent_signoffs.slice(0, 10).map((so) => (
              <div
                key={so.id}
                className="flex items-start gap-2 text-xs border-l-2 border-zinc-800 pl-2 py-0.5"
              >
                <span className="text-zinc-500 font-mono shrink-0">
                  {new Date(so.signed_off_at).toLocaleDateString()}
                </span>
                <span className="text-zinc-300">
                  <span className="capitalize">{so.level}</span>
                  <span className="text-zinc-500"> · </span>
                  {so.skill_label}
                  {so.signed_off_by && (
                    <span className="text-zinc-500"> by {so.signed_off_by}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LadderRow({ lvl }: { lvl: PassportLadder }) {
  const pctHere = lvl.total_skills
    ? Math.round((lvl.signed_off_here / lvl.total_skills) * 100)
    : 0
  const pctAnywhere = lvl.total_skills
    ? Math.round((lvl.signed_off_anywhere / lvl.total_skills) * 100)
    : 0
  const elsewhereOnly = lvl.signed_off_anywhere - lvl.signed_off_here

  const tone = lvl.earned_here
    ? "border-orange-700/40 bg-orange-500/5"
    : lvl.enrolled_here
      ? "border-amber-700/40 bg-amber-500/5"
      : lvl.signed_off_anywhere > 0
        ? "border-zinc-700 bg-zinc-950"
        : "border-zinc-800 bg-zinc-950"

  return (
    <details className={`rounded border ${tone}`}>
      <summary className="cursor-pointer p-2.5 select-none">
        <div className="flex items-center gap-2">
          <span className="text-lg shrink-0">{lvl.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-white">
                {lvl.name}{" "}
                <span className="text-zinc-500 font-mono text-xs">
                  Lv.{lvl.number}
                </span>
              </p>
              {lvl.earned_here ? (
                <Badge className="bg-orange-600 text-white text-xs gap-1">
                  <Award className="h-3 w-3" /> Earned
                </Badge>
              ) : lvl.enrolled_here ? (
                <Badge className="bg-amber-700 text-amber-100 text-xs">
                  Enrolled
                </Badge>
              ) : lvl.signed_off_here === 0 && lvl.signed_off_anywhere === 0 ? (
                <Badge
                  variant="outline"
                  className="text-zinc-500 border-zinc-700 text-xs gap-1"
                >
                  <Lock className="h-3 w-3" /> Locked
                </Badge>
              ) : null}
              {elsewhereOnly > 0 && !lvl.earned_here && (
                <span className="text-[10px] text-zinc-500">
                  +{elsewhereOnly} skill{elsewhereOnly === 1 ? "" : "s"} from
                  other gyms
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1 flex-1 rounded-full bg-zinc-800 overflow-hidden relative">
                {/* Anywhere progress (back) */}
                <div
                  className="absolute inset-y-0 left-0 bg-zinc-600"
                  style={{ width: `${pctAnywhere}%` }}
                />
                {/* This-gym progress (front, highlighted) */}
                <div
                  className={`absolute inset-y-0 left-0 ${
                    lvl.earned_here ? "bg-orange-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${pctHere}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {lvl.signed_off_here}/{lvl.total_skills}
              </span>
            </div>
            {lvl.earned_here && lvl.certificate_number && (
              <p className="text-xs text-zinc-500 mt-1">
                {lvl.certificate_number} · issued{" "}
                {lvl.issued_at
                  ? new Date(lvl.issued_at).toLocaleDateString()
                  : "—"}
              </p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
        </div>
      </summary>
      <div className="border-t border-zinc-800 p-2.5">
        <ul className="space-y-1">
          {lvl.skills.map((sk) => (
            <li
              key={sk.index}
              className="flex items-start gap-2 text-xs"
            >
              {sk.signed_off_here ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
              ) : sk.signed_off_anywhere ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-500 mt-0.5 shrink-0" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border border-zinc-700 mt-0.5 shrink-0" />
              )}
              <span
                className={
                  sk.signed_off_here
                    ? "text-zinc-100"
                    : sk.signed_off_anywhere
                      ? "text-zinc-400"
                      : "text-zinc-500"
                }
              >
                {sk.label}
                {sk.signed_off_anywhere && !sk.signed_off_here && (
                  <span className="text-[10px] text-zinc-500 ml-1.5">
                    · elsewhere
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
