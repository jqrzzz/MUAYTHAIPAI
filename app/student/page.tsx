import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StudentDashboardClient from "./client"
import { getActiveImpersonation } from "@/lib/impersonation"

export const metadata: Metadata = {
  title: "My Training | MUAYTHAIPAI",
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

  // Platform admin "view as student" — pull the impersonated user's data
  // instead of the actor's. Falls back to the actor's own data if no
  // impersonation cookie. Regular users hit the normal path.
  const { data: actorRow } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()
  const isPlatformAdmin = !!actorRow?.is_platform_admin

  let viewUserId: string = user.id
  if (isPlatformAdmin) {
    const impersonation = await getActiveImpersonation()
    if (impersonation?.type === "student" && impersonation.userId) {
      viewUserId = impersonation.userId
    }
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("users").select("*").eq("id", viewUserId).single()

  // Fetch all bookings for this user (across all gyms)
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      organizations:org_id (name, slug, city, logo_url),
      services:service_id (name, category)
    `)
    .eq("user_id", viewUserId)
    .order("booking_date", { ascending: false })

  // Fetch certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      *,
      organizations:org_id (name, slug)
    `)
    .eq("user_id", viewUserId)
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
