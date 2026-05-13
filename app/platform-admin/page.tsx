import { redirect } from "next/navigation"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import PlatformAdminClient from "./client"

export default async function PlatformAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ full?: string }>
}) {
  const { supabase, user, isPlatformAdmin, role } = await getPlatformAdmin()

  if (!user) {
    redirect("/admin/login")
  }

  if (!isPlatformAdmin) {
    redirect("/admin")
  }

  // Default landing is the briefing page (`/platform-admin/today`) — the
  // operator's mission-control morning view. The 11-tab full dashboard
  // remains accessible at /platform-admin?full=1, linked from the
  // briefing page's "Full dashboard" button.
  const params = await searchParams
  if (params.full !== "1") {
    redirect("/platform-admin/today")
  }

  // Fetch all gyms with subscriptions
  const { data: gyms } = await supabase
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
    .order("created_at", { ascending: false })

  // Fetch blacklist
  const { data: blacklist } = await supabase
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
    .order("created_at", { ascending: false })

  // Platform stats
  const { count: totalGyms } = await supabase.from("organizations").select("*", { count: "exact", head: true })

  const { count: totalStudents } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_platform_admin", false)

  const { count: totalBookings } = await supabase.from("bookings").select("*", { count: "exact", head: true })

  const { data: activeSubscriptions } = await supabase
    .from("gym_subscriptions")
    .select("*", { count: "exact" })
    .eq("status", "active")

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
      role={role}
    />
  )
}
