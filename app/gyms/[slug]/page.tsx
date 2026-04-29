import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import GymPageClient from "./client"

interface GymPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: GymPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: gym } = await supabase
    .from("organizations")
    .select("name, description, city")
    .eq("slug", slug)
    .eq("status", "active")
    .single()

  if (!gym) {
    return { title: "Gym Not Found" }
  }

  return {
    title: `${gym.name} | Muay Thai Thailand Network`,
    description: gym.description || `Train Muay Thai at ${gym.name} in ${gym.city}, Thailand.`,
  }
}

export default async function GymPage({ params }: GymPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch gym details
  const { data: gym } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single()

  if (!gym) {
    notFound()
  }

  // Fetch services, trainers, settings, and cert-ladder activity in parallel
  const [servicesRes, trainersRes, settingsRes, certsRes, enrollmentsRes] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("org_id", gym.id)
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("trainer_profiles")
      .select("*")
      .eq("org_id", gym.id)
      .eq("is_available", true)
      .order("display_order"),
    supabase
      .from("org_settings")
      .select("operating_hours, show_prices")
      .eq("org_id", gym.id)
      .single(),
    supabase
      .from("certificates")
      .select("level")
      .eq("org_id", gym.id)
      .eq("status", "active"),
    supabase
      .from("certification_enrollments")
      .select("level, status")
      .eq("org_id", gym.id)
      .eq("status", "active"),
  ])

  // Aggregate cert ladder activity per level — used by the public page
  // to show prospective students what this gym actually issues.
  const issuedByLevel: Record<string, number> = {}
  for (const c of certsRes.data || []) {
    issuedByLevel[c.level] = (issuedByLevel[c.level] ?? 0) + 1
  }
  const enrolledByLevel: Record<string, number> = {}
  for (const e of enrollmentsRes.data || []) {
    enrolledByLevel[e.level] = (enrolledByLevel[e.level] ?? 0) + 1
  }
  const totalCerts = (certsRes.data || []).length
  const totalEnrolled = (enrollmentsRes.data || []).length

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <GymPageClient
      gym={gym}
      services={servicesRes.data || []}
      trainers={trainersRes.data || []}
      settings={settingsRes.data}
      user={user}
      certActivity={{
        issuedByLevel,
        enrolledByLevel,
        totalCerts,
        totalEnrolled,
      }}
    />
  )
}
