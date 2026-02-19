import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch notes for a student
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's org membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "trainer"])
    .single()

  if (!membership) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  // Get notes for this student at this org
  const { data: notes, error } = await supabase
    .from("student_notes")
    .select(`
      *,
      trainer:users!student_notes_trainer_id_fkey(full_name, display_name)
    `)
    .eq("org_id", membership.org_id)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ notes })
}

// POST - Add a note for a student
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's org membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "trainer"])
    .single()

  if (!membership) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const body = await request.json()
  const { content, note_type = "session", booking_id } = body

  if (!content || content.trim() === "") {
    return NextResponse.json({ error: "Note content required" }, { status: 400 })
  }

  // Detect if content is Thai (simple check for Thai characters)
  const isThai = /[\u0E00-\u0E7F]/.test(content)
  const contentLanguage = isThai ? "th" : "en"

  // Insert note
  const { data: note, error } = await supabase
    .from("student_notes")
    .insert({
      org_id: membership.org_id,
      student_id: studentId,
      trainer_id: user.id,
      content,
      content_language: contentLanguage,
      note_type,
      booking_id: booking_id || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ note })
}
