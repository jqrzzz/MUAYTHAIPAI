import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function getMembership() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, membership: null }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  return { supabase, membership }
}

export async function GET() {
  const { supabase, membership } = await getMembership()
  if (!membership) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: courses, error } = await supabase
    .from("courses")
    .select("*, course_modules(id, lessons(id))")
    .eq("org_id", membership.org_id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = (courses || []).map((row: Record<string, unknown>) => {
    const { course_modules: mods, ...course } = row as Record<string, unknown>
    const modules = (mods ?? []) as { lessons: unknown[] }[]
    return {
      ...course,
      module_count: modules.length,
      lesson_count: modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0),
    }
  })

  return NextResponse.json({ courses: result })
}

export async function POST(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()
  const { title, slug } = body

  if (!title || !slug) {
    return NextResponse.json({ error: "title and slug are required" }, { status: 400 })
  }

  const allowed = [
    "title", "slug", "description", "short_description", "difficulty", "category",
    "certificate_level", "is_free", "price_thb", "status", "cover_image_url",
    "display_order", "is_featured",
  ]
  const insert: Record<string, unknown> = { org_id: membership.org_id }
  for (const key of allowed) {
    if (key in body) insert[key] = body[key]
  }

  const { data, error } = await supabase
    .from("courses")
    .insert(insert)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ course: data })
}

export async function PATCH(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const allowed = [
    "title", "slug", "description", "short_description", "difficulty", "category",
    "certificate_level", "is_free", "price_thb", "status", "cover_image_url",
    "display_order", "is_featured", "published_at", "estimated_hours",
  ]
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in updates) filtered[key] = updates[key]
  }

  const { data, error } = await supabase
    .from("courses")
    .update(filtered)
    .eq("id", id)
    .eq("org_id", membership.org_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ course: data })
}

export async function DELETE(request: Request) {
  const { supabase, membership } = await getMembership()
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id)
    .eq("org_id", membership.org_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
