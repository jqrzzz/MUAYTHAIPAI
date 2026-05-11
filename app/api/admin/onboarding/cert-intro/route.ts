/**
 * OckOck-written intro to the Naga–Garuda cert ladder, tailored to
 * the gym's location + voice. Shown on the new "Certifications" step
 * of the onboarding wizard so the cert wedge isn't a generic boiler-
 * plate paragraph.
 *
 * Caller passes nothing — we read the org row from auth context.
 * Plain text response (2-4 sentences). Falls back to a static line if
 * the AI call fails.
 */
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { requireGymAdmin } from "@/lib/auth-helpers"
import { MODEL_VOICE } from "@/lib/ai-models"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const FALLBACK =
  "You can issue verifiable certificates across all five Naga–Garuda levels. Every cert your gym issues becomes a public, shareable proof of training — students get a portable credential, your gym builds a public lineage."

export async function POST() {
  const auth = await requireGymAdmin()
  if (!auth.ok) {
    return NextResponse.json({ intro: FALLBACK })
  }
  const { supabase, orgId } = auth

  const { data: org } = await supabase
    .from("organizations")
    .select("name, city, province, country, description")
    .eq("id", orgId)
    .single()

  const gymName = org?.name || "your gym"
  const locale = [org?.city, org?.province].filter(Boolean).join(", ")

  const sys = `You are OckOck, an AI assistant for Muay Thai gyms in Thailand. Write a 2-3 sentence, second-person intro explaining how this gym can use the Naga–Garuda certification ladder.

Rules:
- Speak directly to the owner ("you", "your students").
- Reference the gym's location if it's helpful — don't shoehorn it in.
- No marketing fluff, no exclamation marks, no emojis.
- No mention of pricing.
- Don't claim things the system doesn't do (no "blockchain", no "AI grades skills").
- Tone: confident, plain, like a senior trainer talking to a new owner.

End on the practical benefit: students get a portable credential, the gym builds a public lineage.`

  const userPrompt = `Write the intro for: ${gymName}${locale ? ` in ${locale}` : ""}.${
    org?.description ? `\nAbout the gym: ${org.description}` : ""
  }`

  try {
    const { text } = await generateText({
      model: MODEL_VOICE,
      system: sys,
      prompt: userPrompt,
    })
    const cleaned = text.trim().slice(0, 600)
    return NextResponse.json({ intro: cleaned || FALLBACK })
  } catch (err) {
    console.error("[onboarding/cert-intro] AI generation failed:", err)
    return NextResponse.json({ intro: FALLBACK })
  }
}
