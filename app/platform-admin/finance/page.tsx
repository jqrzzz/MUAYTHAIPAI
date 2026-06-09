import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { SaasShell, SaasHeader, StatusDot } from "@/components/saas"
import NetworkAnalytics from "@/components/platform-admin/network-analytics"
import StripeFinance from "@/components/platform-admin/stripe-finance"
import PlatformNet from "@/components/platform-admin/platform-net"
import GymPayoutsSummary from "@/components/platform-admin/gym-payouts-summary"

export const metadata: Metadata = {
  title: "Finance — MUAYTHAIPAI",
  description: "Network revenue, Stripe payouts, and platform net.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
}

export default async function PlatformFinancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  const { data: u } = await supabase
    .from("users")
    .select("is_platform_admin, platform_admin_role")
    .eq("id", user.id)
    .single()
  if (!u?.is_platform_admin) redirect("/admin")
  const role: "full" | "partner" =
    (u as { platform_admin_role?: string }).platform_admin_role === "partner" ? "partner" : "full"

  return (
    <SaasShell>
      <SaasHeader
        left={
          <>
            <StatusDot />
            <p className="text-[13px] text-zinc-400">Finance</p>
          </>
        }
        right={
          <Link
            href="/platform-admin/today"
            className="group inline-flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
            Briefing
          </Link>
        }
      />

      <main className="mx-auto max-w-5xl px-5 py-8 space-y-8">
        <section>
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1.5 inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            Money
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-white leading-tight">Finance</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            Network revenue, the actual Stripe payouts to your bank, and what OckOck keeps after fees and gym payouts.
          </p>
        </section>

        <NetworkAnalytics />

        {/* Money surfaces — full platform admins only (partners excluded). */}
        {role === "full" && <StripeFinance />}
        {role === "full" && <PlatformNet />}
        {role === "full" && <GymPayoutsSummary />}
      </main>

      <footer className="mx-auto max-w-5xl px-5 py-10 text-center">
        <p className="text-[11px] text-zinc-600">MUAYTHAIPAI · operator console</p>
      </footer>
    </SaasShell>
  )
}
