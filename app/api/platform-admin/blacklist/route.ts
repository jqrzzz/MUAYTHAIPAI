import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check if user is platform admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: userData } = await supabase.from("users").select("is_platform_admin").eq("id", user.id).single()

  if (!userData?.is_platform_admin) {
    return NextResponse.json({ error: "Not a platform admin" }, { status: 403 })
  }

  const { name, nationality, description } = await request.json()

  const { data, error } = await supabase
    .from("blacklist")
    .insert({
      name,
      nationality,
      description,
      added_by_user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, entry: data })
}
