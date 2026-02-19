import { NextResponse } from "next/server"
import { EmailService } from "@/lib/email-service"
import { getPaymentSummary } from "@/lib/payment-config"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { customerName, customerEmail, serviceType, bookingDate, bookingTime, amount, paymentMethod, userId } = body

    if (!customerName || !customerEmail || !serviceType || !bookingDate || !amount) {
      console.error("Missing required fields:", { customerName, customerEmail, serviceType, bookingDate, amount })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const emailService = EmailService.getInstance()

    const paymentSummary = getPaymentSummary(amount)

    const bookingData = {
      customerName,
      customerEmail,
      serviceType,
      bookingDate,
      bookingTime,
      amount,
      paymentId: paymentMethod === "cash" ? `CASH-${Date.now()}` : `ONLINE-${Date.now()}`,
      paymentMethod: paymentMethod || "card",
      ...(paymentMethod !== "cash" && {
        amountThb: paymentSummary.thb,
        amountUsd: paymentSummary.usd,
        exchangeRate: paymentSummary.exchangeRate,
      }),
    }

    const [customerEmailSent, staffEmailSent] = await Promise.all([
      emailService.sendBookingConfirmation(bookingData),
      emailService.sendStaffNotification(bookingData),
    ])

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(request.url).origin : ""}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: serviceType,
          guestName: customerName,
          guestEmail: customerEmail,
          bookingDate,
          bookingTime,
          paymentMethod: paymentMethod || "cash",
          paymentAmountThb: amount,
          paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
          status: "confirmed",
          userId: userId || null,
        }),
      })
    } catch (dbError) {
      console.error("Failed to save booking to database:", dbError)
    }

    if (customerEmailSent && staffEmailSent) {
      return NextResponse.json({ success: true, message: "Booking emails sent successfully" })
    } else {
      console.error("Failed to send emails - Customer:", customerEmailSent, "Staff:", staffEmailSent)
      return NextResponse.json({ success: false, message: "Failed to send one or more emails" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending booking emails:", error)
    return NextResponse.json({ error: "Failed to send booking emails" }, { status: 500 })
  }
}
