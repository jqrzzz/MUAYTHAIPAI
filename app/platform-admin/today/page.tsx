import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowUpRight, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import TodayPanel from "@/components/platform-admin/today-panel"
import PlatformCommandBar from "@/components/platform-admin/command-bar"
import ViewAsPicker from "@/components/platform-admin/view-as-picker"
import { SaasShell, SaasHeader, StatusDot } from "@/components/saas"

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
    .select("is_platform_admin, full_name, email")
    .eq("id", user.id)
    .single()
  if (!u?.is_platform_admin) redirect("/admin")

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

        <TodayPanel />
        <ViewAsPicker />
        <PlatformCommandBar />
      </main>

      <footer className="mx-auto max-w-3xl px-5 py-10 text-center">
        <p className="text-[11px] text-zinc-600">
          MUAYTHAIPAI · operator console
        </p>
      </footer>
    </SaasShell>
  )
}
