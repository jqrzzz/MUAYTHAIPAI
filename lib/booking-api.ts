// Booking API utilities for Muay Thai Pai
import { PAYMENT_CONFIG, formatPrice } from "./payment-config"

export interface BookingData {
  name: string
  email: string
  phone?: string
  service: string
  date: string
  time?: string
  duration?: string
  notes?: string
  paymentMethod: "stripe" | "cash"
  amount: number
}

export interface PaymentMethod {
  id: string
  name: string
  description: string
  available: boolean
}

export interface BookingResponse {
  success: boolean
  message: string
  bookingId?: string
  error?: string
}

// Available payment methods
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "stripe",
    name: "Credit/Debit Card",
    description: "Pay online with Visa, Mastercard, or other cards",
    available: true,
  },
  {
    id: "cash",
    name: "Cash at Gym",
    description: "Pay when you arrive at the gym",
    available: true,
  },
]

// Create booking data
export function createBookingData(service: string, customerData: Partial<BookingData>): BookingData {
  const amount = PAYMENT_CONFIG[service]?.price || 0

  return {
    name: customerData.name || "",
    email: customerData.email || "",
    phone: customerData.phone || "",
    service,
    date: customerData.date || "",
    time: customerData.time || "",
    duration: customerData.duration || "",
    notes: customerData.notes || "",
    paymentMethod: customerData.paymentMethod || "stripe",
    amount,
  }
}

// Format booking summary
export function formatBookingSummary(booking: BookingData): string {
  return `
Service: ${booking.service}
Amount: ${formatPrice(booking.amount)}
Customer: ${booking.name}
Email: ${booking.email}
${booking.phone ? `Phone: ${booking.phone}` : ""}
${
  booking.date
    ? `Date: ${new Date(booking.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`
    : ""
}
${booking.time ? `Time: ${booking.time}` : ""}
${booking.duration ? `Duration: ${booking.duration}` : ""}
${booking.notes ? `Notes: ${booking.notes}` : ""}
  `.trim()
}

// Get available time slots for a given date
export function getAvailableTimeSlots(date: string): string[] {
  // In a real implementation, this would check your calendar API
  const slots = ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

  // Filter out past times if date is today
  const today = new Date().toISOString().split("T")[0]
  if (date === today) {
    const currentHour = new Date().getHours()
    return slots.filter((slot) => {
      const slotHour = Number.parseInt(slot.split(":")[0])
      return slotHour > currentHour
    })
  }

  return slots
}

// Validate booking data
export function validateBookingData(data: Partial<BookingData>): string[] {
  const errors: string[] = []

  if (!data.name?.trim()) {
    errors.push("Name is required")
  }

  if (!data.email?.trim()) {
    errors.push("Email is required")
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Valid email is required")
  }

  if (!data.service) {
    errors.push("Service selection is required")
  }

  if (!data.date) {
    errors.push("Date is required")
  } else {
    const selectedDate = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      errors.push("Date cannot be in the past")
    }
  }

  if (!data.paymentMethod) {
    errors.push("Payment method is required")
  }

  return errors
}

// Calculate booking total with fees
export function calculateBookingTotal(amount: number, paymentMethod: string): number {
  if (paymentMethod === "stripe") {
    // Add 3.5% Stripe processing fee
    return Math.round(amount * 1.035)
  }
  return amount
}

// Format booking confirmation message
export function formatBookingConfirmation(data: BookingData): string {
  const total = calculateBookingTotal(data.amount, data.paymentMethod)
  const paymentText = data.paymentMethod === "stripe" ? "Paid Online" : "Pay at Gym"

  return `
Booking Confirmed!

Service: ${data.service}
Date: ${new Date(data.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
${data.time ? `Time: ${data.time}` : ""}
${data.duration ? `Duration: ${data.duration}` : ""}

Customer: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ""}

Total: ${formatPrice(total)}
Payment: ${paymentText}

${data.notes ? `Notes: ${data.notes}` : ""}

We'll contact you within 24 hours to confirm your session details.
  `.trim()
}

// Simulate booking creation (replace with real API)
export async function createBooking(data: BookingData): Promise<BookingResponse> {
  try {
    // In a real implementation, this would:
    // 1. Save to database
    // 2. Send confirmation email
    // 3. Add to calendar
    // 4. Process payment if needed

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate mock booking ID
    const bookingId = `MTB-${Date.now()}`

    return {
      success: true,
      message: `Booking confirmed! Reference: ${bookingId}`,
      bookingId,
    }
  } catch (error) {
    console.error("Booking creation failed:", error)
    return {
      success: false,
      message: "Failed to create booking. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
