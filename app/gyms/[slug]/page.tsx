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

  // Fetch services
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("org_id", gym.id)
    .eq("is_active", true)
    .order("display_order")

  // Fetch trainers
  const { data: trainers } = await supabase
    .from("trainer_profiles")
    .select("*")
    .eq("org_id", gym.id)
    .eq("is_available", true)
    .order("display_order")

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <GymPageClient gym={gym} services={services || []} trainers={trainers || []} user={user} />
}
