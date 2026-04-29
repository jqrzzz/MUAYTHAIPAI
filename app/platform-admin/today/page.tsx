import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import TodayPanel from "@/components/platform-admin/today-panel"
import PlatformCommandBar from "@/components/platform-admin/command-bar"

export const metadata: Metadata = {
  title: "Today — MUAYTHAIPAI",
  description: "Operator command center — what needs attention right now.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-3 py-2.5 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500">
              {greeting}, {operator}
            </p>
            <p className="text-sm font-semibold text-white">Command center</p>
          </div>
          <Link
            href="/platform-admin"
            className="text-xs text-orange-400 hover:underline inline-flex items-center gap-1"
          >
            Full dashboard
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl p-3 space-y-4">
        <TodayPanel />
        <div>
          <PlatformCommandBar />
        </div>
      </main>
    </div>
  )
}
