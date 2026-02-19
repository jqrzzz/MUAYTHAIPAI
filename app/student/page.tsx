import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StudentDashboardClient from "./client"

export const metadata: Metadata = {
  title: "My Training | Muay Thai Thailand Network",
  description: "View your training history, certificates, and upcoming bookings.",
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/student/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Fetch all bookings for this user (across all gyms)
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      organizations:org_id (name, slug, city, logo_url),
      services:service_id (name, category)
    `)
    .eq("user_id", user.id)
    .order("booking_date", { ascending: false })

  // Fetch certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      *,
      organizations:org_id (name, slug)
    `)
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false })

  // Fetch all active gyms for discovery
  const { data: gyms } = await supabase
    .from("organizations")
    .select("id, name, slug, city, province, logo_url, description")
    .eq("status", "active")
    .order("name")

  return (
    <StudentDashboardClient
      user={user}
      profile={profile}
      bookings={bookings || []}
      certificates={certificates || []}
      gyms={gyms || []}
    />
  )
}
