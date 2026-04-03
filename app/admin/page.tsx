import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminDashboardClient from "./client"
import { getTodayInPaiTimezone, DEFAULT_TIMEZONE } from "@/lib/timezone"

export const metadata = {
  title: "Admin Dashboard | MUAYTHAIPAI",
  description: "Manage bookings, services, and trainers for your gym",
  robots: "noindex, nofollow",
}

export default async function AdminPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  // Get user's org membership and role
  const { data: membership } = await supabase
    .from("org_members")
    .select(`
      *,
      organizations (*)
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership) {
    redirect("/admin/login?error=no_access")
  }

  const orgTimezone = (membership.organizations as { timezone?: string })?.timezone || DEFAULT_TIMEZONE
  const todayInPai = getTodayInPaiTimezone(orgTimezone)

  // Fetch today's bookings (in Pai time)
  const { data: todaysBookings } = await supabase
    .from("bookings")
    .select(`
      *,
      services (name, category)
    `)
    .eq("org_id", membership.org_id)
    .eq("booking_date", todayInPai)
    .order("booking_time", { ascending: true })

  // Fetch recent bookings (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: recentBookings } = await supabase
    .from("bookings")
    .select(`
      *,
      services (name, category)
    `)
    .eq("org_id", membership.org_id)
    .gte("booking_date", sevenDaysAgo.toISOString().split("T")[0])
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false })
    .limit(20)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: analyticsBookings } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_date,
      payment_method,
      payment_status,
      payment_amount_thb
    `)
    .eq("org_id", membership.org_id)
    .gte("booking_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("booking_date", { ascending: false })

  // Fetch services
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("display_order", { ascending: true })

  // Fetch trainers
  const { data: trainers } = await supabase
    .from("trainer_profiles")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("display_order", { ascending: true })

  const { data: orgSettings } = await supabase.from("org_settings").select("*").eq("org_id", membership.org_id).single()

  return (
    <AdminDashboardClient
      user={user}
      membership={membership}
      organization={membership.organizations}
      todaysBookings={todaysBookings || []}
      recentBookings={recentBookings || []}
      analyticsBookings={analyticsBookings || []}
      services={services || []}
      trainers={trainers || []}
      todayDate={todayInPai}
      timezone={orgTimezone}
      orgSettings={orgSettings}
    />
  )
}
