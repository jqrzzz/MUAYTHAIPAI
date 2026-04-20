import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PlatformAdminClient from "./client"

export default async function PlatformAdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  // Check if user is platform admin
  const { data: userData } = await supabase.from("users").select("is_platform_admin").eq("id", user.id).single()

  if (!userData?.is_platform_admin) {
    redirect("/admin")
  }

  const [gymsRes, blacklistRes, gymsCount, studentsCount, bookingsCount, activeSubsRes] = await Promise.all([
    supabase
      .from("organizations")
      .select(`
        *,
        gym_subscriptions (*),
        org_members (
          user_id,
          role,
          users (full_name, email)
        )
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("blacklist")
      .select(`
        *,
        organizations:added_by_org_id (name),
        blacklist_comments (
          id,
          comment,
          created_at,
          organizations:org_id (name)
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),

    supabase.from("organizations").select("*", { count: "exact", head: true }),

    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_platform_admin", false),

    supabase.from("bookings").select("*", { count: "exact", head: true }),

    supabase
      .from("gym_subscriptions")
      .select("*", { count: "exact" })
      .eq("status", "active"),
  ])

  const gyms = gymsRes.data
  const blacklist = blacklistRes.data
  const totalGyms = gymsCount.count
  const totalStudents = studentsCount.count
  const totalBookings = bookingsCount.count
  const activeSubscriptions = activeSubsRes.data

  return (
    <PlatformAdminClient
      gyms={gyms || []}
      blacklist={blacklist || []}
      stats={{
        totalGyms: totalGyms || 0,
        totalStudents: totalStudents || 0,
        totalBookings: totalBookings || 0,
        activeSubscriptions: activeSubscriptions?.length || 0,
      }}
    />
  )
}
