import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's org
  const { data: membership } = await supabase.from("org_members").select("org_id, role").eq("user_id", user.id).single()

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 })
  }

  // Get all students who have bookings or credits at this gym
  const { data: students, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      display_name,
      phone,
      created_at
    `)
    .in("id", supabase.from("bookings").select("user_id").eq("org_id", membership.org_id).not("user_id", "is", null))
    .order("full_name")

  // Also get students with credits
  const { data: creditStudents } = await supabase
    .from("student_credits")
    .select(`
      user_id,
      users (
        id,
        email,
        full_name,
        display_name,
        phone,
        created_at
      )
    `)
    .eq("org_id", membership.org_id)

  // Get credits for all students
  const { data: allCredits } = await supabase.from("student_credits").select("*").eq("org_id", membership.org_id)

  // Get recent transactions
  const { data: recentTransactions } = await supabase
    .from("credit_transactions")
    .select(`
      *,
      users:user_id (full_name, display_name)
    `)
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false })
    .limit(50)

  // Merge students lists and add credits
  const studentMap = new Map()

  students?.forEach((s) => studentMap.set(s.id, { ...s, credits: null }))
  creditStudents?.forEach((cs) => {
    if (cs.users && !studentMap.has(cs.users.id)) {
      studentMap.set(cs.users.id, { ...cs.users, credits: null })
    }
  })

  // Add credits to students
  allCredits?.forEach((credit) => {
    const student = studentMap.get(credit.user_id)
    if (student) {
      student.credits = credit
    }
  })

  return NextResponse.json({
    students: Array.from(studentMap.values()),
    transactions: recentTransactions || [],
    orgId: membership.org_id,
  })
}
