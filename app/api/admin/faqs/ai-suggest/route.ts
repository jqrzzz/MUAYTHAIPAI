import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateObject } from "ai"
import { z } from "zod"
import { CERTIFICATION_LEVELS } from "@/lib/certification-levels"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MODEL = "openai/gpt-4o-mini"

const SuggestionSchema = z.object({
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
        category: z
          .enum([
            "general",
            "training",
            "pricing",
            "accommodation",
            "certification",
            "logistics",
            "culture",
          ])
          .default("general"),
      })
    )
    .min(1)
    .max(20),
  notes: z.string().optional().describe("One sentence operator hint about gaps"),
})

/**
 * Generate a starter set of high-quality FAQ Q&A pairs grounded in
 * THIS gym's actual data — services, trainers, hours, cert levels
 * they issue. Operator reviews + keeps the ones that fit, then they're
 * inserted via the existing /api/admin/faqs POST.
 */
export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership || !["owner", "admin"].includes(String(membership.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const orgId = membership.org_id

  // Pull what we know about the gym
  const [orgRes, servicesRes, trainersRes, settingsRes, certsRes] =
    await Promise.all([
      supabase
        .from("organizations")
        .select(
          "name, name_th, description, city, province, country, address, " +
            "phone, email, website, instagram"
        )
        .eq("id", orgId)
        .single(),
      supabase
        .from("services")
        .select("name, description, category, price_thb, duration_minutes, duration_days")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("display_order"),
      supabase
        .from("trainer_profiles")
        .select("display_name, title, bio, specialties, years_experience")
        .eq("org_id", orgId)
        .eq("is_available", true),
      supabase.from("org_settings").select("operating_hours").eq("org_id", orgId).single(),
      supabase
        .from("certificates")
        .select("level")
        .eq("org_id", orgId)
        .eq("status", "active"),
    ])

  const org = orgRes.data
  if (!org) {
    return NextResponse.json({ error: "Gym not found" }, { status: 404 })
  }

  // Existing FAQ questions — we'll tell the AI to skip these
  const { data: existing } = await supabase
    .from("gym_faqs")
    .select("question")
    .eq("org_id", orgId)
  const existingQuestions = (existing || []).map((r) => r.question.trim())

  const certLevelsIssued = new Set((certsRes.data || []).map((c) => c.level))
  const certLevelsLine = CERTIFICATION_LEVELS.filter((l) => certLevelsIssued.has(l.id))
    .map((l) => l.name)
    .join(", ")

  const factSheet = `
GYM
- Name: ${org.name}${org.name_th ? ` (${org.name_th})` : ""}
- Location: ${[org.city, org.province, org.country].filter(Boolean).join(", ") || "Thailand"}
- Address: ${org.address || "—"}
- Description: ${org.description || "—"}
- Contact: ${[org.phone, org.email, org.website, org.instagram].filter(Boolean).join(" · ") || "—"}

SERVICES
${(servicesRes.data || [])
  .map(
    (s) =>
      `- ${s.name}${s.category ? ` (${s.category})` : ""}: ฿${s.price_thb}${
        s.duration_days
          ? ` · ${s.duration_days}d`
          : s.duration_minutes
            ? ` · ${s.duration_minutes}min`
            : ""
      }${s.description ? ` — ${s.description}` : ""}`
  )
  .join("\n") || "(none configured)"}

TRAINERS
${(trainersRes.data || [])
  .map(
    (t) =>
      `- ${t.display_name}${t.title ? ` · ${t.title}` : ""}${
        t.years_experience ? ` (${t.years_experience}y)` : ""
      }${(t.specialties || []).length > 0 ? ` — ${(t.specialties || []).join(", ")}` : ""}${t.bio ? `\n  ${t.bio.slice(0, 200)}` : ""}`
  )
  .join("\n") || "(none configured)"}

OPERATING HOURS
${
  settingsRes.data?.operating_hours
    ? Object.entries(settingsRes.data.operating_hours as Record<string, { open: string; close: string }>)
        .map(([day, h]) => `- ${day}: ${h.open}–${h.close}`)
        .join("\n")
    : "(not configured)"
}

CERTIFICATION LADDER
${certLevelsLine ? `${org.name} actively issues: ${certLevelsLine}` : `${org.name} is part of the MUAYTHAIPAI Naga–Garuda national certification network but has not issued certificates yet.`}

EXISTING FAQ QUESTIONS (don't duplicate)
${existingQuestions.length > 0 ? existingQuestions.map((q) => `- ${q}`).join("\n") : "(none yet)"}
`.trim()

  try {
    const result = await generateObject({
      model: MODEL,
      schema: SuggestionSchema,
      system: `You write FAQ Q&A pairs for a Muay Thai gym in Thailand. The gym admin will review and keep the ones that fit. Ground every answer in the gym facts provided — don't invent prices, hours, trainer names, or services. Cover the questions a foreign visitor or local student would actually ask: pricing, schedule, what to bring, accommodation, beginner-friendliness, language support, certification, trainer specialties, payment methods. Write answers in the gym's first-person plural ("we open at 7am", "our morning session..."). Keep each answer 1-3 short sentences. Do NOT duplicate questions already in the existing list.`,
      prompt: `Generate 10-15 FAQ pairs based on this gym's actual data:\n\n${factSheet}`,
      temperature: 0.4,
    })

    return NextResponse.json({
      faqs: result.object.faqs,
      notes: result.object.notes,
      model: MODEL,
    })
  } catch (err) {
    console.error("[faqs/ai-suggest] failed:", err)
    return NextResponse.json(
      {
        error: "AI suggestion failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 }
    )
  }
}
