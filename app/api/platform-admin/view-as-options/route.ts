/**
 * Returns the pickable list for the platform-admin view-as picker.
 * Mode-driven: ?mode=gym_admin returns gyms, mode=trainer returns
 * trainers (joined with their org), mode=student returns recent users.
 */
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data: actor } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()
  if (!actor?.is_platform_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const mode = url.searchParams.get("mode") || "gym_admin"

  if (mode === "gym_admin") {
    const { data: gyms } = await supabase
      .from("organizations")
      .select("id, name, slug, city")
      .eq("status", "active")
      .order("name")
      .limit(200)
    return NextResponse.json({ gyms: gyms ?? [] })
  }

  if (mode === "trainer") {
    const { data: profiles } = await supabase
      .from("trainer_profiles")
      .select(`
        user_id,
        org_id,
        users:user_id (full_name, email),
        organizations:org_id (name)
      `)
      .order("created_at", { ascending: false })
      .limit(200)
    const trainers = (profiles ?? []).map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = (p as any).users
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const o = (p as any).organizations
      const usr = Array.isArray(u) ? u[0] : u
      const org = Array.isArray(o) ? o[0] : o
      return {
        user_id: p.user_id,
        org_id: p.org_id,
        full_name: usr?.full_name ?? null,
        email: usr?.email ?? null,
        org_name: org?.name ?? null,
      }
    })
    return NextResponse.json({ trainers })
  }

  if (mode === "student") {
    // Recent non-platform-admin users — practical for picking someone
    // to QA the student dashboard.
    const { data: students } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("is_platform_admin", false)
      .order("created_at", { ascending: false })
      .limit(50)
    return NextResponse.json({ students: students ?? [] })
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
}
