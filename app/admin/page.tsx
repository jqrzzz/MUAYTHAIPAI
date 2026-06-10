import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminDashboardClient from "./client"
import { getTodayInPaiTimezone, DEFAULT_TIMEZONE } from "@/lib/timezone"
import { getActiveImpersonation } from "@/lib/impersonation"

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

  // Platform admins land here when they click "View as gym admin" — they
  // don't have a real org_members row, so we synthesize one from the
  // impersonation cookie. Without the cookie they get bounced back to
  // /platform-admin (their natural home).
  const { data: userRow } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()
  const isPlatformAdmin = !!userRow?.is_platform_admin

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let membership: any = null

  if (isPlatformAdmin) {
    const impersonation = await getActiveImpersonation()
    if (impersonation?.type === "gym_admin" && impersonation.orgId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", impersonation.orgId)
        .single()
      if (org) {
        membership = {
          org_id: impersonation.orgId,
          role: "admin",
          organizations: org,
        }
      }
    }
    if (!membership) {
      redirect("/platform-admin")
    }
  } else {
    const { data: realMembership } = await supabase
      .from("org_members")
      .select(`
        *,
        organizations (*)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()
    membership = realMembership
  }

  if (!membership) {
    redirect("/admin/login?error=no_access")
  }

  // Role gate: /admin is for gym owners + admins only. Trainers go to
  // /trainer (their dedicated dashboard); anyone else (including any
  // legacy student-role members) lands on /student.
  // See docs/roles-and-access.md for the full role/route matrix.
  const role = String(membership.role)
  if (role === "trainer") {
    redirect("/trainer")
  }
  if (role !== "owner" && role !== "admin") {
    redirect("/student")
  }

  // First-time setup: owners/admins with no services yet get sent to the
  // onboarding wizard. Mirrors the inverse check in /onboarding/page.tsx
  // (which sends users back here once they have any services).
  const { count: serviceCount } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("org_id", membership.org_id)

  if (!serviceCount) {
    redirect("/onboarding")
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
      payment_amount_thb,
      payment_amount_usd,
      payment_currency
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

  const { data: subscription } = await supabase
    .from("gym_subscriptions")
    .select("status, trial_ends_at, current_period_end, price_thb")
    .eq("org_id", membership.org_id)
    .maybeSingle()

  return (
    <AdminDashboardClient
      user={user}
      membership={membership}
      organization={membership.organizations}
      todaysBookings={(todaysBookings || []) as unknown as Parameters<typeof AdminDashboardClient>[0]["todaysBookings"]}
      recentBookings={(recentBookings || []) as unknown as Parameters<typeof AdminDashboardClient>[0]["recentBookings"]}
      analyticsBookings={(analyticsBookings || []) as unknown as Parameters<typeof AdminDashboardClient>[0]["analyticsBookings"]}
      services={(services || []) as unknown as Parameters<typeof AdminDashboardClient>[0]["services"]}
      trainers={(trainers || []) as unknown as Parameters<typeof AdminDashboardClient>[0]["trainers"]}
      todayDate={todayInPai}
      timezone={orgTimezone}
      orgSettings={(orgSettings) as unknown as Parameters<typeof AdminDashboardClient>[0]["orgSettings"]}
      subscription={subscription}
    />
  )
}
