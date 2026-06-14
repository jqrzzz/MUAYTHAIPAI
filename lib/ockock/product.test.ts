import { describe, it, expect } from "vitest"
import {
  PLAN,
  KEY_FACTS,
  INCLUDED,
  FEATURES,
  PLATFORM_BOOKING_COMMISSION_RATE,
  ockockKnowledgeBlock,
} from "@/lib/ockock/product"

// product.ts is the single source of pitch facts — the deck, pricing page,
// and the landing chat all read from it. These tests pin the promises the
// business model is built on, so a code change that breaks a promise fails
// loudly instead of shipping quietly.

describe("the 0%-of-bookings promise", () => {
  it("the platform commission rate is exactly zero", () => {
    expect(PLATFORM_BOOKING_COMMISSION_RATE).toBe(0)
  })

  it("the marketing facts still make the matching claim", () => {
    expect(KEY_FACTS.some((f) => f.includes("no cut of your bookings"))).toBe(true)
  })
})

describe("plan facts", () => {
  it("has a positive price and a real trial", () => {
    expect(PLAN.priceTHB).toBeGreaterThan(0)
    expect(PLAN.priceUSDCents).toBeGreaterThan(0)
    expect(PLAN.trialDays).toBeGreaterThan(0)
  })

  it("the trial-days fact stays in sync with PLAN", () => {
    expect(KEY_FACTS.some((f) => f.includes(`${PLAN.trialDays} days`))).toBe(true)
  })
})

describe("the landing-chat knowledge block", () => {
  it("contains the pricing facts and the feature list", () => {
    const block = ockockKnowledgeBlock()
    expect(block).toContain(`฿${PLAN.priceTHB}/month`)
    for (const item of INCLUDED) expect(block).toContain(item)
  })

  it("feature copy is non-empty", () => {
    expect(FEATURES.length).toBeGreaterThan(0)
    for (const f of FEATURES) {
      expect(f.title.length).toBeGreaterThan(0)
      expect(f.desc.length).toBeGreaterThan(0)
    }
  })
})
