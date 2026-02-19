import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's org
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role, organizations(name)")
      .eq("user_id", user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "No gym found" }, { status: 404 })
    }

    const { message } = await request.json()

    // Fetch gym business data for context
    const today = new Date().toISOString().split("T")[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Get bookings
    const { data: todaysBookings } = await supabase
      .from("bookings")
      .select("id, guest_name, status, payment_status, payment_method, payment_amount_thb, booking_time")
      .eq("org_id", membership.org_id)
      .eq("booking_date", today)

    const { data: weekBookings } = await supabase
      .from("bookings")
      .select("id, payment_status, payment_method, payment_amount_thb")
      .eq("org_id", membership.org_id)
      .gte("booking_date", weekAgo)

    const { data: monthBookings } = await supabase
      .from("bookings")
      .select("id, payment_status, payment_method, payment_amount_thb")
      .eq("org_id", membership.org_id)
      .gte("booking_date", monthAgo)

    // Get students with low credits
    const { data: lowCreditStudents } = await supabase
      .from("student_credits")
      .select("credits_remaining, users(full_name, email)")
      .eq("org_id", membership.org_id)
      .lte("credits_remaining", 2)

    // Get trainers
    const { data: trainers } = await supabase
      .from("trainer_profiles")
      .select("display_name, is_available")
      .eq("org_id", membership.org_id)

    // Calculate stats
    const todayStats = {
      total: todaysBookings?.length || 0,
      completed: todaysBookings?.filter((b) => b.status === "completed").length || 0,
      noShows: todaysBookings?.filter((b) => b.status === "no_show").length || 0,
      cash:
        todaysBookings
          ?.filter((b) => b.payment_method === "cash" && b.payment_status === "paid")
          .reduce((sum, b) => sum + (b.payment_amount_thb || 0), 0) || 0,
      card:
        todaysBookings
          ?.filter((b) => b.payment_method === "stripe" && b.payment_status === "paid")
          .reduce((sum, b) => sum + (b.payment_amount_thb || 0), 0) || 0,
    }

    const weekStats = {
      total: weekBookings?.length || 0,
      revenue:
        weekBookings
          ?.filter((b) => b.payment_status === "paid")
          .reduce((sum, b) => sum + (b.payment_amount_thb || 0), 0) || 0,
      cash:
        weekBookings
          ?.filter((b) => b.payment_method === "cash" && b.payment_status === "paid")
          .reduce((sum, b) => sum + (b.payment_amount_thb || 0), 0) || 0,
      card:
        weekBookings
          ?.filter((b) => b.payment_method === "stripe" && b.payment_status === "paid")
          .reduce((sum, b) => sum + (b.payment_amount_thb || 0), 0) || 0,
    }

    const monthStats = {
      total: monthBookings?.length || 0,
      revenue:
        monthBookings
          ?.filter((b) => b.payment_status === "paid")
          .reduce((sum, b) => sum + (b.payment_amount_thb || 0), 0) || 0,
    }

    // Build context for OckOck
    const gymName = (membership.organizations as any)?.name || "Your gym"
    const context = `
You are OckOck, a friendly water buffalo Muay Thai assistant helping gym staff.

GYM: ${gymName}
USER ROLE: ${membership.role}

TODAY'S STATS:
- Bookings: ${todayStats.total}
- Completed: ${todayStats.completed}
- No-shows: ${todayStats.noShows}
- Cash collected: ฿${todayStats.cash.toLocaleString()}
- Card payments: ฿${todayStats.card.toLocaleString()}

THIS WEEK:
- Total bookings: ${weekStats.total}
- Revenue: ฿${weekStats.revenue.toLocaleString()}
- Cash: ฿${weekStats.cash.toLocaleString()}
- Card: ฿${weekStats.card.toLocaleString()}

THIS MONTH:
- Total bookings: ${monthStats.total}
- Revenue: ฿${monthStats.revenue.toLocaleString()}

STUDENTS WITH LOW CREDITS (2 or less):
${lowCreditStudents?.map((s) => `- ${(s.users as any)?.full_name || (s.users as any)?.email}: ${s.credits_remaining} left`).join("\n") || "None"}

TRAINERS:
${trainers?.map((t) => `- ${t.display_name}: ${t.is_available ? "Available" : "Unavailable"}`).join("\n") || "None listed"}

TODAY'S BOOKINGS:
${todaysBookings?.map((b) => `- ${b.booking_time || "No time"}: ${b.guest_name} (${b.status}, ${b.payment_status})`).join("\n") || "No bookings today"}
`

    const systemPrompt = `${context}

PERSONALITY:
You are OckOck - a goofy but fierce water buffalo who loves Muay Thai. You're a supportive coach who celebrates wins and encourages the team. Think Dave from Zombies - funny but caring. Use occasional Thai phrases like "สู้ๆ" (keep fighting) or "ดีมาก" (very good).

Keep responses short and helpful. If asked about business, give specific numbers. Be encouraging about the gym's progress. If something needs attention (like low-credit students), mention it helpfully.`

    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        system: systemPrompt,
        prompt: message,
      })

      return NextResponse.json({ response: text })
    } catch {
      // Fallback if AI fails
      let response = `Hey boss! 🦬 Here's what I see:\n\n`
      response += `**Today**: ${todayStats.total} bookings, ฿${(todayStats.cash + todayStats.card).toLocaleString()} collected\n`
      response += `**This Week**: ฿${weekStats.revenue.toLocaleString()} revenue\n`

      if (lowCreditStudents && lowCreditStudents.length > 0) {
        response += `\n**Heads up**: ${lowCreditStudents.length} students have low credits - might want to check in with them!`
      }

      return NextResponse.json({ response })
    }
  } catch (error) {
    console.error("Admin OckOck error:", error)
    return NextResponse.json({ error: "Failed to process" }, { status: 500 })
  }
}
