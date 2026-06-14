import { redirect } from "next/navigation"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import PlatformAdminClient from "./client"
import { createServiceClient } from "@/lib/supabase/service"

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

  // Platform stats. Fetched with a service-role client so row-level security
  // on the operator's own session can't silently zero these network-wide
  // counts — counting the users table under the logged-in client returned 0
  // (the "Total users: 0" bug). Safe: this page is already gated to platform
  // admins above.
  const svc = createServiceClient()

  const [
    { count: totalGyms },
    { count: totalBookings },
    { count: activeSubscriptions },
    { data: bookingEmails },
  ] = await Promise.all([
    svc.from("organizations").select("*", { count: "exact", head: true }),
    svc.from("bookings").select("*", { count: "exact", head: true }),
    svc
      .from("gym_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    svc.from("bookings").select("guest_email").not("guest_email", "is", null),
  ])

  // Real customer reach: most bookings are guests who never created an
  // account, so counting the users table drastically undercounts. Count
  // distinct booking emails instead.
  const totalCustomers = new Set(
    (bookingEmails ?? []).map((b) => (b.guest_email as string).toLowerCase().trim()),
  ).size

  return (
    <PlatformAdminClient
      gyms={(gyms || []) as unknown as Parameters<typeof PlatformAdminClient>[0]["gyms"]}
      blacklist={(blacklist || []) as unknown as Parameters<typeof PlatformAdminClient>[0]["blacklist"]}
      stats={{
        totalGyms: totalGyms || 0,
        totalCustomers,
        totalBookings: totalBookings || 0,
        activeSubscriptions: activeSubscriptions || 0,
      }}
      role={role}
    />
  )
}
