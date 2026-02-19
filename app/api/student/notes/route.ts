import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch student's own notes (from all gyms)
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get all notes for this student
  const { data: notes, error } = await supabase
    .from("student_notes")
    .select(`
      *,
      organizations(name, slug),
      trainer:users!student_notes_trainer_id_fkey(full_name, display_name)
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ notes })
}
