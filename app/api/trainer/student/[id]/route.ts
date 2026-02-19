import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
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

  // Fetch student notes with trainer names
  const { data: notes } = await supabase
    .from("student_notes")
    .select(`
      id,
      content,
      note_type,
      created_at,
      trainer_id,
      users:trainer_id (full_name)
    `)
    .eq("student_id", id)
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false })

  // Fetch student booking history at this gym
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_date,
      booking_time,
      status,
      services:service_id (name, category)
    `)
    .eq("user_id", id)
    .eq("org_id", membership.org_id)
    .order("booking_date", { ascending: false })
    .limit(20)

  // Calculate last visit and total sessions
  const completedBookings = bookings?.filter(b => b.status === "completed" || b.status === "confirmed") || []
  const lastVisit = completedBookings.length > 0 ? completedBookings[0].booking_date : null
  const totalSessions = completedBookings.length

  // Format notes with trainer names
  const formattedNotes = (notes || []).map(note => ({
    id: note.id,
    content: note.content,
    note_type: note.note_type,
    created_at: note.created_at,
    trainer_id: note.trainer_id,
    trainer_name: (note.users as { full_name: string | null } | null)?.full_name || "Unknown Trainer"
  }))

  return NextResponse.json({
    notes: formattedNotes,
    bookings: bookings || [],
    lastVisit,
    totalSessions,
  })
}
