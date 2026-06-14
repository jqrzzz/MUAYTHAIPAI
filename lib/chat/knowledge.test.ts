import { describe, it, expect } from "vitest"
import { renderKnowledgeBlock, type GymKnowledge } from "@/lib/chat/knowledge"

// renderKnowledgeBlock is the gym-facts half of the concierge system prompt.
// It must be deterministic (prompt-cacheable) and only render sections that
// have content — these tests pin that contract.

function makeKb(overrides: Partial<GymKnowledge> = {}): GymKnowledge {
  return {
    orgId: "org-1",
    orgName: "Wisarut Family Gym",
    description: "Three generations of krus in Pai.",
    city: "Pai",
    province: "Mae Hong Son",
    country: "Thailand",
    timezone: "Asia/Bangkok",
    contactEmail: "hello@example.com",
    contactPhone: "+66 1 234 5678",
    whatsapp: null,
    instagram: null,
    facebook: null,
    website: null,
    services: [
      {
        name: "Private Lesson",
        description: "1-on-1 with a kru",
        category: "training",
        price_thb: 1000,
        price_usd: null,
        duration_minutes: 60,
        duration_days: null,
      },
    ],
    schedule: [
      { day_of_week: 1, start_time: "08:00", end_time: "09:30", service_name: "Group Session" },
    ],
    faqs: [{ category: "pricing", question: "How much?", answer: "฿1,000 per hour." }],
    trainers: [
      { display_name: "Kru Somchai", title: "Head Trainer", specialties: ["clinch"], bio: null },
    ],
    persona: null,
    ...overrides,
  }
}

describe("renderKnowledgeBlock", () => {
  it("renders the gym header, location, and contact line", () => {
    const block = renderKnowledgeBlock(makeKb())
    expect(block).toContain("# Gym: Wisarut Family Gym")
    expect(block).toContain("Location: Pai, Mae Hong Son, Thailand")
    expect(block).toContain("email: hello@example.com")
    expect(block).toContain("phone: +66 1 234 5678")
  })

  it("renders services with formatted THB price and duration", () => {
    const block = renderKnowledgeBlock(makeKb())
    expect(block).toContain("## Services & Pricing")
    expect(block).toContain("- Private Lesson (training · ฿1,000 · 60 min)")
    expect(block).toContain("1-on-1 with a kru")
  })

  it("renders the schedule with day names", () => {
    const block = renderKnowledgeBlock(makeKb())
    expect(block).toContain("## Weekly Schedule")
    expect(block).toContain("- Monday: 08:00–09:30 Group Session")
  })

  it("renders trainers and FAQs", () => {
    const block = renderKnowledgeBlock(makeKb())
    expect(block).toContain("- Kru Somchai — Head Trainer")
    expect(block).toContain("Specialties: clinch")
    expect(block).toContain("[pricing] Q: How much?")
    expect(block).toContain("A: ฿1,000 per hour.")
  })

  it("omits sections that have no content", () => {
    const block = renderKnowledgeBlock(
      makeKb({ services: [], schedule: [], faqs: [], trainers: [] }),
    )
    expect(block).not.toContain("## Services & Pricing")
    expect(block).not.toContain("## Weekly Schedule")
    expect(block).not.toContain("## Trainers")
    expect(block).not.toContain("## FAQs")
    // Header still present.
    expect(block).toContain("# Gym: Wisarut Family Gym")
  })

  it("is deterministic — same input, byte-identical output (prompt caching)", () => {
    const kb = makeKb()
    expect(renderKnowledgeBlock(kb)).toBe(renderKnowledgeBlock(makeKb()))
  })

  it("truncates long trainer bios at 240 chars", () => {
    const longBio = "x".repeat(500)
    const block = renderKnowledgeBlock(
      makeKb({
        trainers: [{ display_name: "Kru A", title: null, specialties: null, bio: longBio }],
      }),
    )
    expect(block).toContain("x".repeat(239) + "…")
    expect(block).not.toContain("x".repeat(241))
  })
})
