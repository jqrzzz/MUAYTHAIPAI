import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch student's own credits
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get all credits for this student
  const { data: credits, error } = await supabase
    .from("student_credits")
    .select(`
      *,
      organizations(name, slug, logo_url)
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get recent transactions
  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select(`
      *,
      organizations(name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return NextResponse.json({ credits, transactions: transactions || [] })
}
