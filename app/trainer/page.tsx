import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TrainerDashboardClient from "./client"

export const metadata: Metadata = {
  title: "Trainer Dashboard | Muay Thai Thailand Network",
  description: "Manage your classes, students, and profile.",
}

export default async function TrainerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/trainer/login")
  }

  // Fetch trainer profile
  const { data: trainerProfile } = await supabase
    .from("trainer_profiles")
    .select(`
      *,
      organizations:org_id (id, name, slug, city, timezone, logo_url)
    `)
    .eq("user_id", user.id)
    .single()

  // If not a trainer, redirect to appropriate place
  if (!trainerProfile) {
    redirect("/trainer/login")
  }

  const orgId = trainerProfile.org_id

  // Fetch today's bookings for this gym
  const today = new Date().toISOString().split("T")[0]
  const { data: todayBookings } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_date,
      booking_time,
      status,
      payment_status,
      payment_method,
      guest_name,
      guest_email,
      guest_phone,
      customer_notes,
      services:service_id (name, category, duration_minutes),
      users:user_id (id, full_name, email, avatar_url)
    `)
    .eq("org_id", orgId)
    .eq("booking_date", today)
    .order("booking_time", { ascending: true })

  // Fetch all students for this gym (from bookings and student_credits)
  const { data: students } = await supabase
    .from("student_credits")
    .select(`
      user_id,
      credit_type,
      credits_remaining,
      expires_at,
      users:user_id (id, full_name, email, avatar_url, created_at)
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Also get students from bookings who may not have credits (registered users)
  const { data: bookingStudents } = await supabase
    .from("bookings")
    .select(`
      user_id,
      users:user_id (id, full_name, email, avatar_url, created_at)
    `)
    .eq("org_id", orgId)
    .not("user_id", "is", null)
    .order("created_at", { ascending: false })

  // Get guest bookings (students without accounts)
  const { data: guestBookings } = await supabase
    .from("bookings")
    .select(`
      guest_name,
      guest_email,
      created_at,
      booking_date
    `)
    .eq("org_id", orgId)
    .is("user_id", null)
    .not("guest_email", "is", null)
    .order("booking_date", { ascending: false })

  // Combine and dedupe students
  const allStudentMap = new Map()
  
  // Add students with credits
  students?.forEach((s) => {
    if (s.users && typeof s.users === "object" && "id" in s.users) {
      allStudentMap.set(s.users.id, {
        ...s.users,
        credits_remaining: s.credits_remaining,
        credit_type: s.credit_type,
        expires_at: s.expires_at,
      })
    }
  })
  
  // Add registered users from bookings
  bookingStudents?.forEach((b) => {
    if (b.users && typeof b.users === "object" && "id" in b.users && !allStudentMap.has(b.users.id)) {
      allStudentMap.set(b.users.id, {
        ...b.users,
        credits_remaining: 0,
        credit_type: null,
        expires_at: null,
      })
    }
  })
  
  // Add guest students (keyed by email to dedupe)
  guestBookings?.forEach((g) => {
    if (g.guest_email && !allStudentMap.has(`guest_${g.guest_email}`)) {
      // Check if this email isn't already in as a registered user
      const existingByEmail = Array.from(allStudentMap.values()).find(
        (s) => s.email === g.guest_email
      )
      if (!existingByEmail) {
        allStudentMap.set(`guest_${g.guest_email}`, {
          id: `guest_${g.guest_email}`,
          full_name: g.guest_name,
          email: g.guest_email,
          avatar_url: null,
          created_at: g.created_at,
          credits_remaining: 0,
          credit_type: null,
          expires_at: null,
        })
      }
    }
  })
  
  const allStudents = Array.from(allStudentMap.values())

  return (
    <TrainerDashboardClient
      user={user}
      trainerProfile={trainerProfile}
      organization={trainerProfile.organizations}
      todayBookings={todayBookings || []}
      students={allStudents}
    />
  )
}
