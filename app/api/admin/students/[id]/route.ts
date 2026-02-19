import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's org
  const { data: membership } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single()

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 })
  }

  // Get student info
  const { data: student } = await supabase.from("users").select("*").eq("id", id).single()

  // Get student credits
  const { data: credits } = await supabase
    .from("student_credits")
    .select("*")
    .eq("org_id", membership.org_id)
    .eq("user_id", id)

  // Get student transactions at this gym
  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("org_id", membership.org_id)
    .eq("user_id", id)
    .order("created_at", { ascending: false })

  // Get student bookings at this gym
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      services (name, category)
    `)
    .eq("org_id", membership.org_id)
    .eq("user_id", id)
    .order("booking_date", { ascending: false })
    .limit(20)

  return NextResponse.json({
    student,
    credits: credits || [],
    transactions: transactions || [],
    bookings: bookings || [],
  })
}
