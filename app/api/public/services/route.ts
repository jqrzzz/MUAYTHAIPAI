// Public API to fetch services from database
// Used by the public booking flow instead of hard-coded data

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Create a service role client for public access (no auth required)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gymSlug = searchParams.get("gym") || "wisarut-family-gym"

    // Get the organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, timezone")
      .eq("slug", gymSlug)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 })
    }

    // Get active services for this gym
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("*")
      .eq("org_id", org.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (servicesError) {
      throw servicesError
    }

    // Get time slots for this gym
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from("time_slots")
      .select("*")
      .eq("org_id", org.id)
      .eq("is_active", true)

    if (timeSlotsError) {
      throw timeSlotsError
    }

    // Transform services to match the expected format
    const formattedServices = services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description || "",
      price: service.price_thb,
      duration: formatDuration(service.duration_minutes, service.duration_days),
      category: service.category,
      hasCalendly: false, // We don't use Calendly anymore
      requiresTimeSlot: service.requires_time_slot,
      metadata: service.metadata || {},
    }))

    // Group time slots by service
    const timeSlotsByService: Record<string, string[]> = {}
    const defaultTimeSlots: string[] = []

    timeSlots.forEach((slot) => {
      const timeStr = slot.start_time.slice(0, 5) // "08:00:00" -> "08:00"
      if (slot.service_id) {
        if (!timeSlotsByService[slot.service_id]) {
          timeSlotsByService[slot.service_id] = []
        }
        timeSlotsByService[slot.service_id].push(timeStr)
      } else {
        defaultTimeSlots.push(timeStr)
      }
    })

    return NextResponse.json({
      gym: {
        id: org.id,
        name: org.name,
        timezone: org.timezone,
      },
      services: formattedServices,
      timeSlots: {
        byService: timeSlotsByService,
        default:
          defaultTimeSlots.length > 0
            ? defaultTimeSlots
            : ["07:00", "08:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "17:00", "18:00"],
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

function formatDuration(minutes: number | null, days: number | null): string {
  if (days && days > 0) {
    if (days === 1) return "1 Day"
    if (days < 30) return `${days} Days`
    if (days === 30) return "1 Month"
    if (days === 60) return "2 Months"
    return `${days} Days`
  }
  if (minutes && minutes > 0) {
    if (minutes === 60) return "1 Hour"
    if (minutes === 90) return "1.5 Hours"
    if (minutes === 120) return "2 Hours"
    return `${minutes} mins`
  }
  return ""
}
