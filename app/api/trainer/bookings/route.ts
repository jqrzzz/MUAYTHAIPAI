import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const orgId = searchParams.get("org_id")
  const date = searchParams.get("date")
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")

  if (!orgId) {
    return NextResponse.json({ error: "org_id required" }, { status: 400 })
  }

  // Verify user is authenticated and is a trainer for this org
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: trainerProfile } = await supabase
    .from("trainer_profiles")
    .select("id, org_id")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single()

  if (!trainerProfile) {
    return NextResponse.json({ error: "Not a trainer for this organization" }, { status: 403 })
  }

  let query = supabase
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
    .order("booking_time", { ascending: true })

  // Filter by single date or date range
  if (date) {
    query = query.eq("booking_date", date)
  } else if (startDate && endDate) {
    query = query.gte("booking_date", startDate).lte("booking_date", endDate)
  }

  const { data: bookings, error } = await query

  if (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }

  return NextResponse.json({ bookings: bookings || [] })
}
