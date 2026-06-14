import { describe, it, expect } from "vitest"
import {
  TIME_SLOTS,
  getTimeSlotsForService,
  shouldShowTimeSlots,
  getServiceById,
  getServicesByCategory,
  BOOKING_SERVICES,
} from "@/lib/booking-config"

describe("getTimeSlotsForService", () => {
  it("maps service names to their slot sets", () => {
    expect(getTimeSlotsForService("Group Session")).toEqual([...TIME_SLOTS.groupSession])
    expect(getTimeSlotsForService("Private Lesson")).toEqual([...TIME_SLOTS.privateLesson])
    expect(getTimeSlotsForService("Muay Thai For Kids")).toEqual([...TIME_SLOTS.privateLesson])
    expect(getTimeSlotsForService("Naga")).toEqual([...TIME_SLOTS.default])
  })

  it("returns a fresh copy — callers mutating it can't corrupt TIME_SLOTS", () => {
    const slots = getTimeSlotsForService("Group Session")
    slots.push("23:59")
    expect(getTimeSlotsForService("Group Session")).not.toContain("23:59")
    expect(TIME_SLOTS.groupSession).toHaveLength(2)
  })
})

describe("shouldShowTimeSlots", () => {
  it("hides slots only for memberships", () => {
    expect(shouldShowTimeSlots("Gym Membership")).toBe(false)
    expect(shouldShowTimeSlots("Group Session")).toBe(true)
    expect(shouldShowTimeSlots("Private Lesson")).toBe(true)
  })
})

describe("service catalogue", () => {
  it("looks up services by id and category", () => {
    expect(getServiceById("group-session")?.name).toBe("Group Session")
    expect(getServiceById("nope")).toBeUndefined()
    const certs = getServicesByCategory("certificates")
    expect(certs.length).toBeGreaterThan(0)
    expect(certs.every((s) => s.category === "certificates")).toBe(true)
  })

  it("has unique ids and positive prices", () => {
    const ids = BOOKING_SERVICES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of BOOKING_SERVICES) {
      expect(s.price, s.id).toBeGreaterThan(0)
    }
  })
})
