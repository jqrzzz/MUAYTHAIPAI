import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { notifyNewBooking } from "@/lib/notifications"

// Use service role for API routes (bypasses RLS)
const supabase = createServiceClient()

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

    // Resolve org_id. The normal booking UI always sends the gym's id
    // (gymInfo.id from /api/public/services), and the cash + Stripe
    // flows carry it through — so this is almost always a direct hit.
    let resolvedOrgId = orgId || org_id

    // Fallback ONLY when no org was given: resolve from the service
    // name. Critically, refuse to guess if that name matches services
    // in more than one gym. A silent cross-gym match is the worst
    // booking bug on a multi-tenant platform — the customer thinks
    // they're booked, but the row lands under the wrong gym and the
    // real gym never sees it. Better to fail loudly and make the
    // caller name the gym. (With a single gym today this resolves to
    // exactly one org, so nothing changes for Muay Thai Pai.)
    if (!resolvedOrgId && serviceName) {
      const { data: serviceMatches } = await supabase
        .from("services")
        .select("org_id")
        .ilike("name", `%${serviceName}%`)
        .limit(5)

      const distinctOrgs = Array.from(
        new Set((serviceMatches ?? []).map((s) => s.org_id)),
      )

      if (distinctOrgs.length === 1) {
        resolvedOrgId = distinctOrgs[0]
      } else if (distinctOrgs.length > 1) {
        return NextResponse.json(
          {
            error:
              "Couldn't tell which gym this booking is for. Please book from the gym's own page so we file it correctly.",
          },
          { status: 400 },
        )
      }
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
