import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get trainer's org
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .in("role", ["trainer", "admin", "owner"])
    .single()

  if (!membership) {
    return NextResponse.json({ error: "Not a trainer" }, { status: 403 })
  }

  const { content } = await request.json()
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  // Get trainer's name for the response
  const { data: trainerUser } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single()

  // Insert note (append-only, no delete allowed for trainers)
  const { data: note, error } = await supabase
    .from("student_notes")
    .insert({
      student_id: id,
      trainer_id: user.id,
      org_id: membership.org_id,
      content: content.trim(),
      note_type: "general",
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding note:", error)
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 })
  }

  return NextResponse.json({
    note: {
      ...note,
      trainer_name: trainerUser?.full_name || "Unknown Trainer"
    }
  })
}
