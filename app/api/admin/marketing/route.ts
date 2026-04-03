import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { generateText } from "ai"

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/marketing — fetch marketing dashboard data
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const orgId = membership.org_id

  // 1. Find inactive students (no booking in last 14 days but had at least one before)
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  // Get all students who have booked at this gym
  const { data: allStudentBookings } = await serviceClient
    .from("bookings")
    .select("user_id, guest_email, guest_name, booking_date")
    .eq("org_id", orgId)
    .not("user_id", "is", null)
    .order("booking_date", { ascending: false })

  // Group by user, find last booking date
  const studentMap = new Map<string, { userId: string; lastBooking: string; name: string; email: string }>()
  for (const b of allStudentBookings || []) {
    if (!b.user_id) continue
    if (!studentMap.has(b.user_id)) {
      studentMap.set(b.user_id, {
        userId: b.user_id,
        lastBooking: b.booking_date,
        name: b.guest_name || "",
        email: b.guest_email || "",
      })
    }
  }

  // Enrich with user data
  const studentIds = Array.from(studentMap.keys())
  const { data: users } = await serviceClient
    .from("users")
    .select("id, full_name, email")
    .in("id", studentIds.length > 0 ? studentIds : ["__none__"])

  const userMap = new Map((users || []).map((u) => [u.id, u]))

  const inactiveStudents = Array.from(studentMap.values())
    .filter((s) => new Date(s.lastBooking) < fourteenDaysAgo)
    .map((s) => {
      const u = userMap.get(s.userId)
      return {
        userId: s.userId,
        name: u?.full_name || s.name || "Unknown",
        email: u?.email || s.email,
        lastBooking: s.lastBooking,
        daysSince: Math.floor((Date.now() - new Date(s.lastBooking).getTime()) / (1000 * 60 * 60 * 24)),
      }
    })
    .sort((a, b) => a.daysSince - b.daysSince)
    .slice(0, 20)

  // 2. Get gym context for content ideas
  const { data: org } = await supabase
    .from("organizations")
    .select("name, city, description")
    .eq("id", orgId)
    .single()

  const { data: recentBookings } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("org_id", orgId)
    .gte("booking_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])

  const weeklyStats = {
    totalBookings: recentBookings?.length || 0,
    completed: recentBookings?.filter((b) => b.status === "completed").length || 0,
    totalStudents: studentMap.size,
    inactiveCount: inactiveStudents.length,
  }

  return NextResponse.json({
    inactiveStudents,
    gymName: org?.name || "Your Gym",
    gymCity: org?.city || "",
    gymDescription: org?.description || "",
    weeklyStats,
  })
}

// POST /api/admin/marketing — generate AI content
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const body = await request.json()
  const { action, context } = body

  // Fetch gym info for context
  const { data: org } = await supabase
    .from("organizations")
    .select("name, city, description, province")
    .eq("id", membership.org_id)
    .single()

  const { data: services } = await supabase
    .from("services")
    .select("name, price_thb, category")
    .eq("org_id", membership.org_id)
    .eq("is_active", true)

  const gymContext = `Gym: ${org?.name || "Muay Thai Gym"} in ${org?.city || "Thailand"}${org?.province ? `, ${org.province}` : ""}
${org?.description ? `About: ${org.description}` : ""}
Services: ${services?.map((s) => `${s.name} (${s.price_thb} THB)`).join(", ") || "Various training sessions"}`

  try {
    if (action === "re-engage") {
      // Generate a friendly re-engagement message
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        system: `You write friendly, short re-engagement messages for a Muay Thai gym.
Messages are sent via WhatsApp or SMS to former students who haven't visited recently.
Keep it warm, personal, and under 50 words. Don't be pushy. Include a Thai greeting.
${gymContext}`,
        prompt: `Write a friendly message for ${context.studentName} who last visited ${context.daysSince} days ago. Make it feel personal, not like a template.`,
      })

      return NextResponse.json({ message: text })
    }

    if (action === "content-ideas") {
      // Generate social media content ideas
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        system: `You generate social media post ideas for a Muay Thai gym.
Each idea should include: a short caption (under 100 words) and a content type (photo, video, story, reel).
Write 3 ideas. Format each as:
TYPE: [photo/video/story/reel]
CAPTION: [the caption text]
---
Make them authentic, not corporate. These are small Thai gyms, not big chains.
${gymContext}`,
        prompt: `Generate 3 social media post ideas for this week. Context: ${context.weeklyStats?.totalBookings || 0} bookings this week, ${context.weeklyStats?.totalStudents || 0} total students.${context.extraContext ? ` ${context.extraContext}` : ""}`,
      })

      // Parse the ideas
      const ideas = text.split("---").filter(Boolean).map((block) => {
        const typeMatch = block.match(/TYPE:\s*(.+)/i)
        const captionMatch = block.match(/CAPTION:\s*([\s\S]+?)(?=$)/i)
        return {
          type: typeMatch?.[1]?.trim().toLowerCase() || "photo",
          caption: captionMatch?.[1]?.trim() || block.trim(),
        }
      }).filter((idea) => idea.caption.length > 5)

      return NextResponse.json({ ideas })
    }

    if (action === "lead-reply") {
      // Generate a reply to a lead message
      const { data: faqs } = await supabase
        .from("gym_faqs")
        .select("question, answer")
        .eq("org_id", membership.org_id)
        .eq("is_active", true)

      const { data: settings } = await supabase
        .from("org_settings")
        .select("operating_hours")
        .eq("org_id", membership.org_id)
        .single()

      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        system: `You reply to customer inquiries for a Muay Thai gym. Keep responses friendly, concise (under 100 words), and helpful.
Use "Sawadee krub" as greeting when appropriate. Be encouraging about beginners.
${gymContext}
${faqs?.length ? `FAQs:\n${faqs.map((f) => `Q: ${f.question} A: ${f.answer}`).join("\n")}` : ""}
${settings?.operating_hours ? `Hours: ${JSON.stringify(settings.operating_hours)}` : ""}`,
        prompt: `Customer message: "${context.customerMessage}"\n\nWrite a helpful reply:`,
      })

      return NextResponse.json({ reply: text })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Marketing AI error:", error)
    return NextResponse.json({
      error: "AI generation failed",
      fallback: true,
    }, { status: 500 })
  }
}
