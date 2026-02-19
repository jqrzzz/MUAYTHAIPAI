import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 })
  }

  const body = await request.json()
  const { customerMessage } = body

  if (!customerMessage) {
    return NextResponse.json({ error: "Customer message is required" }, { status: 400 })
  }

  // Fetch gym info
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.org_id)
    .single()

  // Fetch services
  const { data: services } = await supabase
    .from("services")
    .select("name, description, price_thb, price_usd, duration_minutes, category")
    .eq("org_id", membership.org_id)
    .eq("is_active", true)

  // Fetch FAQs (knowledge base)
  const { data: faqs } = await supabase
    .from("gym_faqs")
    .select("question, answer, category")
    .eq("org_id", membership.org_id)
    .eq("is_active", true)

  // Fetch operating hours
  const { data: settings } = await supabase
    .from("org_settings")
    .select("operating_hours")
    .eq("org_id", membership.org_id)
    .single()

  // Build context for AI
  const gymContext = `
Gym Information:
- Name: ${org?.name || "Our gym"}
- Location: ${org?.address || ""}, ${org?.city || ""}, ${org?.province || ""}
- Phone: ${org?.phone || ""}
- WhatsApp: ${org?.whatsapp || ""}

Services and Pricing:
${services?.map(s => `- ${s.name}: ${s.price_thb} THB${s.price_usd ? ` / $${s.price_usd} USD` : ""} (${s.duration_minutes || s.category || "session"})`).join("\n") || "Contact us for pricing"}

${faqs && faqs.length > 0 ? `
Knowledge Base (Use these answers when relevant):
${faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}
` : ""}

Operating Hours:
${settings?.operating_hours ? JSON.stringify(settings.operating_hours) : "Contact us for hours"}
`

  const systemPrompt = `You are a helpful assistant for ${org?.name || "a Muay Thai gym"} in Thailand. 
You help respond to customer inquiries via WhatsApp, Facebook, and other messaging platforms.

Your responses should be:
- Friendly and welcoming
- Concise (suitable for messaging)
- Include relevant pricing if asked
- Encourage them to visit or book

Here is information about the gym:
${gymContext}

Important:
- If you don't know something specific, suggest they contact the gym directly
- Use "Sawadee krub/ka" as a greeting when appropriate
- Keep responses under 150 words
- Be helpful about beginner-friendliness - most tourists are beginners
`

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      prompt: `Customer message: "${customerMessage}"\n\nGenerate a helpful response:`,
    })

    return NextResponse.json({ 
      response: text,
      context: {
        servicesCount: services?.length || 0,
        faqsCount: faqs?.length || 0,
      }
    })
  } catch (error) {
    console.error("AI generation error:", error)
    return NextResponse.json({ 
      error: "Failed to generate response",
      fallback: "Thank you for your message! Please contact us directly for more information."
    }, { status: 500 })
  }
}
