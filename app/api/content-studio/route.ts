import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .single()

  const isPlatformAdmin = userData?.is_platform_admin
  if (!isPlatformAdmin && !membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const limit = parseInt(searchParams.get("limit") || "50")

  let query = supabase
    .from("social_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (isPlatformAdmin && !searchParams.get("org_id")) {
    query = query.is("org_id", null)
  } else if (membership) {
    query = query.eq("org_id", membership.org_id)
  }

  if (status) {
    query = query.eq("status", status)
  }

  const { data: posts, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("id, platform, account_name, is_active")
    .eq("org_id", membership?.org_id || "00000000-0000-0000-0000-000000000000")

  return NextResponse.json({
    posts: posts || [],
    accounts: accounts || [],
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single()

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .single()

  const isPlatformAdmin = userData?.is_platform_admin
  if (!isPlatformAdmin && !membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { action } = body

  if (action === "generate") {
    return handleGenerate(body, supabase, user.id, isPlatformAdmin, membership?.org_id)
  }

  if (action === "save") {
    return handleSave(body, supabase, user.id, isPlatformAdmin, membership?.org_id)
  }

  if (action === "update-status") {
    return handleUpdateStatus(body, supabase)
  }

  if (action === "delete") {
    const { error } = await supabase.from("social_posts").delete().eq("id", body.postId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

async function handleGenerate(
  body: { contentType?: string; topic?: string; platform?: string; campaign?: string },
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  isPlatformAdmin: boolean,
  orgId?: string,
) {
  const contentType = body.contentType || "post"
  const topic = body.topic || ""
  const platform = body.platform || "instagram"
  const campaign = body.campaign || ""

  let context = ""

  if (isPlatformAdmin && !orgId) {
    const { data: gyms } = await supabase
      .from("organizations")
      .select("name, city, province")
      .eq("status", "active")
      .limit(20)

    const { count: totalGyms } = await supabase
      .from("organizations")
      .select("*", { count: "exact", head: true })

    const { count: totalStudents } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_platform_admin", false)

    context = `Brand: MUAYTHAIPAI — Thailand's Muay Thai network connecting gyms, students, and certifications.
Platform stats: ${totalGyms || 0} gyms, ${totalStudents || 0} students across Thailand.
Gyms in network: ${gyms?.map((g) => `${g.name} (${g.city})`).join(", ") || "Various gyms across Thailand"}
Products: Online classes (฿299/mo), 5-level certification (Naga to Garuda), gym booking platform.
Voice: Authentic, grounded, passionate about Muay Thai culture. Not corporate. We're building the Harvard of Muay Thai certification.
Audience: Travelers coming to Thailand, online learners, gym owners looking for management software.`
  } else if (orgId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, city, province, description")
      .eq("id", orgId)
      .single()

    const { data: services } = await supabase
      .from("services")
      .select("name, price_thb, category")
      .eq("org_id", orgId)
      .eq("is_active", true)

    context = `Gym: ${org?.name || "Muay Thai Gym"} in ${org?.city || "Thailand"}${org?.province ? `, ${org.province}` : ""}
${org?.description ? `About: ${org.description}` : ""}
Services: ${services?.map((s) => `${s.name} (฿${s.price_thb})`).join(", ") || "Various training"}
Part of MUAYTHAIPAI network — Thailand's Muay Thai certification and booking platform.`
  }

  const platformGuidance: Record<string, string> = {
    instagram: "Instagram post. Use line breaks for readability. 3-8 relevant hashtags at the end. Emojis welcome but don't overdo it.",
    facebook: "Facebook post. Conversational tone. Can be slightly longer. 1-3 hashtags max.",
    tiktok: "TikTok caption. Short, punchy, hook-first. Trending hashtags. Under 150 characters for the main line.",
    blog: "Blog post intro paragraph + 3-5 section headings with brief descriptions. SEO-friendly. Target keyword in first sentence.",
    email: "Email subject line + preview text + body (3 short paragraphs). Friendly, direct, with one clear CTA.",
  }

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: `You create social media and marketing content for Muay Thai brands.
${context}

Rules:
- Authentic voice, never corporate or salesy
- ${platformGuidance[platform] || platformGuidance.instagram}
- Content type: ${contentType}
${campaign ? `- Campaign theme: ${campaign}` : ""}
- Always include a call to action (subtle, not pushy)
- Reference real aspects of the gym/platform when possible

Output format:
CAPTION:
[the main content]

HASHTAGS:
[comma-separated hashtags without #]`,
      prompt: topic
        ? `Create a ${contentType} about: ${topic}`
        : `Create a ${contentType} that would perform well this week. Be creative and timely.`,
    })

    const captionMatch = text.match(/CAPTION:\s*([\s\S]*?)(?=HASHTAGS:|$)/i)
    const hashtagMatch = text.match(/HASHTAGS:\s*([\s\S]*?)$/i)

    const caption = captionMatch?.[1]?.trim() || text
    const hashtags = hashtagMatch?.[1]
      ?.trim()
      .split(/[,\n]/)
      .map((h) => h.trim().replace(/^#/, ""))
      .filter(Boolean) || []

    return NextResponse.json({
      caption,
      hashtags,
      contentType,
      platform,
      campaign: campaign || null,
      aiPrompt: topic || "auto-generated",
    })
  } catch (error) {
    console.error("Content generation error:", error)
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 })
  }
}

async function handleSave(
  body: { caption: string; hashtags?: string[]; contentType?: string; platform?: string[]; campaign?: string; scheduledFor?: string; status?: string; aiGenerated?: boolean; aiPrompt?: string; mediaUrl?: string },
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  isPlatformAdmin: boolean,
  orgId?: string,
) {
  const { data: post, error } = await supabase
    .from("social_posts")
    .insert({
      org_id: isPlatformAdmin && !orgId ? null : orgId,
      created_by: userId,
      platform: body.platform || [],
      content_type: body.contentType || "post",
      caption: body.caption,
      hashtags: body.hashtags || [],
      media_url: body.mediaUrl || null,
      status: body.status || "draft",
      scheduled_for: body.scheduledFor || null,
      campaign: body.campaign || null,
      ai_generated: body.aiGenerated ?? true,
      ai_prompt: body.aiPrompt || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post })
}

async function handleUpdateStatus(
  body: { postId: string; status: string },
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const updates: Record<string, unknown> = { status: body.status, updated_at: new Date().toISOString() }
  if (body.status === "posted") {
    updates.posted_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from("social_posts")
    .update(updates)
    .eq("id", body.postId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
