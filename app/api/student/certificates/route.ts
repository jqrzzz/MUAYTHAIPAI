import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: certificates, error } = await supabase
    .from("certificates")
    .select("id, level, level_number, certificate_number, issued_at, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("level_number", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ certificates: certificates || [] })
}
