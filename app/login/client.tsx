"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Dumbbell, Users, Building2 } from "lucide-react"
import { AuthCard } from "@/components/saas"

function errorMessageFor(code: string | null): string | null {
  switch (code) {
    case "auth_callback_error":
      return "That magic link didn't work — try requesting a new one below."
    case "expired":
      return "Your magic link expired. Send yourself a fresh one."
    default:
      return null
  }
}

const ROLES = [
  {
    id: "student",
    label: "I'm a student or member",
    description:
      "Book classes, track cert progress, access your courses.",
    href: "/student/login",
    icon: Dumbbell,
  },
  {
    id: "trainer",
    label: "I'm a trainer",
    description: "Sign off skills, manage students, keep your schedule.",
    href: "/trainer/login",
    icon: Users,
  },
  {
    id: "owner",
    label: "I'm a gym owner or admin",
    description: "Manage bookings, students, trainers, certifications.",
    href: "/admin/login",
    icon: Building2,
  },
] as const

function LoginInner() {
  const searchParams = useSearchParams()
  const errorMessage = errorMessageFor(searchParams.get("error"))
  return (
    <AuthCard
      title="Sign in"
      subtitle="Pick the option that fits — we'll email you a 6-digit sign-in code."
    >
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 rounded-lg ring-1 ring-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-[12px] text-amber-200"
        >
          {errorMessage}
        </div>
      )}
      <div className="grid gap-2">
        {ROLES.map((role) => {
          const Icon = role.icon
          return (
            <Link
              key={role.id}
              href={role.href}
              className="group rounded-xl ring-1 ring-zinc-900 bg-zinc-900/40 hover:bg-zinc-900/70 hover:ring-zinc-800 backdrop-blur-sm p-4 flex items-center gap-3 transition-all"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/15 shrink-0">
                <Icon className="h-4 w-4 text-indigo-300" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white">
                  {role.label}
                </p>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  {role.description}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          )
        })}
      </div>
    </AuthCard>
  )
}

// useSearchParams requires the component to be in a Suspense boundary.
export default function LoginClient() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
