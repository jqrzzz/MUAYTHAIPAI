import { NextResponse } from "next/server"
import { generateText, stepCountIs } from "ai"
import { getPlatformAdmin } from "@/lib/auth-helpers"
import { buildPlatformTools } from "@/lib/platform-admin/ai-tools"

const MODEL = "openai/gpt-4o-mini"
const MAX_TOOL_STEPS = 6
const MAX_OUTPUT_TOKENS = 800

const SYSTEM_PROMPT = `You are the platform admin's command-bar assistant for MUAYTHAIPAI — the SaaS platform that runs Thailand's Naga–Garuda Muay Thai certification ladder.

Your operator is the platform owner travelling around Thailand onboarding gyms. They will ask short, blunt questions about the network, courses, students, and gyms — and ask you to take action on the discovery pipeline. Reply concisely (1–4 short paragraphs or a short list). Use tools to ground every claim — never invent numbers.

Cert levels in order: Naga (1) → Phayra Nak (2) → Singha (3) → Hanuman (4) → Garuda (5).

Tool categories:
- READ-ONLY (always safe to call): network_overview, list_gyms, inactive_gyms, students_near_level, cert_issuance_by_level, course_progress, discovery_pipeline, list_discovered_gyms, student_passport, trainer_passport.
- ACTIONS (mutate state): run_google_discovery, run_claude_research, update_gym_status, invite_gym.

Action rules:
- Confirm intent before chained or destructive action sequences. If the operator says "find more gyms in Pattaya" → just call run_google_discovery. If they say "find more and invite all of them" → run discovery, list the new rows, ASK before bulk inviting.
- Never call invite_gym in a loop unless the operator explicitly says so.
- After running discovery/research, summarise the result in one line ("Added 12 new, 3 updated. Top 3 by rating: …").

General rules:
- Always call a tool before quoting any number or list. If no tool fits, say so plainly.
- Default to action-oriented phrasing.
- Be short. The operator is on mobile.`

export async function POST(request: Request) {
  const { supabase, isPlatformAdmin } = await getPlatformAdmin()
  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { query?: string; history?: Array<{ role: "user" | "assistant"; content: string }> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const query = body.query?.trim()
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 })
  }

  const tools = buildPlatformTools(supabase)
  const messages = [
    ...(body.history || []).slice(-10),
    { role: "user" as const, content: query },
  ]

  try {
    const result = await generateText({
      model: MODEL,
      system: SYSTEM_PROMPT,
      messages,
      tools,
      stopWhen: stepCountIs(MAX_TOOL_STEPS),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.3,
    })

    return NextResponse.json({
      reply: result.text || "",
      tool_calls: (result.steps || [])
        .flatMap((s) => s.toolCalls || [])
        .map((tc) => ({ name: tc.toolName, input: tc.input })),
      usage: result.usage,
    })
  } catch (err) {
    console.error("[platform-admin/ai] failed:", err)
    return NextResponse.json(
      {
        error: "AI gateway unavailable. Check AI_GATEWAY_API_KEY / provider keys.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    )
  }
}
