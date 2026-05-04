"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Dumbbell, Users, Building2, ArrowLeft } from "lucide-react"

import { SacredBackground, DynamicGradient } from "@/components/sacred-background"
import { SiteFooterMenu } from "@/components/site-footer-menu"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent } from "@/components/ui/card"

const ROLES = [
  {
    id: "student",
    label: "I'm a student or member",
    description: "Book classes, track your cert progress, access your courses.",
    href: "/student/login",
    icon: Dumbbell,
    accent: "from-orange-500/30 to-amber-500/20",
    iconColor: "text-orange-400",
  },
  {
    id: "trainer",
    label: "I'm a trainer",
    description: "Sign off skills, manage your students, keep your schedule.",
    href: "/trainer/login",
    icon: Users,
    accent: "from-emerald-500/25 to-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    id: "owner",
    label: "I'm a gym owner or admin",
    description: "Manage bookings, students, trainers, and certifications.",
    href: "/admin/login",
    icon: Building2,
    accent: "from-blue-500/25 to-indigo-500/10",
    iconColor: "text-blue-400",
  },
] as const

export default function LoginClient() {
  return (
    <div className="min-h-screen overflow-hidden relative bg-gradient-to-b from-neutral-100 via-white to-neutral-50 dark:from-black dark:via-neutral-900 dark:to-black">
      <h1 className="sr-only">Sign in to MUAYTHAIPAI</h1>

      <DynamicGradient />
      <SacredBackground />
      <SiteHeader hideSoundButton={true} />

      <main className="container relative z-10 flex flex-grow flex-col items-center justify-center py-16 text-center">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <motion.h2
          className="text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-700 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-yellow-500"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Sign in
        </motion.h2>
        <motion.p
          className="mt-2 text-base max-w-md mx-auto text-neutral-600 dark:text-neutral-300"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Pick the option that fits — we'll send you a magic link.
        </motion.p>

        <div className="mt-8 w-full max-w-md grid gap-3">
          {ROLES.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
            >
              <Link href={role.href} className="block group">
                <Card
                  className={`bg-gradient-to-br ${role.accent} border border-white/10 dark:border-white/10 backdrop-blur-md transition-all duration-200 group-hover:scale-[1.02] group-hover:border-orange-500/40`}
                >
                  <CardContent className="p-5 flex items-center gap-4 text-left">
                    <div className="rounded-full bg-white/10 dark:bg-white/5 p-3 shrink-0">
                      <role.icon className={`h-6 w-6 ${role.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-neutral-900 dark:text-white">
                        {role.label}
                      </h3>
                      <p className="text-sm mt-0.5 text-neutral-700 dark:text-neutral-300">
                        {role.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-500 group-hover:text-orange-400 transition-colors shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          className="mt-8 text-sm text-neutral-600 dark:text-neutral-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          New gym?{" "}
          <Link
            href="/signup"
            className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
          >
            List your gym — free 30-day trial
          </Link>
        </motion.p>
      </main>

      <SiteFooterMenu />
    </div>
  )
}
