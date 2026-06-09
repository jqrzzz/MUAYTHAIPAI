import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { SaasShell, SaasHeader, StatusDot } from "@/components/saas"
import CustomersView from "@/components/platform-admin/customers-view"

export const metadata: Metadata = {
  title: "Customers — MUAYTHAIPAI",
  description: "Everyone who has booked across the network.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
}

export default async function PlatformCustomersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  const { data: u } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()
  if (!u?.is_platform_admin) redirect("/admin")

  return (
    <SaasShell>
      <SaasHeader
        left={
          <>
            <StatusDot />
            <p className="text-[13px] text-zinc-400">Customers</p>
          </>
        }
        right={
          <Link
            href="/platform-admin?full=1"
            className="group inline-flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
            Console
          </Link>
        }
      />

      <main className="mx-auto max-w-5xl px-5 py-8 space-y-6">
        <section>
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1.5 inline-flex items-center gap-1.5">
            <Users className="h-3 w-3 text-indigo-400" />
            Network
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-white leading-tight">Customers</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            Everyone who&apos;s booked across the network — including guests who never created an account.
          </p>
        </section>

        <CustomersView />
      </main>

      <footer className="mx-auto max-w-5xl px-5 py-10 text-center">
        <p className="text-[11px] text-zinc-600">MUAYTHAIPAI · operator console</p>
      </footer>
    </SaasShell>
  )
}
