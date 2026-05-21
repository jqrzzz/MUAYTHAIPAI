import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowUpRight, Briefcase, GraduationCap, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import TodayPanel from "@/components/platform-admin/today-panel"
import NetworkAnalytics from "@/components/platform-admin/network-analytics"
import PlatformCommandBar from "@/components/platform-admin/command-bar"
import ViewAsPicker from "@/components/platform-admin/view-as-picker"
import SignalsPanel from "@/components/platform-admin/signals-panel"
import InvitePartnerPanel from "@/components/platform-admin/invite-partner-panel"
import { SaasShell, SaasHeader, StatusDot, Surface } from "@/components/saas"

export const metadata: Metadata = {
  title: "Today — MUAYTHAIPAI",
  description: "Operator command center — what needs attention right now.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
}

export default async function TodayHomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  const { data: u } = await supabase
    .from("users")
    .select("is_platform_admin, platform_admin_role, full_name, email")
    .eq("id", user.id)
    .single()
  if (!u?.is_platform_admin) redirect("/admin")
  const role: "full" | "partner" =
    (u as { platform_admin_role?: string }).platform_admin_role === "partner" ? "partner" : "full"

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening"
  const operator = u.full_name?.split(" ")[0] || u.email.split("@")[0]
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <SaasShell>
      <SaasHeader
        left={
          <>
            <StatusDot />
            <p className="text-[13px] text-zinc-400 truncate">
              <span className="text-zinc-500">{greeting},</span>{" "}
              <span className="text-zinc-200 font-medium">{operator}</span>
            </p>
          </>
        }
        right={
          <Link
            href="/platform-admin?full=1"
            className="group inline-flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            Full dashboard
            <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        }
      />

      <main className="mx-auto max-w-3xl px-5 py-8 space-y-8">
        <section>
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1.5 inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Operator briefing
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-white leading-tight">
            {dateLabel}
          </h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            What needs your attention across the network today.
          </p>
        </section>

        <SignalsPanel />

        <TodayPanel />

        <NetworkAnalytics />

        {/* Quick link to the Curriculum — keeps the network's
            cornerstone always one click away */}
        <Link
          href="/platform-admin?full=1#curriculum"
          className="block group"
        >
          <Surface interactive>
            <div className="px-4 py-3.5 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20 shrink-0">
                <GraduationCap className="h-4 w-4 text-indigo-300" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white">
                  Naga–Garuda curriculum
                </p>
                <p className="text-[12px] text-zinc-500 truncate">
                  5 levels · 51 modules · 95 lessons across the network
                </p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-indigo-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </Surface>
        </Link>

        {/* Boardroom — business plan, pitch deck, notes, discussion */}
        <Link href="/platform-admin/boardroom" className="block group">
          <Surface interactive>
            <div className="px-4 py-3.5 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20 shrink-0">
                <Briefcase className="h-4 w-4 text-indigo-300" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white">Boardroom</p>
                <p className="text-[12px] text-zinc-500 truncate">
                  Business plan, pitch deck, notes, discussion
                </p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-700 group-hover:text-indigo-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </Surface>
        </Link>

        <ViewAsPicker />
        <PlatformCommandBar />

        {/* "Invite a partner" — only full admins can promote others. */}
        {role === "full" && <InvitePartnerPanel />}
      </main>

      <footer className="mx-auto max-w-3xl px-5 py-10 text-center">
        <p className="text-[11px] text-zinc-600">
          MUAYTHAIPAI · operator console
        </p>
      </footer>
    </SaasShell>
  )
}
