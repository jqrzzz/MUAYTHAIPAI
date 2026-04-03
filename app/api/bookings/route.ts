import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { notifyNewBooking } from "@/lib/notifications"

// Use service role for API routes (bypasses RLS)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      serviceName,
      service_id: directServiceId,
      guestName,
      guest_name,
      guestEmail,
      guest_email,
      guestPhone,
      guest_phone,
      bookingDate,
      booking_date,
      bookingTime,
      booking_time,
      paymentMethod,
      payment_method,
      paymentAmountThb,
      payment_amount_thb,
      payment_currency,
      stripePaymentIntentId,
      paymentStatus = "pending",
      payment_status,
      status = "confirmed",
      userId,
      orgId,
      org_id,
    } = body

    // Normalize field names (support both camelCase and snake_case)
    const finalGuestName = guestName || guest_name
    const finalGuestEmail = guestEmail || guest_email
    const finalGuestPhone = guestPhone || guest_phone
    const finalBookingDate = bookingDate || booking_date
    const finalBookingTime = bookingTime || booking_time
    const finalPaymentMethod = paymentMethod || payment_method
    const finalPaymentAmountThb = paymentAmountThb || payment_amount_thb
    const finalPaymentStatus = payment_status || paymentStatus

    // Resolve org_id: use provided value, or look up from the service
    let resolvedOrgId = orgId || org_id

    if (!resolvedOrgId && serviceName) {
      const { data: serviceMatch } = await supabase
        .from("services")
        .select("org_id")
        .ilike("name", `%${serviceName}%`)
        .limit(1)
        .single()
      resolvedOrgId = serviceMatch?.org_id
    }

    if (!resolvedOrgId) {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 })
    }

    // Resolve service_id: use direct ID if provided, otherwise look up by name
    let serviceId = directServiceId || null
    let resolvedServiceName = serviceName || ""

    if (!serviceId && serviceName) {
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("id, name")
        .eq("org_id", resolvedOrgId)
        .ilike("name", `%${serviceName}%`)
        .single()

      if (serviceError || !service) {
        console.error("Service not found:", serviceName, serviceError)
      } else {
        serviceId = service.id
        resolvedServiceName = service.name
      }
    } else if (serviceId && !resolvedServiceName) {
      // Look up service name for notifications
      const { data: service } = await supabase
        .from("services")
        .select("name")
        .eq("id", serviceId)
        .single()
      resolvedServiceName = service?.name || "Session"
    }

    let finalUserId = userId || null
    if (!finalUserId && finalGuestEmail) {
      const { data: existingUser } = await supabase.from("users").select("id").eq("email", finalGuestEmail).single()

      if (existingUser) {
        finalUserId = existingUser.id
      }
    }

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        org_id: resolvedOrgId,
        service_id: serviceId,
        user_id: finalUserId,
        guest_name: finalGuestName,
        guest_email: finalGuestEmail,
        guest_phone: finalGuestPhone || null,
        booking_date: finalBookingDate,
        booking_time: finalBookingTime || null,
        status,
        payment_status: finalPaymentStatus,
        payment_method: finalPaymentMethod,
        payment_amount_thb: finalPaymentAmountThb,
        payment_currency: payment_currency || null,
        stripe_payment_intent_id: stripePaymentIntentId || null,
      })
      .select()
      .single()

    if (bookingError) {
      console.error("Failed to create booking:", bookingError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    console.log("Booking created:", booking.id, finalUserId ? `(linked to user ${finalUserId})` : "(guest)")

    // Fire notification (non-blocking — don't let notification failure break booking)
    notifyNewBooking({
      orgId: resolvedOrgId,
      customerName: finalGuestName || "Guest",
      customerEmail: finalGuestEmail,
      serviceName: resolvedServiceName || "Session",
      bookingDate: finalBookingDate,
      bookingTime: finalBookingTime,
      amount: finalPaymentAmountThb || 0,
      paymentMethod: finalPaymentMethod === "stripe" ? "stripe" : "cash",
      paymentStatus: finalPaymentStatus,
    }).catch((err) => console.error("[notifications] Failed:", err))

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
