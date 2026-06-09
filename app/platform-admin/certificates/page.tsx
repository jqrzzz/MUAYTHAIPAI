import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Award } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { SaasShell, SaasHeader, StatusDot } from "@/components/saas"
import CertificatesView from "@/components/platform-admin/certificates-view"

export const metadata: Metadata = {
  title: "Certificates — MUAYTHAIPAI",
  description: "Every Naga→Garuda certificate across the network.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
}

export default async function PlatformCertificatesPage() {
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
            <p className="text-[13px] text-zinc-400">Certificates</p>
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

      <main className="mx-auto max-w-4xl px-5 py-8 space-y-6">
        <section>
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1.5 inline-flex items-center gap-1.5">
            <Award className="h-3 w-3 text-indigo-400" />
            The standard
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-white leading-tight">Certificates</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            Every Naga→Garuda certificate issued across the network. Gyms issue them via trainer
            sign-offs; you can review and revoke or reinstate any of them.
          </p>
        </section>

        <CertificatesView />
      </main>

      <footer className="mx-auto max-w-4xl px-5 py-10 text-center">
        <p className="text-[11px] text-zinc-600">MUAYTHAIPAI · operator console</p>
      </footer>
    </SaasShell>
  )
}
