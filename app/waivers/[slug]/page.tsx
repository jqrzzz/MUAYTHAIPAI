import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import WaiverSignClient from "./client"

export const metadata: Metadata = {
  title: "Liability waiver | MUAYTHAIPAI",
  robots: "noindex, nofollow",
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function WaiverSignPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: gym } = await supabase
    .from("organizations")
    .select("id, name, logo_url, city")
    .eq("slug", slug)
    .eq("status", "active")
    .single()

  if (!gym) notFound()

  const { data: waiver } = await supabase
    .from("org_waivers")
    .select("id, version, title, body")
    .eq("org_id", gym.id)
    .eq("is_active", true)
    .maybeSingle()

  // Check if the current student has already signed THIS version
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let alreadySigned = false
  let userEmail: string | null = null
  if (user && waiver) {
    userEmail = user.email ?? null
    const { data: existing } = await supabase
      .from("student_waiver_signatures")
      .select("id")
      .eq("user_id", user.id)
      .eq("waiver_id", waiver.id)
      .maybeSingle()
    alreadySigned = !!existing
  }

  return (
    <WaiverSignClient
      gym={gym}
      waiver={waiver}
      isLoggedIn={!!user}
      userEmail={userEmail}
      alreadySigned={alreadySigned}
    />
  )
}
