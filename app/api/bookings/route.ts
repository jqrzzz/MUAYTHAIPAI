import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { WISARUT_GYM_ID } from "@/lib/supabase/types"

// Use service role for API routes (bypasses RLS)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      serviceName,
      guestName,
      guestEmail,
      guestPhone,
      bookingDate,
      bookingTime,
      paymentMethod,
      paymentAmountThb,
      stripePaymentIntentId,
      paymentStatus = "pending",
      status = "confirmed",
      userId,
    } = body

    // Find the service by name to get service_id
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("org_id", WISARUT_GYM_ID)
      .ilike("name", `%${serviceName}%`)
      .single()

    if (serviceError || !service) {
      console.error("Service not found:", serviceName, serviceError)
      const { data: defaultService } = await supabase
        .from("services")
        .select("id")
        .eq("org_id", WISARUT_GYM_ID)
        .limit(1)
        .single()

      if (!defaultService) {
        return NextResponse.json({ error: "No services found" }, { status: 400 })
      }
    }

    const serviceId = service?.id || null

    let finalUserId = userId || null
    if (!finalUserId && guestEmail) {
      const { data: existingUser } = await supabase.from("users").select("id").eq("email", guestEmail).single()

      if (existingUser) {
        finalUserId = existingUser.id
      }
    }

    // Insert booking with user_id if available
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        org_id: WISARUT_GYM_ID,
        service_id: serviceId,
        user_id: finalUserId,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        booking_date: bookingDate,
        booking_time: bookingTime || null,
        status,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        payment_amount_thb: paymentAmountThb,
        stripe_payment_intent_id: stripePaymentIntentId || null,
      })
      .select()
      .single()

    if (bookingError) {
      console.error("Failed to create booking:", bookingError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    console.log("Booking created:", booking.id, finalUserId ? `(linked to user ${finalUserId})` : "(guest)")

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
