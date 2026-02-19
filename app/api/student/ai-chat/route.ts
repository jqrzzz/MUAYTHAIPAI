import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { message } = await request.json()

  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 })
  }

  // Get student's profile
  const { data: profile } = await supabase.from("users").select("full_name, display_name").eq("id", user.id).single()

  // Get student's notes
  const { data: notes } = await supabase
    .from("student_notes")
    .select(`
      content,
      content_translated,
      note_type,
      created_at,
      organizations(name)
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get student's credits
  const { data: credits } = await supabase
    .from("student_credits")
    .select(`
      credit_type,
      credits_remaining,
      organizations(name)
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)

  // Get student's bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      booking_date,
      status,
      organizations(name),
      services(name)
    `)
    .eq("user_id", user.id)
    .order("booking_date", { ascending: false })
    .limit(10)

  // Get student's certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      level,
      level_number,
      issued_at,
      organizations(name)
    `)
    .eq("user_id", user.id)

  // Build context for AI
  const studentName = profile?.full_name || profile?.display_name || "Student"

  const notesContext =
    notes && notes.length > 0
      ? notes
          .map((n: any) => {
            const date = new Date(n.created_at).toLocaleDateString()
            const gym = n.organizations?.name || "Unknown gym"
            const content = n.content_translated || n.content
            return `[${date}] ${gym} - ${n.note_type}: ${content}`
          })
          .join("\n")
      : "No trainer notes yet."

  const creditsContext =
    credits && credits.length > 0
      ? credits
          .map((c: any) => `${c.organizations?.name}: ${c.credits_remaining} ${c.credit_type} remaining`)
          .join(", ")
      : "No active credits."

  const bookingsContext =
    bookings && bookings.length > 0
      ? bookings
          .slice(0, 5)
          .map(
            (b: any) => `${b.booking_date}: ${b.services?.name || "Session"} at ${b.organizations?.name} (${b.status})`,
          )
          .join("\n")
      : "No recent bookings."

  const certsContext =
    certificates && certificates.length > 0
      ? certificates.map((c: any) => `${c.level} (Level ${c.level_number}) from ${c.organizations?.name}`).join(", ")
      : "No certificates yet."

  const systemPrompt = `You are OckOck, a friendly water buffalo Muay Thai coach! You're goofy and playful but also fierce and encouraging - like a supportive best friend who really wants to see students succeed.

Your personality:
- Enthusiastic and encouraging ("Let's go! You're doing great!")
- Goofy humor but always motivating ("Even a water buffalo started somewhere!")  
- Supportive when students struggle ("Hey, every champion had tough days. Keep pushing!")
- Celebratory when they do well ("BOOM! That's what I'm talking about!")
- Occasionally reference being a water buffalo in a fun way
- Keep Thai culture vibes - maybe throw in a "Sawasdee!" or "Chok dee!" (good luck)

You're chatting with ${studentName}. Here's their training data:

TRAINER NOTES:
${notesContext}

CREDIT BALANCE:
${creditsContext}

RECENT BOOKINGS:
${bookingsContext}

CERTIFICATES EARNED:
${certsContext}

Guidelines:
- Be encouraging and upbeat - you're their biggest fan!
- If notes are in Thai, help explain what the trainer said
- Keep responses concise but warm
- If they're running low on credits, gently suggest booking more
- Celebrate their achievements and progress
- If asked about something not in the data, be honest but stay positive`

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      prompt: message,
      maxOutputTokens: 500,
      temperature: 0.8, // Slightly higher for more personality
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("AI chat error:", error)

    return NextResponse.json({
      response: `Sawasdee ${studentName}! 🐃 OckOck is having a little trouble right now, but here's what I know:\n\n💪 Credits: ${creditsContext}\n📅 Recent: ${bookingsContext}\n🏆 Achievements: ${certsContext}\n\nTry asking me again in a moment!`,
    })
  }
}
